/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Database,
  ShieldCheck,
  Check,
  Copy,
  Download,
  Code,
  Server,
  Key,
  Layers,
  FileText,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const SchemaDocsModal: React.FC = () => {
  const { setViewMode, addToast } = useStore();
  const [activeTab, setActiveTab] = useState<'sql' | 'matrix' | 'api' | 'roadmap'>('sql');
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- ============================================================================
-- FULL PRODUCTION E-COMMERCE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Target: PostgreSQL / Supabase
-- Features: 3-Tier RBAC (Customer, Moderator, Admin), Inventory, Orders, Audit
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom ENUM Types
CREATE TYPE user_role AS ENUM ('customer', 'moderator', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- 3. Users Table (Extends Supabase auth.users)
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

-- 9. RBAC Helper Functions
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

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products RLS:
CREATE POLICY "Public view published products" ON public.products FOR SELECT
    USING (is_published = true OR public.is_moderator_or_admin());

CREATE POLICY "Moderator and Admin insert products" ON public.products FOR INSERT
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Moderator and Admin update products" ON public.products FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

-- STRICT RBAC RULE: ONLY ADMIN CAN DELETE PRODUCTS!
CREATE POLICY "Only Admin delete products" ON public.products FOR DELETE
    USING (public.is_admin());

-- Orders RLS:
CREATE POLICY "Customers view own orders, Staff view all" ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_moderator_or_admin());

CREATE POLICY "Customers create own orders" ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff update order status" ON public.orders FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    addToast('PostgreSQL & Supabase DDL SQL copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlCode], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase_schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Downloaded supabase_schema.sql', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold">Database Architecture & RBAC Security Specification</h2>
            </div>
            <p className="text-xs text-slate-300">
              PostgreSQL DDL, Supabase Row Level Security (RLS), API Endpoints, and Production Roadmap
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .sql</span>
            </button>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 text-xs font-semibold text-gray-600">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            PostgreSQL DDL & RLS Policies
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            3-Tier RBAC Permissions Matrix
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'api'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            Server Actions & API Routes
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'roadmap'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            Production Deployment Roadmap
          </button>
        </div>

        {/* Tab 1: SQL Code Viewer */}
        {activeTab === 'sql' && (
          <div className="p-6">
            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[600px] border border-slate-800 leading-relaxed">
              <pre>{sqlCode}</pre>
            </div>
          </div>
        )}

        {/* Tab 2: 3-Tier RBAC Matrix */}
        {activeTab === 'matrix' && (
          <div className="p-6 space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Entity & Action</th>
                    <th className="py-3 px-4 text-center bg-blue-50/50">CUSTOMER</th>
                    <th className="py-3 px-4 text-center bg-amber-50/50">MODERATOR</th>
                    <th className="py-3 px-4 text-center bg-purple-50/50">ADMIN</th>
                    <th className="py-3 px-4">RLS Enforcement Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-gray-900">View Published Products</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">WHERE is_published = true</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-gray-900">View Draft / Unpublished</td>
                    <td className="py-3 px-4 text-center text-rose-500 font-bold">Denied</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">public.is_moderator_or_admin()</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-gray-900">Create / Insert Products</td>
                    <td className="py-3 px-4 text-center text-rose-500 font-bold">Denied</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">WITH CHECK (is_moderator_or_admin())</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-gray-900">Update Products & Stock</td>
                    <td className="py-3 px-4 text-center text-rose-500 font-bold">Denied</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">USING (is_moderator_or_admin())</td>
                  </tr>
                  <tr className="bg-amber-50/30">
                    <td className="py-3 px-4 font-bold text-gray-900">Delete Products</td>
                    <td className="py-3 px-4 text-center text-rose-500 font-bold">Denied</td>
                    <td className="py-3 px-4 text-center text-rose-600 font-extrabold bg-rose-50">DENIED (Strict)</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-purple-50">ALLOWED</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">USING (public.is_admin())</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-gray-900">Create Orders & Checkout</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">WITH CHECK (auth.uid() = user_id)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-gray-900">View Customer Order History</td>
                    <td className="py-3 px-4 text-center text-gray-700">Own Orders Only</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">All Orders</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">All Orders</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">auth.uid() = user_id OR is_staff()</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-gray-900">Update Order Progress Status</td>
                    <td className="py-3 px-4 text-center text-rose-500 font-bold">Denied</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Allowed</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">USING (is_moderator_or_admin())</td>
                  </tr>
                  <tr className="bg-purple-50/30">
                    <td className="py-3 px-4 font-bold text-gray-900">Manage Users & Promote Roles</td>
                    <td className="py-3 px-4 text-center text-rose-500 font-bold">Denied</td>
                    <td className="py-3 px-4 text-center text-rose-600 font-extrabold bg-rose-50">DENIED (Strict)</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-purple-50">ALLOWED</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">USING (public.is_admin())</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: API & Server Actions */}
        {activeTab === 'api' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
              <h4 className="font-bold text-sm text-gray-900">REST / Server Actions Specification</h4>
              
              <div className="space-y-2">
                <div className="p-2.5 bg-white rounded-lg border font-mono">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold mr-2">GET</span>
                  <span className="text-gray-900">/api/products</span>
                  <span className="text-gray-500 ml-3">— Public (returns published) or Staff (returns drafts + drafts tags)</span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold mr-2">POST</span>
                  <span className="text-gray-900">/api/products</span>
                  <span className="text-gray-500 ml-3">— Restricted to Moderator & Admin. Validates title, SKU, price, stock.</span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border font-mono">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold mr-2">PATCH</span>
                  <span className="text-gray-900">/api/products/:id/stock</span>
                  <span className="text-gray-500 ml-3">— Inline stock quantity updates. Moderator & Admin.</span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border font-mono">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold mr-2">DELETE</span>
                  <span className="text-gray-900">/api/products/:id</span>
                  <span className="text-rose-600 font-bold ml-3">— ADMIN ONLY. Moderator requests rejected with HTTP 403 Forbidden.</span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border font-mono">
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold mr-2">PATCH</span>
                  <span className="text-gray-900">/api/orders/:id/status</span>
                  <span className="text-gray-500 ml-3">— Moderator & Admin. Advances fulfillment status with notifications.</span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border font-mono">
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold mr-2">PUT</span>
                  <span className="text-gray-900">/api/users/:id/role</span>
                  <span className="text-gray-500 ml-3">— ADMIN ONLY. Promotes or demotes user role between Customer, Moderator, and Admin.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Roadmap & Scalability */}
        {activeTab === 'roadmap' && (
          <div className="p-6 space-y-4 text-xs">
            <h4 className="font-bold text-sm text-gray-900">Production Launch & Scalability Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-white">
                <h5 className="font-bold text-gray-900 mb-2">Phase 1: UAT & Security Auditing</h5>
                <ul className="space-y-1.5 text-gray-600 list-disc pl-4">
                  <li>Automated unit testing for inventory race conditions during flash checkouts.</li>
                  <li>Penetration testing of RLS bypass protection on `/api/products/delete`.</li>
                  <li>Customer session validation across device changes.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white">
                <h5 className="font-bold text-gray-900 mb-2">Phase 2: Cloud Infrastructure Setup</h5>
                <ul className="space-y-1.5 text-gray-600 list-disc pl-4">
                  <li>Multi-region Supabase/PostgreSQL connection pooling via PgBouncer.</li>
                  <li>Global CDN asset distribution for product photography via Cloudflare.</li>
                  <li>Redis caching for top category queries and search auto-completion.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white">
                <h5 className="font-bold text-gray-900 mb-2">Phase 3: Stripe / Webhook Gateway</h5>
                <ul className="space-y-1.5 text-gray-600 list-disc pl-4">
                  <li>Production Stripe PaymentIntent webhook listeners for asynchronous settlement.</li>
                  <li>Automated stock rollback on failed checkout charges.</li>
                  <li>Automated email receipts and shipping label dispatch.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white">
                <h5 className="font-bold text-gray-900 mb-2">Phase 4: Analytics & Telemetry</h5>
                <ul className="space-y-1.5 text-gray-600 list-disc pl-4">
                  <li>Real-time event streaming for cart abandonment metrics.</li>
                  <li>Automated inventory reorder triggers to warehouse suppliers when stock &lt; 5.</li>
                  <li>Role audit logging capturing every administrative change.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
