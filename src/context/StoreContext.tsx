/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  BannerSlide,
  CartItem,
  Category,
  DashboardTab,
  NotificationToast,
  Order,
  OrderStatus,
  Product,
  ShippingAddress,
  User,
  UserRole,
  ViewMode,
} from '../types';
import {
  INITIAL_BANNERS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
} from '../data/mockData';

interface StoreContextType {
  // Current user & Auth state
  currentUser: User | null;
  users: User[];
  isLoggedIn: boolean;
  login: (identifier: string, password?: string) => { success: boolean; message: string; user?: User };
  loginWithGoogle: (googleData: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    phone?: string;
    uid?: string;
  }) => { success: boolean; message: string; user?: User };
  register: (data: { fullName: string; email: string; phone: string; password: string }) => { success: boolean; message: string; user?: User };
  logout: () => void;
  switchUserRole: (role: UserRole) => void;
  setUserById: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => boolean;
  toggleUserBan: (userId: string) => boolean;
  approveUser: (userId: string) => boolean;
  rejectUser: (userId: string) => boolean;

  // Auth Modal State
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  openLoginModal: () => void;
  openRegisterModal: () => void;

  // Customer Settings Modal
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  openSettingsModal: () => void;
  updateUserProfile: (updates: {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    address?: ShippingAddress;
  }) => boolean;

  // View & Navigation
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;

  // Search & Filtering
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  setSortBy: (sort: 'featured' | 'price-asc' | 'price-desc' | 'rating') => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;

  // Products
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => boolean;
  updateProduct: (id: string, updates: Partial<Product>) => boolean;
  updateProductStock: (id: string, newStock: number) => boolean;
  deleteProduct: (id: string) => boolean;
  toggleProductPublish: (id: string) => boolean;

  // Categories (Admin)
  addCategory: (name: string, description?: string) => boolean;
  deleteCategory: (id: string) => boolean;

  // Banners (Admin up to 10)
  banners: BannerSlide[];
  addBanner: (banner: Omit<BannerSlide, 'id' | 'createdAt'>) => boolean;
  updateBanner: (id: string, updates: Partial<BannerSlide>) => boolean;
  deleteBanner: (id: string) => boolean;
  toggleBannerActive: (id: string) => boolean;
  reorderBanners: (orderedIds: string[]) => boolean;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotalCount: number;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;

  // Orders
  orders: Order[];
  createOrder: (shippingAddress: ShippingAddress, paymentMethod: 'card' | 'paypal' | 'cod') => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => boolean;
  userOrders: Order[];

  // RBAC Permission Helpers
  canAccessDashboard: boolean;
  canManageUsers: boolean;
  canDeleteProduct: boolean;
  canEditProduct: boolean;
  canManageCategories: boolean;
  canViewAnalytics: boolean;
  canUpdateOrderStatus: boolean;

  // Feedback & Diagnostics
  toasts: NotificationToast[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY_PRODUCTS = 'xeeroo_store_products_v3';
const STORAGE_KEY_CATEGORIES = 'xeeroo_store_categories_v3';
const STORAGE_KEY_ORDERS = 'xeeroo_store_orders_v3';
const STORAGE_KEY_USERS = 'xeeroo_store_users_v3';
const STORAGE_KEY_CART = 'xeeroo_store_cart_v3';
const STORAGE_KEY_BANNERS = 'xeeroo_store_banners_v3';
const STORAGE_KEY_CURRENT_USER_ID = 'xeeroo_store_current_user_id_v3';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);
      if (!saved || saved === 'null' || saved === '') return null;
      return saved;
    } catch {
      return null;
    }
  });

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return users.find(u => u.id === currentUserId) || null;
  }, [users, currentUserId]);

  const isLoggedIn = !!currentUser;

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openLoginModal = () => {
    setAuthModalTab('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalTab('register');
    setIsAuthModalOpen(true);
  };

  // Customer Settings Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const openSettingsModal = () => {
    if (!currentUser) {
      openLoginModal();
    } else {
      setIsSettingsModalOpen(true);
    }
  };

  // 2. Categories state
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // 3. Products state
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // 4. Banners state (up to 10 banners)
  const [banners, setBanners] = useState<BannerSlide[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BANNERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_BANNERS;
    } catch {
      return INITIAL_BANNERS;
    }
  });

  // 5. Orders state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // 6. Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 7. Navigation / View
  const [viewMode, setViewMode] = useState<ViewMode>('store');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('products');

  // Check URL on mount for direct product link (?product=... or #product=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlProdId =
        params.get('product') ||
        (window.location.hash.startsWith('#product=')
          ? window.location.hash.replace('#product=', '')
          : null);
      if (urlProdId) {
        setSelectedProductId(urlProdId);
        setViewMode('product-detail');
      }
    } catch {
      // In sandboxed environments or iframes
    }

    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlProdId = params.get('product');
        if (urlProdId) {
          setSelectedProductId(urlProdId);
          setViewMode('product-detail');
        } else if (viewMode === 'product-detail') {
          setViewMode('store');
        }
      } catch {
        // fallback
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync URL when product is selected or closed
  useEffect(() => {
    try {
      if (viewMode === 'product-detail' && selectedProductId) {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('product', selectedProductId);
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.replaceState({ product: selectedProductId }, '', newUrl);
      } else if (viewMode === 'store') {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('product')) {
          searchParams.delete('product');
          const queryString = searchParams.toString();
          const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    } catch {
      // ignore
    }
  }, [viewMode, selectedProductId]);

  // 8. Store filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150000]);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  // 9. Notification toasts
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BANNERS, JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER_ID);
    }
  }, [currentUserId]);

  // RBAC permissions check
  const canAccessDashboard = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  const canManageUsers = currentUser?.role === 'admin';
  const canDeleteProduct = currentUser?.role === 'admin';
  const canEditProduct = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  const canManageCategories = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  const canViewAnalytics = currentUser?.role === 'admin';
  const canUpdateOrderStatus = currentUser?.role === 'moderator' || currentUser?.role === 'admin';

  // Auth Operations
  const login = (identifier: string, password?: string) => {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/[^0-9]/g, '');

    const user = users.find(u => {
      const emailMatch = u.email.toLowerCase() === clean;
      const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
      const phoneMatch =
        cleanDigits.length >= 8 &&
        (uPhoneDigits === cleanDigits ||
          uPhoneDigits.endsWith(cleanDigits) ||
          cleanDigits.endsWith(uPhoneDigits));
      return emailMatch || phoneMatch;
    });

    if (!user) {
      addToast('No account found with this email or phone number.', 'error');
      return { success: false, message: 'Account not found with this email or phone number' };
    }

    if (password && user.password && user.password !== password) {
      addToast('Incorrect password entered.', 'error');
      return { success: false, message: 'Incorrect password' };
    }

    if (user.isBanned) {
      addToast('This account has been suspended by administration.', 'error');
      return { success: false, message: 'Account suspended' };
    }

    setCurrentUserId(user.id);
    setIsAuthModalOpen(false);

    if (user.role === 'customer' && user.approvalStatus === 'pending') {
      addToast(`Logged in as ${user.fullName}. Note: Account is pending admin approval.`, 'warning');
    } else {
      addToast(`Welcome back, ${user.fullName}!`, 'success');
    }

    return { success: true, message: 'Logged in successfully', user };
  };

  const loginWithGoogle = (googleData: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    phone?: string;
    uid?: string;
  }) => {
    const cleanEmail = googleData.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      if (existing.isBanned) {
        addToast('This account has been suspended by administration.', 'error');
        return { success: false, message: 'Account suspended' };
      }
      setCurrentUserId(existing.id);
      setIsAuthModalOpen(false);
      addToast(`Signed in with Google! Welcome, ${existing.fullName}.`, 'success');
      return { success: true, message: 'Logged in successfully with Google', user: existing };
    }

    // Auto-register new Google user with pre-approved status
    const newUser: User = {
      id: googleData.uid ? `usr-g-${googleData.uid}` : `usr-g-${Date.now()}`,
      email: googleData.email.trim(),
      fullName: googleData.fullName.trim() || 'Google User',
      phone: googleData.phone || '',
      role: 'customer',
      approvalStatus: 'approved',
      avatarUrl:
        googleData.avatarUrl ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      createdAt: new Date().toISOString(),
      isBanned: false,
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsAuthModalOpen(false);
    addToast(`Account created and signed in with Google! Welcome, ${newUser.fullName}.`, 'success');
    return { success: true, message: 'Signed in with Google', user: newUser };
  };

  const register = (data: { fullName: string; email: string; phone: string; password: string }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanDigits = data.phone.replace(/[^0-9]/g, '');

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      addToast('An account with this email already exists. Please login.', 'error');
      return { success: false, message: 'Email already registered' };
    }

    if (
      cleanDigits.length >= 8 &&
      users.some(u => (u.phone || '').replace(/[^0-9]/g, '') === cleanDigits)
    ) {
      addToast('An account with this phone number already exists. Please login.', 'error');
      return { success: false, message: 'Phone number already registered' };
    }

    const newUser: User = {
      id: `usr-cust-${Date.now()}`,
      email: data.email.trim(),
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      password: data.password,
      role: 'customer',
      approvalStatus: 'pending', // Pending Admin approval!
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
      createdAt: new Date().toISOString(),
      isBanned: false,
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsAuthModalOpen(false);

    addToast(
      'Registration successful! Your account is submitted for XEEROO Admin approval.',
      'info'
    );

    return { success: true, message: 'Registered successfully', user: newUser };
  };

  const logout = () => {
    setCurrentUserId(null);
    addToast('You have been logged out.', 'info');
    if (viewMode === 'dashboard') {
      setViewMode('store');
    }
  };

  // Approval System
  const approveUser = (userId: string): boolean => {
    if (!canManageUsers) {
      addToast('Only Admin can approve customer accounts.', 'error');
      return false;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return false;

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, approvalStatus: 'approved' } : u))
    );
    addToast(`Customer account for ${user.fullName} has been approved!`, 'success');
    return true;
  };

  const rejectUser = (userId: string): boolean => {
    if (!canManageUsers) {
      addToast('Only Admin can reject customer accounts.', 'error');
      return false;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return false;

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, approvalStatus: 'rejected' } : u))
    );
    addToast(`Customer account for ${user.fullName} has been rejected.`, 'warning');
    return true;
  };

  // Role switching helper
  const switchUserRole = (targetRole: UserRole) => {
    const targetUser = users.find(u => u.role === targetRole);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
      addToast(`Switched active profile: ${targetRole.toUpperCase()} (${targetUser.fullName})`, 'info');
      if (targetRole === 'customer' && viewMode === 'dashboard') {
        setViewMode('store');
      }
    }
  };

  const setUserById = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(user.id);
      addToast(`Switched user: ${user.fullName} [${user.role.toUpperCase()}]`, 'success');
      if (user.role === 'customer' && viewMode === 'dashboard') {
        setViewMode('store');
      }
    }
  };

  // User Management (Admin Only)
  const updateUserRole = (userId: string, newRole: UserRole): boolean => {
    if (!canManageUsers) {
      addToast('RBAC Error: Only Admins can modify user roles.', 'error');
      return false;
    }
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          // If promoting to moderator or admin, ensure approved status
          const updatedStatus = newRole !== 'customer' ? 'approved' : u.approvalStatus || 'approved';
          return { ...u, role: newRole, approvalStatus: updatedStatus };
        }
        return u;
      })
    );
    addToast(`User role updated to ${newRole.toUpperCase()}`, 'success');
    return true;
  };

  // Customer Profile & Address Update
  const updateUserProfile = (updates: {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    address?: ShippingAddress;
  }): boolean => {
    if (!currentUser) {
      addToast('You must be signed in to update your profile.', 'error');
      return false;
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            ...(updates.fullName !== undefined && { fullName: updates.fullName.trim() }),
            ...(updates.email !== undefined && { email: updates.email.trim() }),
            ...(updates.phone !== undefined && { phone: updates.phone.trim() }),
            ...(updates.password !== undefined && updates.password.trim() !== '' && { password: updates.password }),
            ...(updates.address !== undefined && { address: updates.address }),
          };
        }
        return u;
      })
    );

    addToast('Profile & settings updated successfully!', 'success');
    return true;
  };

  const toggleUserBan = (userId: string): boolean => {
    if (!canManageUsers) {
      addToast('RBAC Error: Only Admins can ban/unban users.', 'error');
      return false;
    }
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, isBanned: !u.isBanned } : u))
    );
    addToast(`User status updated`, 'info');
    return true;
  };

  // Banner Management (Admin/Staff up to 10 banners)
  const addBanner = (bannerData: Omit<BannerSlide, 'id' | 'createdAt'>): boolean => {
    if (!canAccessDashboard) {
      addToast('Access Denied: Only Staff can add banners.', 'error');
      return false;
    }

    if (banners.length >= 10) {
      addToast('Maximum 10 banners limit reached. Delete or edit existing banners.', 'error');
      return false;
    }

    const newBanner: BannerSlide = {
      ...bannerData,
      id: `banner-${Date.now()}`,
      order: banners.length + 1,
      createdAt: new Date().toISOString(),
    };

    setBanners(prev => [...prev, newBanner]);
    addToast(`Banner "${newBanner.title}" created successfully (${banners.length + 1}/10)`, 'success');
    return true;
  };

  const updateBanner = (id: string, updates: Partial<BannerSlide>): boolean => {
    if (!canAccessDashboard) {
      addToast('Access Denied: Only Staff can edit banners.', 'error');
      return false;
    }

    setBanners(prev =>
      prev.map(b => (b.id === id ? { ...b, ...updates } : b))
    );
    addToast('Banner updated successfully', 'success');
    return true;
  };

  const deleteBanner = (id: string): boolean => {
    if (!canAccessDashboard) {
      addToast('Access Denied: Only Staff can delete banners.', 'error');
      return false;
    }

    if (banners.length <= 1) {
      addToast('At least 1 banner must remain active in the storefront.', 'warning');
      return false;
    }

    setBanners(prev => prev.filter(b => b.id !== id));
    addToast('Banner deleted successfully', 'info');
    return true;
  };

  const toggleBannerActive = (id: string): boolean => {
    if (!canAccessDashboard) {
      addToast('Access Denied: Only Staff can modify banners.', 'error');
      return false;
    }

    setBanners(prev =>
      prev.map(b => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
    addToast('Banner status updated', 'info');
    return true;
  };

  const reorderBanners = (orderedIds: string[]): boolean => {
    if (!canAccessDashboard) return false;

    setBanners(prev => {
      const bannerMap = new Map(prev.map(b => [b.id, b]));
      const reordered: BannerSlide[] = [];
      orderedIds.forEach((id, index) => {
        const item = bannerMap.get(id);
        if (item) {
          reordered.push({ ...item, order: index + 1 });
        }
      });
      return reordered;
    });
    addToast('Banners reordered successfully', 'success');
    return true;
  };

  // Product CRUD (RBAC Protected)
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): boolean => {
    if (!canEditProduct) {
      addToast('Access Denied: You must be an Admin or Moderator to create products.', 'error');
      return false;
    }

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.id || 'admin',
      rating: 5.0,
      reviewsCount: 1,
    };

    setProducts(prev => [newProduct, ...prev]);
    addToast(`Product "${newProduct.title}" created successfully`, 'success');
    return true;
  };

  const updateProduct = (id: string, updates: Partial<Product>): boolean => {
    if (!canEditProduct) {
      addToast('Access Denied: Only Staff can update products.', 'error');
      return false;
    }

    setProducts(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              ...updates,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser?.id || 'admin',
            }
          : p
      )
    );
    addToast('Product details updated successfully', 'success');
    return true;
  };

  const updateProductStock = (id: string, newStock: number): boolean => {
    if (!canEditProduct) {
      addToast('Access Denied: Cannot modify inventory levels.', 'error');
      return false;
    }
    const safeStock = Math.max(0, Math.floor(newStock));
    setProducts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, stockQuantity: safeStock, updatedAt: new Date().toISOString(), updatedBy: currentUser?.id || 'admin' }
          : p
      )
    );
    addToast(`Stock level adjusted to ${safeStock} units`, 'info');
    return true;
  };

  const deleteProduct = (id: string): boolean => {
    if (!canDeleteProduct) {
      addToast('Access Denied: Only Admins can permanently delete products.', 'error');
      return false;
    }

    setProducts(prev => prev.filter(p => p.id !== id));
    setCart(prev => prev.filter(item => item.product.id !== id));
    addToast('Product removed from catalog', 'info');
    return true;
  };

  const toggleProductPublish = (id: string): boolean => {
    if (!canEditProduct) {
      addToast('Access Denied: Only Staff can change product visibility.', 'error');
      return false;
    }

    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextState = !p.isPublished;
          addToast(`Product "${p.title}" ${nextState ? 'published to store' : 'hidden (draft)'}`, 'info');
          return { ...p, isPublished: nextState, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
    return true;
  };

  // Category CRUD (Admin & Staff)
  const addCategory = (name: string, description?: string): boolean => {
    if (!canManageCategories) {
      addToast('Access Denied: Only Admin and Staff can add categories.', 'error');
      return false;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newCategory: Category = {
      id: `cat-${slug}-${Date.now().toString(36)}`,
      name,
      slug,
      description,
    };

    setCategories(prev => [...prev, newCategory]);
    addToast(`Category "${name}" created`, 'success');
    return true;
  };

  const deleteCategory = (id: string): boolean => {
    if (!canManageCategories) {
      addToast('Access Denied: Only Admin and Staff can delete categories.', 'error');
      return false;
    }

    const hasProducts = products.some(p => p.categoryId === id);
    if (hasProducts) {
      addToast('Cannot delete category: products are assigned to it.', 'error');
      return false;
    }

    setCategories(prev => prev.filter(c => c.id !== id));
    addToast('Category deleted', 'info');
    return true;
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stockQuantity <= 0) {
      addToast(`Sorry, "${product.title}" is currently out of stock.`, 'warning');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (nextQty > product.stockQuantity) {
          addToast(`Maximum available stock reached (${product.stockQuantity} units)`, 'warning');
          return prev.map(item =>
            item.product.id === product.id ? { ...item, quantity: product.stockQuantity } : item
          );
        }
        addToast(`Updated ${product.title} quantity to ${nextQty}`, 'success');
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      } else {
        const initialQty = Math.min(quantity, product.stockQuantity);
        addToast(`Added "${product.title}" to cart`, 'success');
        return [...prev, { product, quantity: initialQty }];
      }
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const safeQty = Math.min(quantity, product.stockQuantity);
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: safeQty } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotalCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    // 5% standard VAT/Tax
    return Math.round(cartSubtotal * 0.05);
  }, [cartSubtotal]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + cartTax;
  }, [cartSubtotal, cartTax]);

  // Order creation & Inventory Deduction
  const createOrder = (
    shippingAddress: ShippingAddress,
    paymentMethod: 'card' | 'paypal' | 'cod'
  ): Order | null => {
    if (!currentUser) {
      addToast('Please login or register to place your order.', 'error');
      openLoginModal();
      return null;
    }

    // Customer Approval Check
    if (currentUser.role === 'customer' && currentUser.approvalStatus !== 'approved') {
      addToast('Your account is pending XEEROO Admin approval. Placing orders is locked until approved.', 'error');
      return null;
    }

    if (currentUser.isBanned) {
      addToast('Account suspended: Cannot place orders.', 'error');
      return null;
    }

    if (cart.length === 0) {
      addToast('Cannot checkout an empty cart.', 'warning');
      return null;
    }

    // Validate inventory availability
    for (const item of cart) {
      const product = products.find(p => p.id === item.product.id);
      if (!product || product.stockQuantity < item.quantity) {
        addToast(
          `Insufficient stock for "${item.product.title}". Available: ${product ? product.stockQuantity : 0}`,
          'error'
        );
        return null;
      }
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      status: 'pending',
      totalAmount: cartTotal,
      shippingAddress,
      paymentMethod,
      createdAt: nowIso,
      updatedAt: nowIso,
      items: cart.map(item => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        orderId,
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        productTitle: item.product.title,
        productImage: item.product.images[0] || '',
        sku: item.product.sku,
      })),
    };

    // Deduct stock
    setProducts(prev =>
      prev.map(p => {
        const orderedItem = cart.find(ci => ci.product.id === p.id);
        if (orderedItem) {
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - orderedItem.quantity),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    addToast(`Order #${orderId} confirmed successfully!`, 'success');
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus): boolean => {
    if (!canUpdateOrderStatus) {
      addToast('Access Denied: Only Staff can update order status.', 'error');
      return false;
    }

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status, updatedAt: new Date().toISOString() }
          : o
      )
    );
    addToast(`Order #${orderId} marked as ${status.toUpperCase()}`, 'success');
    return true;
  };

  // User-specific orders
  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'customer') {
      return orders.filter(o => o.userId === currentUser.id || o.userEmail === currentUser.email);
    }
    return orders;
  }, [orders, currentUser]);

  // Reset to original mock data
  const resetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setOrders(INITIAL_ORDERS);
    setUsers(INITIAL_USERS);
    setBanners(INITIAL_BANNERS);
    setCart([]);
    setCurrentUserId(INITIAL_USERS[0].id);
    addToast('All demo inventory, banners, orders, and users reset to initial state.', 'info');
  };

  const value: StoreContextType = {
    currentUser,
    users,
    isLoggedIn,
    login,
    loginWithGoogle,
    register,
    logout,
    switchUserRole,
    setUserById,
    updateUserRole,
    toggleUserBan,
    approveUser,
    rejectUser,

    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    openLoginModal,
    openRegisterModal,

    isSettingsModalOpen,
    setIsSettingsModalOpen,
    openSettingsModal,
    updateUserProfile,

    viewMode,
    setViewMode,
    selectedProductId,
    setSelectedProductId,
    dashboardTab,
    setDashboardTab,

    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    inStockOnly,
    setInStockOnly,

    products,
    categories,
    addProduct,
    updateProduct,
    updateProductStock,
    deleteProduct,
    toggleProductPublish,

    addCategory,
    deleteCategory,

    banners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    reorderBanners,

    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotalCount,
    cartSubtotal,
    cartTax,
    cartTotal,

    orders,
    createOrder,
    updateOrderStatus,
    userOrders,

    canAccessDashboard,
    canManageUsers,
    canDeleteProduct,
    canEditProduct,
    canManageCategories,
    canViewAnalytics,
    canUpdateOrderStatus,

    toasts,
    addToast,
    removeToast,
    resetDemoData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
