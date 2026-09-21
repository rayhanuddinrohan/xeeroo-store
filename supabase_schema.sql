-- ============================================================================
-- FULL PRODUCTION E-COMMERCE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Target: PostgreSQL / Supabase
-- Features: 3-Tier RBAC (Customer, Moderator, Admin), Inventory, Orders, Audit
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'moderator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Users Table (Extends Supabase auth.users or standalone auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'customer',
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    sku VARCHAR(64) UNIQUE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================================================
-- 9. HELPER FUNCTIONS FOR RBAC CHECKING
-- ============================================================================

-- Function to get the role of the authenticated caller
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
    current_role user_role;
BEGIN
    SELECT role INTO current_role 
    FROM public.users 
    WHERE id = auth.uid();
    
    RETURN COALESCE(current_role, 'customer'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Shorthand check functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_current_user_role() = 'admin'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_current_user_role() IN ('moderator'::user_role, 'admin'::user_role));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_orders_modtime
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for automatic inventory reduction upon order creation
CREATE OR REPLACE FUNCTION public.reduce_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
    
    IF (SELECT stock_quantity FROM public.products WHERE id = NEW.product_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for product ID: %', NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_reduce_stock
    AFTER INSERT ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION public.reduce_stock_on_order();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- A. USERS POLICIES
--------------------------------------------------------------------------------
-- 1. Users can view their own profile. Moderators and Admins can view all profiles.
CREATE POLICY "Users can view own profile or Staff can view all"
    ON public.users FOR SELECT
    USING (
        auth.uid() = id OR public.is_moderator_or_admin()
    );

-- 2. Users can update their own profile (name, avatar), but NOT their role
CREATE POLICY "Users can update own details"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    );

-- 3. ONLY ADMINS can modify user roles or delete users
CREATE POLICY "Admins have full access to users"
    ON public.users FOR ALL
    USING (public.is_admin());

--------------------------------------------------------------------------------
-- B. CATEGORIES POLICIES
--------------------------------------------------------------------------------
-- 1. Anyone (public & authenticated) can view categories
CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

-- 2. Only Admins can create, update, or delete categories
CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (public.is_admin());

--------------------------------------------------------------------------------
-- C. PRODUCTS POLICIES
--------------------------------------------------------------------------------
-- 1. Public / Customers can only view published products
CREATE POLICY "Public can view published products"
    ON public.products FOR SELECT
    USING (
        is_published = true OR public.is_moderator_or_admin()
    );

-- 2. Moderators and Admins can insert products
CREATE POLICY "Moderators and Admins can insert products"
    ON public.products FOR INSERT
    WITH CHECK (public.is_moderator_or_admin());

-- 3. Moderators and Admins can update products & stock
CREATE POLICY "Moderators and Admins can update products"
    ON public.products FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

-- 4. ONLY Admins can delete products (Moderators are strictly forbidden!)
CREATE POLICY "Only Admins can delete products"
    ON public.products FOR DELETE
    USING (public.is_admin());

--------------------------------------------------------------------------------
-- D. ORDERS POLICIES
--------------------------------------------------------------------------------
-- 1. Customers can view their own orders; Moderators/Admins can view all
CREATE POLICY "Customers view own orders, Staff view all"
    ON public.orders FOR SELECT
    USING (
        auth.uid() = user_id OR public.is_moderator_or_admin()
    );

-- 2. Authenticated Customers can create their own order
CREATE POLICY "Customers can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
    );

-- 3. Moderators and Admins can update order status
CREATE POLICY "Staff can update order status"
    ON public.orders FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

--------------------------------------------------------------------------------
-- E. ORDER ITEMS POLICIES
--------------------------------------------------------------------------------
-- 1. Customers can view their order items; Staff can view all
CREATE POLICY "Customers view own order items, Staff view all"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND (orders.user_id = auth.uid() OR public.is_moderator_or_admin())
        )
    );

-- 2. Customers can insert items for their own orders
CREATE POLICY "Customers insert items for own order"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND orders.user_id = auth.uid()
        )
    );
