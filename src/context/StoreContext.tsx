/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
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
  UserGender,
  ViewMode,
  AppNotification,
} from '../types';
import {
  INITIAL_BANNERS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
} from '../data/mockData';
import {
  signInFirebaseUser,
  sendFirebasePasswordReset,
  fetchFirestoreUserProfile,
  saveFirestoreUserProfile,
  saveFirestoreCustomer,
  fetchFirestoreUsers,
  fetchFirestoreUserByIdentifier,
  normalizeUserRole,
  saveFirestoreProduct,
  deleteFirestoreProduct,
  fetchFirestoreProducts,
  subscribeToFirestoreProducts,
  saveFirestoreCategory,
  fetchFirestoreCategories,
  saveFirestoreOrder,
  fetchFirestoreOrders,
  subscribeToFirestoreOrders,
  subscribeToFirestoreUsers,
  syncAllDataToFirestore,
  testFirestoreConnection,
  signInWithGooglePopup,
  updateFirestoreUserRoleByEmailAndId,
  saveFirestoreNotification,
  subscribeToFirestoreNotifications,
  fetchFirestoreNotifications,
  updateFirestoreNotification,
  deleteFirestoreNotification,
  registerFirebaseUser,
  saveFirestoreTelegramConfig,
  fetchFirestoreTelegramConfig,
  subscribeToFirestoreTelegramConfig,
  db,
} from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { formatBDT } from '../utils/currency';
import {
  getStoredTelegramConfig,
  saveStoredTelegramConfig,
  sendTelegramMessage,
  formatOrderForTelegram,
} from '../utils/telegram';
import { playNotificationChime } from '../utils/audio';
import { TelegramConfig } from '../types';
import {
  calculateShippingCharge,
  getShippingZoneInfo,
  isValidBDPhone,
  normalizeBDPhone,
} from '../utils/shipping';
import { syncBusinessKoroProductsToFirestore } from '../services/productImportService';
import { parseRouteFromLocation, syncBrowserUrl } from '../utils/router';

interface StoreContextType {
  // Telegram Bot Settings
  telegramConfig: TelegramConfig;
  updateTelegramConfig: (config: TelegramConfig) => Promise<boolean>;
  // Current user & Auth state
  currentUser: User | null;
  users: User[];
  isLoggedIn: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginAsAdmin: () => void;
  loginWithGoogle: (googleData: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    phone?: string;
    uid?: string;
  }) => { success: boolean; message: string; user?: User };
  loginWithGooglePopup: () => Promise<{ success: boolean; message: string; user?: User }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    address?: ShippingAddress;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  switchUserRole: (role: UserRole) => void;
  setUserById: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>;
  toggleUserBan: (userId: string) => boolean;
  approveUser: (userId: string) => Promise<boolean>;
  rejectUser: (userId: string) => Promise<boolean>;

  // Cloud Database Synchronization & Status
  dbStatus: {
    isConnected: boolean;
    isSyncing: boolean;
    lastSyncedAt: string | null;
    error: string | null;
    projectId: string;
    productCount: number;
    userCount: number;
    orderCount: number;
  };
  testDbConnection: () => Promise<{ success: boolean; message: string; latency?: number }>;
  syncCatalogToDatabase: () => Promise<{ success: boolean; message: string }>;
  pullCatalogFromDatabase: () => Promise<{ success: boolean; message: string }>;

  // Auth Modal State
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register' | 'forgot-password' | 'verify-otp' | 'admin-login';
  setAuthModalTab: (tab: 'login' | 'register' | 'forgot-password' | 'verify-otp' | 'admin-login') => void;
  openLoginModal: () => void;
  openRegisterModal: () => void;
  openForgotPasswordModal: () => void;

  // OTP Verification & Password Recovery
  pendingRegistration: { fullName: string; email: string; phone: string; password: string; otp: string } | null;
  initiateRegistration: (data: { fullName: string; email: string; phone: string; password: string }) => { success: boolean; message: string; otp?: string };
  verifyOtpAndComplete: (enteredOtp: string) => { success: boolean; message: string; user?: User };
  resendOtp: () => string | null;
  resetPassword: (identifier: string, newPassword?: string) => Promise<{ success: boolean; message: string; isEmailSent?: boolean; canDirectReset?: boolean }>;
  pendingPasswordReset: { identifier: string; email: string; otp: string } | null;
  sendPasswordResetOtp: (identifier: string) => Promise<{ success: boolean; message: string; email?: string }>;
  verifyPasswordResetOtpAndSetPassword: (enteredOtp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  createAdminAccountInDatabase: (data: { fullName: string; email: string; phone?: string; password: string }) => Promise<{ success: boolean; message: string; user?: User }>;

  // Customer Settings Modal
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  settingsModalInitialTab: 'profile' | 'address' | 'security';
  openSettingsModal: (tab?: 'profile' | 'address' | 'security') => void;
  updateUserProfile: (updates: {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    gender?: UserGender;
    address?: ShippingAddress;
  }) => boolean;

  // View & Navigation
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;
  navigateTo: (path: string, options?: { replace?: boolean }) => void;
  navigateToProduct: (productIdOrSlug: string) => void;
  navigateToContact: () => void;
  navigateToCheckout: () => void;
  navigateToOrders: () => void;
  navigateToDashboard: (tab?: DashboardTab) => void;
  navigateToStore: () => void;
  navigateToSchemaDocs: () => void;

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
  addProductReview: (
    productId: string,
    review: { rating: number; comment: string; reviewerName?: string; userGender?: UserGender }
  ) => Promise<boolean>;
  updateProductReview: (
    productId: string,
    reviewId: string,
    updates: { rating: number; comment: string }
  ) => Promise<boolean>;
  deleteProductReview: (productId: string, reviewId: string) => Promise<boolean>;
  syncBusinessKoroProducts: (
    apiKey: string,
    targetCategoryId?: string,
    onProgress?: (synced: number, total: number) => void
  ) => Promise<{ success: boolean; count: number; message: string }>;

  // Notifications (Real-time system)
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  addNotification: (
    notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
  ) => Promise<boolean>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

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

  // Cart & Checkout
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotalCount: number;
  cartSubtotal: number;
  cartTax: number;
  deliveryCharge: number;
  getDeliveryChargeForLocation: (district?: string, thana?: string) => number;
  cartTotal: number;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  openCheckoutModal: () => void;

  // Orders
  orders: Order[];
  createOrder: (
    shippingAddress: ShippingAddress,
    paymentMethod: 'card' | 'paypal' | 'cod' | 'bkash',
    optionalEmail?: string,
    paymentDetails?: { bkashNumber?: string; trxId?: string }
  ) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
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
const STORAGE_KEY_NOTIFICATIONS = 'xeeroo_store_notifications_v3';

export const isPhoneMatch = (p1?: string, p2?: string): boolean => {
  if (!p1 || !p2) return false;
  const d1 = p1.replace(/[^0-9]/g, '');
  const d2 = p2.replace(/[^0-9]/g, '');
  if (d1.length < 8 || d2.length < 8) return false;
  return d1 === d2 || d1.endsWith(d2) || d2.endsWith(d1);
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any legacy mock accounts (admin@xeeroo.com, staff@xeeroo.com, usr-admin-master)
          const cleaned = parsed.filter(
            (u: User) =>
              u.email !== 'admin@xeeroo.com' &&
              u.email !== 'staff@xeeroo.com' &&
              u.id !== 'usr-admin-master' &&
              u.id !== 'usr-mod-staff' &&
              u.id !== 'usr-admin-xeeroo'
          );
          return cleaned;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);
      if (!saved || saved === 'null' || saved === '') return null;
      if (
        saved === 'usr-admin-xeeroo' ||
        saved === 'usr-customer-demo' ||
        saved === 'usr-admin-master' ||
        saved === 'usr-mod-staff'
      ) {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER_ID);
        return null;
      }
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
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot-password' | 'verify-otp' | 'admin-login'>('login');

  // Checkout modal & page state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const openCheckoutModal = () => {
    if (!currentUserId) {
      addToast('Please sign in or create an account to proceed to checkout.', 'warning');
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setViewMode('checkout');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Pending OTP registration state
  const [pendingRegistration, setPendingRegistration] = useState<{
    fullName: string;
    email: string;
    phone: string;
    password: string;
    otp: string;
  } | null>(null);

  const [pendingPasswordReset, setPendingPasswordReset] = useState<{
    identifier: string;
    email: string;
    otp: string;
  } | null>(null);

  // Cloud Database state (Firestore)
  const [dbStatus, setDbStatus] = useState<{
    isConnected: boolean;
    isSyncing: boolean;
    lastSyncedAt: string | null;
    error: string | null;
    projectId: string;
    productCount: number;
    userCount: number;
    orderCount: number;
  }>({
    isConnected: false,
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    projectId: 'xeeroo-store',
    productCount: 0,
    userCount: 0,
    orderCount: 0,
  });

  // Test Database Connection
  const testDbConnection = async () => {
    setDbStatus(prev => ({ ...prev, isSyncing: true }));
    const result = await testFirestoreConnection();
    setDbStatus(prev => ({
      ...prev,
      isSyncing: false,
      isConnected: result.success,
      error: result.success ? null : result.message,
      lastSyncedAt: result.success ? new Date().toLocaleTimeString() : prev.lastSyncedAt,
    }));
    if (result.success) {
      addToast(result.message, 'success');
    } else {
      addToast(`Database Warning: ${result.message}`, 'warning');
    }
    return result;
  };

  // One-click Push / Seed all catalog data to Firestore collections
  const syncCatalogToDatabase = async () => {
    setDbStatus(prev => ({ ...prev, isSyncing: true }));
    addToast('Pushing all products, categories, users & orders to Cloud Database...', 'info');
    const res = await syncAllDataToFirestore(products, categories, users, orders);
    setDbStatus(prev => ({
      ...prev,
      isSyncing: false,
      isConnected: res.success,
      error: res.success ? null : res.message,
      lastSyncedAt: res.success ? new Date().toLocaleTimeString() : prev.lastSyncedAt,
      productCount: res.counts.products,
      userCount: res.counts.users,
      orderCount: res.counts.orders,
    }));
    if (res.success) {
      addToast(res.message, 'success');
    } else {
      addToast(`Sync failed: ${res.message}`, 'error');
    }
    return { success: res.success, message: res.message };
  };

  // One-click Pull latest products, users & categories from Firestore
  const pullCatalogFromDatabase = async () => {
    setDbStatus(prev => ({ ...prev, isSyncing: true }));
    addToast('Pulling latest data from Cloud Database...', 'info');
    try {
      const [dbProds, dbCats, dbUsers, dbOrders] = await Promise.all([
        fetchFirestoreProducts(),
        fetchFirestoreCategories(),
        fetchFirestoreUsers(),
        fetchFirestoreOrders(),
      ]);

      let pulledCount = 0;
      if (dbProds.length > 0) {
        setProducts(dbProds);
        pulledCount += dbProds.length;
      }
      if (dbCats.length > 0) {
        setCategories(dbCats);
      }
      if (dbUsers.length > 0) {
        setUsers(prev => {
          const map = new Map<string, User>();
          prev.forEach(u => map.set(u.id, u));
          dbUsers.forEach(u => map.set(u.id, u));
          return Array.from(map.values());
        });
      }
      if (dbOrders.length > 0) {
        setOrders(dbOrders);
      }

      setDbStatus(prev => ({
        ...prev,
        isSyncing: false,
        isConnected: true,
        lastSyncedAt: new Date().toLocaleTimeString(),
        productCount: dbProds.length,
        userCount: dbUsers.length,
        orderCount: dbOrders.length,
      }));

      addToast(`Pulled ${pulledCount} items from Cloud Database!`, 'success');
      return { success: true, message: `Successfully fetched ${dbProds.length} products.` };
    } catch (err: any) {
      setDbStatus(prev => ({ ...prev, isSyncing: false, error: err.message }));
      addToast(`Pull failed: ${err.message}`, 'error');
      return { success: false, message: err.message || 'Failed to pull data' };
    }
  };

  // Store-wide Telegram Bot alert configuration (Synchronized with Firestore)
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => getStoredTelegramConfig());

  // Refs to track order statuses, seen notifications, and current user for real-time customer alerts
  const ordersStatusRef = useRef<Map<string, OrderStatus>>(new Map());
  const seenNotifsRef = useRef<Set<string>>(new Set());
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Automatic connection test & real-time sync on boot
  useEffect(() => {
    let isMounted = true;
    let unsubscribeProducts: (() => void) | null = null;
    let unsubscribeOrders: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;
    let unsubscribeNotifications: (() => void) | null = null;
    let unsubscribeTelegram: (() => void) | null = null;

    const initDatabase = async () => {
      try {
        const ping = await testFirestoreConnection();
        if (!isMounted) return;
        if (ping.success) {
          setDbStatus(prev => ({
            ...prev,
            isConnected: true,
            error: null,
            projectId: ping.projectId,
          }));

          const [dbProds, dbCats, dbUsers, dbOrders, dbTelegram] = await Promise.all([
            fetchFirestoreProducts(),
            fetchFirestoreCategories(),
            fetchFirestoreUsers(),
            fetchFirestoreOrders(),
            fetchFirestoreTelegramConfig(),
          ]);

          if (!isMounted) return;

          // If database has products, use them directly
          if (dbProds.length > 0) {
            setProducts(dbProds);
          } else {
            // First time seeding: Upload initial products to Firestore so all browsers have them!
            console.log('Seeding initial catalog to Firestore for multi-browser sync...');
            syncAllDataToFirestore(products, categories, users, orders);
          }

          if (dbCats.length > 0) {
            setCategories(dbCats);
          }
          if (dbUsers.length > 0) {
            setUsers(prev => {
              const map = new Map<string, User>();
              prev.forEach(u => map.set(u.id, u));
              dbUsers.forEach(u => map.set(u.id, u));
              return Array.from(map.values());
            });
          }
          if (dbOrders.length > 0) {
            setOrders(dbOrders);
            dbOrders.forEach(o => ordersStatusRef.current.set(o.id, o.status));
          }
          if (dbTelegram && isMounted) {
            setTelegramConfig(dbTelegram);
            saveStoredTelegramConfig(dbTelegram);
          }

          setDbStatus(prev => ({
            ...prev,
            isConnected: true,
            lastSyncedAt: new Date().toLocaleTimeString(),
            productCount: dbProds.length > 0 ? dbProds.length : products.length,
            userCount: dbUsers.length > 0 ? dbUsers.length : users.length,
            orderCount: dbOrders.length > 0 ? dbOrders.length : orders.length,
          }));

          // Attach real-time Firestore listener for products
          unsubscribeProducts = subscribeToFirestoreProducts((liveProducts) => {
            if (!isMounted) return;
            setProducts(liveProducts);
            setDbStatus(prev => ({
              ...prev,
              isConnected: true,
              productCount: liveProducts.length,
              lastSyncedAt: new Date().toLocaleTimeString(),
            }));
          });

          // Attach real-time Firestore listener for orders
          unsubscribeOrders = subscribeToFirestoreOrders((liveOrders) => {
            if (!isMounted) return;
            const isInitial = ordersStatusRef.current.size === 0;
            liveOrders.forEach(o => {
              const prevStatus = ordersStatusRef.current.get(o.id);
              if (!isInitial && prevStatus && prevStatus !== o.status) {
                // Order status changed in Firestore!
                const activeUser = currentUserRef.current;
                if (activeUser) {
                  const currentId = (activeUser.id || '').trim();
                  const currentEmail = (activeUser.email || '').toLowerCase().trim();
                  const currentPhone = (activeUser.phone || '').replace(/[^0-9]/g, '');
                  const orderPhone = (o.shippingAddress?.phone || '').replace(/[^0-9]/g, '');
                  const isMyOrder =
                    (o.userId && (o.userId === currentId || currentId.includes(o.userId) || o.userId.includes(currentId))) ||
                    (currentEmail && o.userEmail && o.userEmail.toLowerCase() === currentEmail) ||
                    (currentPhone && orderPhone && orderPhone === currentPhone);

                  if (isMyOrder) {
                    addToast(`🔔 Order #${o.id} status updated to: ${o.status.toUpperCase()}!`, 'info');
                    playNotificationChime();
                  }
                }
              }
              ordersStatusRef.current.set(o.id, o.status);
            });

            setOrders(liveOrders);
            setDbStatus(prev => ({
              ...prev,
              isConnected: true,
              orderCount: liveOrders.length,
              lastSyncedAt: new Date().toLocaleTimeString(),
            }));
          });

          // Attach real-time Firestore listener for users & customers
          unsubscribeUsers = subscribeToFirestoreUsers((liveUsers) => {
            if (!isMounted) return;
            setUsers(prev => {
              const map = new Map<string, User>();
              prev.forEach(u => map.set(u.id, u));

              liveUsers.forEach(live => {
                // Match by existing ID or by email
                const existingById = map.get(live.id);
                const existingByEmail = Array.from(map.values()).find(
                  u => u.email && live.email && u.email.toLowerCase() === live.email.toLowerCase()
                );

                if (existingById) {
                  map.set(live.id, {
                    ...existingById,
                    ...live,
                    role: live.role, // role from Firestore is authoritative
                    approvalStatus: live.approvalStatus,
                    gender: live.gender || existingById.gender || 'male',
                  });
                } else if (existingByEmail) {
                  // Merge while preserving existing local ID so current user auth session doesn't disconnect
                  const merged: User = {
                    ...existingByEmail,
                    ...live,
                    id: existingByEmail.id,
                    role: live.role,
                    approvalStatus: live.approvalStatus,
                    gender: live.gender || existingByEmail.gender || 'male',
                  };
                  map.set(existingByEmail.id, merged);
                } else {
                  map.set(live.id, live);
                }
              });

              const updatedList = Array.from(map.values());
              try {
                localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedList));
              } catch {
                // ignore
              }
              return updatedList;
            });
            setDbStatus(prev => ({
              ...prev,
              isConnected: true,
              userCount: liveUsers.length,
              lastSyncedAt: new Date().toLocaleTimeString(),
            }));
          });

          // Attach real-time Firestore listener for notifications
          unsubscribeNotifications = subscribeToFirestoreNotifications((liveNotifs) => {
            if (!isMounted) return;
            const isInitial = seenNotifsRef.current.size === 0;
            liveNotifs.forEach(n => {
              if (!isInitial && !seenNotifsRef.current.has(n.id)) {
                const activeUser = currentUserRef.current;

                // Case 1: Staff / Admin account logged in
                if (activeUser && (activeUser.role === 'admin' || activeUser.role === 'moderator')) {
                  if (n.targetRole === 'staff' || n.type === 'order_placed') {
                    addToast(`🔔 ${n.title}: ${n.message}`, 'info');
                    playNotificationChime();
                  }
                }

                // Case 2: Customer account logged in
                if (activeUser && activeUser.role === 'customer') {
                  // Customer MUST NEVER receive or hear chime for staff order_placed alerts
                  if (n.targetRole === 'staff' || n.type === 'order_placed') {
                    // Do nothing - strictly for admin/staff
                  } else {
                    const currentId = (activeUser.id || '').trim();
                    const currentEmail = (activeUser.email || '').toLowerCase().trim();
                    const currentPhone = (activeUser.phone || '').replace(/[^0-9]/g, '');
                    const notifTargetId = (n.userId || n.customerId || '').trim();
                    const notifEmail = (n.userEmail || '').toLowerCase().trim();
                    const notifPhone = (n.phone || '').replace(/[^0-9]/g, '');

                    // Strict targeting: ONLY trigger if notification explicitly matches this customer's account!
                    const isForMe =
                      (notifTargetId && (
                        notifTargetId === currentId ||
                        currentId.includes(notifTargetId) ||
                        notifTargetId.includes(currentId) ||
                        (currentPhone && notifTargetId === currentPhone)
                      )) ||
                      (currentEmail && notifEmail && notifEmail === currentEmail) ||
                      (currentPhone && notifPhone && notifPhone === currentPhone) ||
                      (Boolean(n.orderId) && orders.some(o => o.id === n.orderId && (
                        (o.userId && (o.userId === currentId || currentId.includes(o.userId) || o.userId.includes(currentId))) ||
                        (o.userEmail && o.userEmail.toLowerCase() === currentEmail) ||
                        (currentPhone && o.shippingAddress?.phone && o.shippingAddress.phone.replace(/[^0-9]/g, '') === currentPhone)
                      )));

                    // Customers only receive order status updates and review requests
                    if (isForMe && (n.type === 'order_status' || n.type === 'review_request')) {
                      addToast(`${n.title}: ${n.message}`, 'info');
                      playNotificationChime();
                    }
                  }
                }
              }
              seenNotifsRef.current.add(n.id);
            });

            setNotifications(liveNotifs);
            try {
              localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(liveNotifs));
            } catch {
              // ignore
            }
          });

          // Attach real-time Firestore listener for Telegram Bot settings
          unsubscribeTelegram = subscribeToFirestoreTelegramConfig((remoteCfg) => {
            if (!isMounted) return;
            setTelegramConfig(remoteCfg);
            saveStoredTelegramConfig(remoteCfg);
          });
        } else {
          setDbStatus(prev => ({
            ...prev,
            isConnected: false,
            error: ping.message,
          }));
        }
      } catch (err: any) {
        console.warn('Database initialization notice:', err);
      }
    };

    initDatabase();
    return () => {
      isMounted = false;
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeTelegram) unsubscribeTelegram();
    };
  }, []);

  const openLoginModal = () => {
    setAuthModalTab('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalTab('register');
    setIsAuthModalOpen(true);
  };

  const openForgotPasswordModal = () => {
    setAuthModalTab('forgot-password');
    setIsAuthModalOpen(true);
  };

  // Customer Settings Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalInitialTab, setSettingsModalInitialTab] = useState<'profile' | 'address' | 'security'>('profile');
  const openSettingsModal = (initialTab: 'profile' | 'address' | 'security' = 'profile') => {
    if (!currentUser) {
      openLoginModal();
    } else {
      setSettingsModalInitialTab(initialTab);
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
    const sanitizeWithRating = (list: Product[]): Product[] => {
      return list.map(p => {
        const revs = Array.isArray(p.reviews) ? p.reviews : [];
        const reviewsCount = revs.length;
        const rating = reviewsCount > 0
          ? Number((revs.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewsCount).toFixed(1))
          : 0;
        return {
          ...p,
          reviews: revs,
          reviewsCount,
          rating,
          soldCount: Number(p.soldCount) || 0,
        };
      });
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeWithRating(parsed);
        }
      }
      return sanitizeWithRating(INITIAL_PRODUCTS);
    } catch {
      return sanitizeWithRating(INITIAL_PRODUCTS);
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

  // Notifications state (Real-time synced with Firestore)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });



  // 7. Navigation / View initialized from current URL
  const initialRoute = useMemo(() => parseRouteFromLocation(), []);
  const [viewMode, setViewMode] = useState<ViewMode>(initialRoute.viewMode);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialRoute.productId);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>(initialRoute.dashboardTab || 'products');

  // Unified navigation methods with clean URL routing
  const navigateTo = (path: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;
    if (options?.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    const route = parseRouteFromLocation();
    setViewMode(route.viewMode);
    setSelectedProductId(route.productId);
    if (route.dashboardTab) {
      setDashboardTab(route.dashboardTab);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const navigateToProduct = (productIdOrSlug: string) => {
    const clean = productIdOrSlug.trim();
    const matched = products.find(p => p.id === clean || p.slug === clean);
    const slugOrId = matched?.slug || clean;
    setSelectedProductId(clean);
    setViewMode('product-detail');
    syncBrowserUrl('product-detail', {
      productId: clean,
      slug: slugOrId,
      pageTitle: matched?.title,
    });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const navigateToContact = () => {
    setSelectedProductId(null);
    setViewMode('contact');
    syncBrowserUrl('contact');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const navigateToCheckout = () => {
    setSelectedProductId(null);
    setViewMode('checkout');
    syncBrowserUrl('checkout');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const navigateToOrders = () => {
    setSelectedProductId(null);
    setViewMode('orders');
    syncBrowserUrl('orders');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const navigateToDashboard = (tab?: DashboardTab) => {
    setSelectedProductId(null);
    const targetTab = tab || dashboardTab || 'products';
    setDashboardTab(targetTab);
    setViewMode('dashboard');
    syncBrowserUrl('dashboard', { dashboardTab: targetTab });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const navigateToStore = () => {
    setSelectedProductId(null);
    setViewMode('store');
    syncBrowserUrl('store');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const navigateToSchemaDocs = () => {
    setSelectedProductId(null);
    setViewMode('schema-docs');
    syncBrowserUrl('schema-docs');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Listen to browser Back/Forward navigation & Hash changes
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromLocation();
      setViewMode(route.viewMode);
      setSelectedProductId(route.productId);
      if (route.dashboardTab) {
        setDashboardTab(route.dashboardTab);
      }
      if (route.searchQuery) {
        setSearchQuery(route.searchQuery);
      }
      if (route.category) {
        setSelectedCategory(route.category);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Sync browser URL whenever viewMode, selectedProductId, or dashboardTab changes
  useEffect(() => {
    const matched = selectedProductId
      ? products.find(p => p.id === selectedProductId || p.slug === selectedProductId)
      : null;

    syncBrowserUrl(viewMode, {
      productId: selectedProductId,
      slug: matched?.slug || selectedProductId,
      dashboardTab: viewMode === 'dashboard' ? dashboardTab : null,
      pageTitle: matched?.title,
      replace: true,
    });
  }, [viewMode, selectedProductId, dashboardTab, products]);

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
  const canDeleteProduct = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  const canEditProduct = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  const canManageCategories = currentUser?.role === 'moderator' || currentUser?.role === 'admin' || canAccessDashboard;
  const canViewAnalytics = currentUser?.role === 'admin';
  const canUpdateOrderStatus = currentUser?.role === 'moderator' || currentUser?.role === 'admin';

  // Auth Operations: Unified Database & Firebase Password Validation
  const login = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/[^0-9]/g, '');

    if (!clean) {
      addToast('Please enter your email or phone number.', 'error');
      return { success: false, message: 'Email or phone number is required' };
    }

    if (!password || !password.trim()) {
      addToast('Please enter your password.', 'error');
      return { success: false, message: 'Password is required' };
    }

    // Disallow the removed legacy mock admin account
    if (clean === 'admin@xeeroo.com' || clean === 'staff@xeeroo.com') {
      addToast('Legacy default admin accounts have been removed. Please log in with your registered account.', 'error');
      return { success: false, message: 'Legacy admin account removed. Please use your registered account.' };
    }

    // 1. Search for registered user in current state
    let matchedUser = users.find(u => {
      const emailMatches = Boolean(u.email && u.email.toLowerCase().trim() === clean);
      const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
      const phoneMatches = Boolean(
        cleanDigits.length >= 8 &&
        (uPhoneDigits === cleanDigits ||
          uPhoneDigits.endsWith(cleanDigits) ||
          cleanDigits.endsWith(uPhoneDigits))
      );
      const idMatches = u.id === identifier.trim();
      return emailMatches || phoneMatches || idMatches;
    });

    // 2. If not found in state memory or password not in cache, query Firestore database directly
    if (!matchedUser || !matchedUser.password) {
      const remoteDbUser = await fetchFirestoreUserByIdentifier(identifier);
      if (remoteDbUser) {
        matchedUser = remoteDbUser;
      }
    }

    // 3. User was found in Firestore / registered records
    if (matchedUser) {
      let isPasswordValid = false;

      // 3a. Check stored password (from registration in Firestore database)
      if (matchedUser.password && matchedUser.password === password) {
        isPasswordValid = true;
      } else if (clean.includes('@')) {
        // 3b. Also check Firebase Auth in case password was changed via Firebase Auth
        const fbAuthRes = await signInFirebaseUser(clean, password);
        if (fbAuthRes.success) {
          isPasswordValid = true;
        }
      }

      if (!isPasswordValid) {
        addToast('Incorrect password entered. Please check your credentials.', 'error');
        return { success: false, message: 'Incorrect password entered.' };
      }

      if (matchedUser.isBanned) {
        addToast('This account has been suspended by administration.', 'error');
        return { success: false, message: 'Account suspended' };
      }

      // Check authoritative role from Firestore (if someone updated role in Firestore to admin)
      const authoritativeRole: UserRole = normalizeUserRole(matchedUser.role);

      const loggedInUser: User = {
        ...matchedUser,
        role: authoritativeRole,
      };

      // Ensure user is updated in memory and localStorage
      setUsers(prev => {
        const filtered = prev.filter(
          u => u.id !== loggedInUser.id && (u.email ? u.email.toLowerCase() !== loggedInUser.email.toLowerCase() : true)
        );
        return [...filtered, loggedInUser];
      });

      setCurrentUserId(loggedInUser.id);
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, loggedInUser.id);
      setIsAuthModalOpen(false);

      if (loggedInUser.role === 'admin') {
        addToast(`Welcome back, ${loggedInUser.fullName} (Administrator)!`, 'success');
      } else if (loggedInUser.role === 'moderator') {
        addToast(`Welcome back, ${loggedInUser.fullName} (Staff/Moderator)!`, 'success');
      } else {
        addToast(`Signed in successfully as ${loggedInUser.fullName}!`, 'success');
      }

      // Background sync with Firebase Auth if available
      if (clean.includes('@') && matchedUser.password) {
        registerFirebaseUser(clean, password).catch(() => {});
      }

      return { success: true, message: 'Logged in successfully', user: loggedInUser };
    }

    // 4. If not found in Firestore records, try Firebase Auth directly (for accounts created in Firebase Console)
    if (clean.includes('@')) {
      const fbAuthRes = await signInFirebaseUser(clean, password);

      if (fbAuthRes.success && fbAuthRes.user) {
        const fbUser = fbAuthRes.user;
        const firestoreProfile = await fetchFirestoreUserProfile(fbUser.uid);
        const assignedRole: UserRole = normalizeUserRole(
          firestoreProfile?.role,
          firestoreProfile?.isAdmin
        );

        const loggedInUser: User = {
          id: `usr-fb-${fbUser.uid}`,
          email: fbUser.email || clean,
          fullName: (firestoreProfile?.fullName as string) || fbUser.displayName || 'User',
          role: assignedRole,
          phone: (firestoreProfile?.phone as string) || fbUser.phoneNumber || '',
          approvalStatus: (firestoreProfile?.approvalStatus as any) || 'approved',
          isVerified: true,
          avatarUrl: fbUser.photoURL || '',
          gender: (firestoreProfile?.gender as any) || 'male',
          createdAt: new Date().toISOString(),
          isBanned: Boolean(firestoreProfile?.isBanned),
        };

        if (loggedInUser.isBanned) {
          addToast('This account has been suspended by administration.', 'error');
          return { success: false, message: 'Account suspended' };
        }

        setUsers(prev => {
          const filtered = prev.filter(u => u.email.toLowerCase() !== clean && u.id !== loggedInUser.id);
          return [...filtered, loggedInUser];
        });

        setCurrentUserId(loggedInUser.id);
        localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, loggedInUser.id);
        setIsAuthModalOpen(false);

        if (loggedInUser.role === 'admin') {
          addToast(`Welcome back, ${loggedInUser.fullName} (Administrator)!`, 'success');
        } else {
          addToast(`Signed in successfully as ${loggedInUser.fullName}!`, 'success');
        }
        return { success: true, message: 'Logged in successfully', user: loggedInUser };
      }

      if (
        fbAuthRes.code === 'auth/wrong-password' ||
        fbAuthRes.code === 'auth/invalid-credential' ||
        fbAuthRes.code === 'auth/invalid-login-credentials'
      ) {
        addToast('No registered account found with these credentials or incorrect password.', 'error');
        return { success: false, message: 'Incorrect credentials or account not found.' };
      }

      addToast(fbAuthRes.error || 'Authentication failed.', 'error');
      return { success: false, message: fbAuthRes.error || 'Authentication failed.' };
    }

    addToast('No account found with this mobile number. Please register an account first.', 'error');
    return { success: false, message: 'Account not found with this mobile number' };
  };

  const loginAsAdmin = () => {
    const admin = users.find(u => u.role === 'admin');
    if (admin) {
      setCurrentUserId(admin.id);
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, admin.id);
      setIsAuthModalOpen(false);
      setViewMode('dashboard');
      addToast(`Welcome! You are signed in as Administrator (${admin.fullName}).`, 'success');
    } else {
      setIsAuthModalOpen(true);
      setAuthModalTab('login');
      addToast('No Administrator account active. Please register or sign in with your Admin account credentials.', 'info');
    }
  };

  const loginWithGoogle = (googleData: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    phone?: string;
    uid?: string;
  }) => {
    const cleanEmail = googleData.email.trim().toLowerCase();
    if (!cleanEmail) {
      addToast('Please provide a valid Google email address.', 'error');
      return { success: false, message: 'Email address is required' };
    }

    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      if (existing.isBanned) {
        addToast('This account has been suspended by administration.', 'error');
        return { success: false, message: 'Account suspended' };
      }
      setCurrentUserId(existing.id);
      try {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, existing.id);
      } catch {
        // ignore
      }
      setIsAuthModalOpen(false);

      if (existing.role === 'admin' || existing.role === 'moderator') {
        setViewMode('dashboard');
        if (existing.role === 'moderator') {
          setDashboardTab('orders');
        }
        addToast(`Signed in with Google! Welcome back, ${existing.fullName} (${existing.role.toUpperCase()}).`, 'success');
      } else {
        addToast(`Signed in with Google! Welcome, ${existing.fullName}.`, 'success');
      }
      return { success: true, message: 'Logged in successfully with Google', user: existing };
    }

    // Auto-register new Google user with pre-approved status
    const userFullName = googleData.fullName.trim() || cleanEmail.split('@')[0] || 'Google User';
    const newUser: User = {
      id: googleData.uid ? `usr-g-${googleData.uid}` : `usr-g-${Date.now()}`,
      email: cleanEmail,
      fullName: userFullName,
      phone: googleData.phone || '',
      role: 'customer',
      approvalStatus: 'approved',
      isVerified: true,
      gender: 'male',
      avatarUrl: googleData.avatarUrl || '',
      createdAt: new Date().toISOString(),
      isBanned: false,
      address: {
        fullName: userFullName,
        street: '',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1200',
        country: 'Bangladesh',
        phone: googleData.phone || '',
      },
    };

    setUsers(prev => [...prev, newUser]);
    // Save to Firestore collections
    saveFirestoreCustomer(newUser);

    setCurrentUserId(newUser.id);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, newUser.id);
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
    addToast(`Account created and signed in with Google! Welcome, ${newUser.fullName}.`, 'success');
    return { success: true, message: 'Signed in with Google', user: newUser };
  };

  const loginWithGooglePopup = async (): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      const res = await signInWithGooglePopup();
      if (res.success && res.user) {
        const fbUser = res.user;
        const gRes = loginWithGoogle({
          email: fbUser.email || '',
          fullName: fbUser.displayName || 'Google Customer',
          avatarUrl: fbUser.photoURL || undefined,
          phone: fbUser.phoneNumber || undefined,
          uid: fbUser.uid,
        });
        return gRes;
      }
      return { success: false, message: res.error || 'Google login was cancelled.' };
    } catch (err: unknown) {
      const error = err as { message?: string };
      return { success: false, message: error.message || 'Google sign-in error.' };
    }
  };

  // 2-Step OTP Registration for Customers
  const initiateRegistration = (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }): { success: boolean; message: string; otp?: string } => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanDigits = data.phone.replace(/[^0-9]/g, '');

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      addToast('An account with this email already exists. Please sign in.', 'error');
      return { success: false, message: 'Email already registered' };
    }

    if (
      cleanDigits.length >= 8 &&
      users.some(u => (u.phone || '').replace(/[^0-9]/g, '') === cleanDigits)
    ) {
      addToast('An account with this phone number already exists. Please sign in.', 'error');
      return { success: false, message: 'Phone number already registered' };
    }

    // Generate a 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingRegistration({
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      password: data.password,
      otp: generatedOtp,
    });

    // Dispatch OTP code securely to the user's email via backend service
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.email.trim(),
        subject: 'XEEROO Account Verification OTP Code',
        otp: generatedOtp,
        type: 'registration_otp',
      }),
    }).catch(err => {
      console.warn('Email dispatch warning:', err);
    });

    setAuthModalTab('verify-otp');
    addToast(`A 6-digit verification code has been dispatched to ${data.email}. Please check your email inbox.`, 'info');

    return { success: true, message: 'OTP sent to email', otp: generatedOtp };
  };

  const verifyOtpAndComplete = (enteredOtp: string): { success: boolean; message: string; user?: User } => {
    if (!pendingRegistration) {
      addToast('Registration session timed out. Please fill out the form again.', 'error');
      setAuthModalTab('register');
      return { success: false, message: 'No registration session found' };
    }

    if (enteredOtp.trim() !== pendingRegistration.otp.trim()) {
      addToast('Incorrect 6-digit OTP code. Please enter the valid code received in your email.', 'error');
      return { success: false, message: 'Incorrect OTP code' };
    }

    const newUser: User = {
      id: `usr-cust-${Date.now()}`,
      email: pendingRegistration.email,
      fullName: pendingRegistration.fullName,
      phone: pendingRegistration.phone,
      password: pendingRegistration.password,
      role: 'customer',
      approvalStatus: 'approved',
      isVerified: true,
      gender: 'male',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
      isBanned: false,
      address: {
        fullName: pendingRegistration.fullName,
        street: '',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1200',
        country: 'Bangladesh',
        phone: pendingRegistration.phone,
      },
    };

    setUsers(prev => [...prev, newUser]);
    // Save to Firestore collections: both 'users' and 'customers'
    saveFirestoreCustomer(newUser);

    // Also register in Firebase Authentication for seamless login
    registerFirebaseUser(pendingRegistration.email, pendingRegistration.password).catch(err => {
      console.warn('Firebase Auth user registration notice:', err);
    });

    setPendingRegistration(null);
    setAuthModalTab('login');
    addToast('Account verified successfully! Please sign in with your email or phone.', 'success');

    return { success: true, message: 'Account verified successfully', user: newUser };
  };

  const resendOtp = () => {
    if (!pendingRegistration) return null;
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingRegistration(prev => (prev ? { ...prev, otp: newOtp } : null));

    // Dispatch email
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pendingRegistration.email,
        subject: 'XEEROO Account Verification OTP Code (Resent)',
        otp: newOtp,
        type: 'registration_otp',
      }),
    }).catch(err => {
      console.warn('Email resend warning:', err);
    });

    addToast(`New verification code sent to ${pendingRegistration.email}. Please check your inbox.`, 'info');
    return newOtp;
  };

  // Send 6-digit Password Reset OTP to Email
  const sendPasswordResetOtp = async (
    identifier: string
  ): Promise<{ success: boolean; message: string; email?: string }> => {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/[^0-9]/g, '');

    const matchedUser = users.find(u => {
      const emailMatch = u.email.toLowerCase() === clean;
      const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
      const phoneMatch =
        cleanDigits.length >= 8 &&
        (uPhoneDigits === cleanDigits ||
          uPhoneDigits.endsWith(cleanDigits) ||
          cleanDigits.endsWith(uPhoneDigits));
      return emailMatch || phoneMatch;
    });

    const targetEmail = matchedUser?.email || (clean.includes('@') ? clean : null);

    if (!targetEmail) {
      addToast('No registered account found with this phone number or email.', 'error');
      return { success: false, message: 'Account not found' };
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingPasswordReset({
      identifier: identifier.trim(),
      email: targetEmail,
      otp: resetOtp,
    });

    // Dispatch password reset email via server-side email endpoint
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          subject: 'XEEROO Password Reset Verification Code',
          otp: resetOtp,
          type: 'password_reset_otp',
        }),
      });
    } catch (err) {
      console.warn('Reset email dispatch notice:', err);
    }

    addToast(`A 6-digit password reset code has been sent to ${targetEmail}. Please check your email inbox.`, 'info');
    return {
      success: true,
      message: `A 6-digit reset code has been dispatched to ${targetEmail}.`,
      email: targetEmail,
    };
  };

  // Verify Reset OTP and set new password
  const verifyPasswordResetOtpAndSetPassword = async (
    enteredOtp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!pendingPasswordReset) {
      addToast('Password reset session expired. Please request a new code.', 'error');
      return { success: false, message: 'No active reset session' };
    }

    if (enteredOtp.trim() !== pendingPasswordReset.otp.trim()) {
      addToast('Incorrect 6-digit OTP code entered. Please check your email.', 'error');
      return { success: false, message: 'Incorrect OTP code' };
    }

    if (!newPassword || newPassword.length < 6) {
      addToast('Password must be at least 6 characters long.', 'error');
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    const targetEmail = pendingPasswordReset.email.toLowerCase();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === targetEmail);

    if (userIndex !== -1) {
      const updatedUser = { ...users[userIndex], password: newPassword };
      setUsers(prev => prev.map((u, i) => (i === userIndex ? updatedUser : u)));
      await saveFirestoreCustomer(updatedUser);
    }

    setPendingPasswordReset(null);
    setAuthModalTab('login');
    addToast('Password updated successfully! You can now sign in with your new password.', 'success');
    return { success: true, message: 'Password updated successfully' };
  };

  // Initial Admin Account Creator directly into Cloud Database (Firestore)
  const createAdminAccountInDatabase = async (data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      addToast('Please enter a valid email address for the administrator.', 'error');
      return { success: false, message: 'Invalid email' };
    }
    if (!data.password || data.password.length < 6) {
      addToast('Administrator password must be at least 6 characters long.', 'error');
      return { success: false, message: 'Password too short' };
    }

    const adminUser: User = {
      id: `usr-admin-${Date.now()}`,
      email: cleanEmail,
      fullName: data.fullName.trim() || 'Master Admin',
      phone: data.phone?.trim() || '',
      password: data.password,
      role: 'admin',
      approvalStatus: 'approved',
      isVerified: true,
      isBanned: false,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      createdAt: new Date().toISOString(),
      address: {
        fullName: data.fullName.trim() || 'Master Admin',
        street: 'HQ Station',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1200',
        country: 'Bangladesh',
        phone: data.phone?.trim() || '',
      },
    };

    setUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== cleanEmail);
      return [...filtered, adminUser];
    });

    await saveFirestoreCustomer(adminUser);
    addToast(`Master Admin account (${adminUser.email}) created directly in Firestore database!`, 'success');
    return { success: true, message: 'Admin account created successfully in database', user: adminUser };
  };

  const resetPassword = async (
    identifier: string,
    newPassword?: string
  ): Promise<{ success: boolean; message: string; isEmailSent?: boolean; canDirectReset?: boolean }> => {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/[^0-9]/g, '');

    // Check local / Firestore user account match
    const userIndex = users.findIndex(u => {
      const emailMatch = u.email.toLowerCase() === clean;
      const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
      const phoneMatch =
        cleanDigits.length >= 8 &&
        (uPhoneDigits === cleanDigits ||
          uPhoneDigits.endsWith(cleanDigits) ||
          cleanDigits.endsWith(uPhoneDigits));
      return emailMatch || phoneMatch;
    });

    // 1. If user supplied a new password, perform instant direct password reset
    if (newPassword && newPassword.trim()) {
      if (userIndex !== -1) {
        const updatedUser = { ...users[userIndex], password: newPassword.trim() };
        setUsers(prev =>
          prev.map((u, i) => (i === userIndex ? updatedUser : u))
        );
        await saveFirestoreCustomer(updatedUser);
        addToast('Password updated successfully! You can now sign in with your new password.', 'success');
        return { success: true, message: 'Password updated successfully' };
      } else {
        addToast('No registered account found with this phone number or email.', 'error');
        return { success: false, message: 'Account not found' };
      }
    }

    // 2. If it's an email and no new password provided, try official Firebase password reset
    if (clean.includes('@')) {
      const fbRes = await sendFirebasePasswordReset(clean);
      if (fbRes.success) {
        addToast(`Password reset link sent to ${clean}! Please check your Inbox and Spam/Junk folder.`, 'success');
        return { success: true, message: fbRes.message, isEmailSent: true };
      } else {
        // Firebase Auth failed (e.g. account created only in Firestore, not in Firebase Auth, or auth/user-not-found)
        if (userIndex !== -1) {
          const helperMsg = 'This account exists in our database. You can directly set a new password below.';
          addToast(helperMsg, 'info');
          return { success: false, message: helperMsg, canDirectReset: true };
        } else {
          addToast(fbRes.message, 'error');
          return { success: false, message: fbRes.message };
        }
      }
    }

    // 3. If phone number identifier
    if (userIndex !== -1) {
      return {
        success: false,
        message: 'Account located! Please enter your new password to reset directly.',
        canDirectReset: true,
      };
    }

    addToast('No registered account found with this phone number or email.', 'error');
    return { success: false, message: 'No registered account found with this identifier.' };
  };

  const register = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    address?: ShippingAddress;
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const rawPhone = data.phone.trim();
    const cleanDigits = normalizeBDPhone(rawPhone);

    if (!isValidBDPhone(rawPhone)) {
      addToast('Invalid phone number: Please provide an 11-digit Bangladeshi mobile number starting with 013-019 (e.g. 017XXXXXXXX).', 'error');
      return {
        success: false,
        message: 'Invalid phone number. A valid 11-digit Bangladeshi mobile number (013-019) is required.',
      };
    }

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      addToast('An account with this email already exists. Please log in.', 'error');
      return { success: false, message: 'An account with this email already exists.' };
    }

    if (
      cleanDigits.length >= 8 &&
      users.some(u => (u.phone || '').replace(/[^0-9]/g, '') === cleanDigits)
    ) {
      addToast('An account with this phone number already exists. Please log in.', 'error');
      return { success: false, message: 'An account with this phone number already exists.' };
    }

    const newUser: User = {
      id: `usr-cust-${Date.now()}`,
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      password: data.password,
      role: 'customer',
      approvalStatus: 'approved',
      isVerified: true,
      gender: 'male',
      createdAt: new Date().toISOString(),
      isBanned: false,
      address: data.address || {
        fullName: data.fullName.trim(),
        street: '',
        city: 'Dhaka',
        state: 'Dhaka',
        country: 'Bangladesh',
        phone: data.phone.trim(),
      },
    };

    setUsers(prev => [...prev, newUser]);
    // Save to Firestore collections 'users' and 'customers'
    await saveFirestoreCustomer(newUser);

    // Also sync to Firebase Auth if available
    registerFirebaseUser(newUser.email, data.password).catch(() => {});

    setCurrentUserId(newUser.id);
    localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, newUser.id);
    setIsAuthModalOpen(false);

    addToast(`Welcome ${newUser.fullName}! Your customer account has been created successfully.`, 'success');
    return { success: true, message: 'Registration successful!', user: newUser };
  };

  const logout = () => {
    setCurrentUserId(null);
    addToast('You have been logged out.', 'info');
    if (viewMode === 'dashboard') {
      setViewMode('store');
    }
  };

  // Approval System
  const approveUser = async (userId: string): Promise<boolean> => {
    if (!canManageUsers) {
      addToast('Only Admin can approve customer accounts.', 'error');
      return false;
    }

    let updatedUser: User | null = null;
    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === userId) {
          const updated: User = { ...u, approvalStatus: 'approved' };
          updatedUser = updated;
          return updated;
        }
        return u;
      });
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(next));
      return next;
    });

    if (updatedUser) {
      await saveFirestoreCustomer(updatedUser);
      await saveFirestoreUserProfile((updatedUser as User).id, {
        approvalStatus: 'approved',
      });
    }

    addToast(`Customer account for ${(updatedUser as any)?.fullName || 'user'} has been approved!`, 'success');
    return true;
  };

  const rejectUser = async (userId: string): Promise<boolean> => {
    if (!canManageUsers) {
      addToast('Only Admin can reject customer accounts.', 'error');
      return false;
    }

    let updatedUser: User | null = null;
    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === userId) {
          const updated: User = { ...u, approvalStatus: 'rejected' };
          updatedUser = updated;
          return updated;
        }
        return u;
      });
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(next));
      return next;
    });

    if (updatedUser) {
      await saveFirestoreCustomer(updatedUser);
      await saveFirestoreUserProfile((updatedUser as User).id, {
        approvalStatus: 'rejected',
      });
    }

    addToast(`Customer account for ${(updatedUser as any)?.fullName || 'user'} has been rejected.`, 'warning');
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

  // User Management (Admin Only) - Persists to Cloud Database & LocalStorage
  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    if (!canManageUsers) {
      addToast('RBAC Error: Only Admins can modify user roles.', 'error');
      return false;
    }

    const updatedStatus = newRole !== 'customer' ? 'approved' : 'approved';
    let targetUser = users.find(u => u.id === userId) || null;
    const targetEmail = targetUser?.email ? targetUser.email.toLowerCase().trim() : '';

    setUsers(prev => {
      const next = prev.map(u => {
        const idMatches = u.id === userId;
        const emailMatches = Boolean(targetEmail && u.email && u.email.toLowerCase().trim() === targetEmail);
        if (idMatches || emailMatches) {
          const updated: User = { ...u, role: newRole, approvalStatus: updatedStatus };
          targetUser = updated;
          return updated;
        }
        return u;
      });
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(next));
      return next;
    });

    if (targetUser) {
      await saveFirestoreCustomer(targetUser);
      await saveFirestoreUserProfile((targetUser as User).id, {
        role: newRole,
        approvalStatus: updatedStatus,
      });
      if (targetEmail) {
        await updateFirestoreUserRoleByEmailAndId(userId, targetEmail, newRole, updatedStatus);
      }
    }

    addToast(`User role updated to ${newRole.toUpperCase()}! Back-office permissions and order processing are now live.`, 'success');
    return true;
  };

  // Customer Profile & Address Update
  const updateUserProfile = (updates: {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    gender?: UserGender;
    address?: ShippingAddress;
  }): boolean => {
    if (!currentUser) {
      addToast('You must be signed in to update your profile.', 'error');
      return false;
    }

    let updatedUserProfile: User | null = null;

    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === currentUser.id) {
          const updated: User = {
            ...u,
            ...(updates.fullName !== undefined && { fullName: updates.fullName.trim() }),
            ...(updates.email !== undefined && { email: updates.email.trim() }),
            ...(updates.phone !== undefined && { phone: updates.phone.trim() }),
            ...(updates.gender !== undefined && { gender: updates.gender }),
            ...(updates.password !== undefined && updates.password.trim() !== '' && { password: updates.password }),
            ...(updates.address !== undefined && { address: updates.address }),
          };
          updatedUserProfile = updated;
          return updated;
        }
        return u;
      });
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(next));
      return next;
    });

    // Persist full customer profile with address & gender to Firestore
    if (updatedUserProfile) {
      saveFirestoreCustomer(updatedUserProfile);
    }

    addToast('Profile & preferences updated and saved to Database!', 'success');
    return true;
  };

  const toggleUserBan = (userId: string): boolean => {
    if (!canManageUsers) {
      addToast('RBAC Error: Only Admins can ban/unban users.', 'error');
      return false;
    }
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, isBanned: !u.isBanned };
          saveFirestoreCustomer(updated);
          return updated;
        }
        return u;
      })
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

  // Product CRUD (RBAC Protected & Cloud Database Sync)
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
      rating: 0,
      reviewsCount: 0,
      reviews: [],
      soldCount: 0,
    };

    setProducts(prev => [newProduct, ...prev]);
    // Save directly to Firestore database!
    saveFirestoreProduct(newProduct);

    addToast(`Product "${newProduct.title}" added to store & database!`, 'success');
    return true;
  };

  const updateProduct = (id: string, updates: Partial<Product>): boolean => {
    if (!canEditProduct) {
      addToast('Access Denied: Only Staff can update products.', 'error');
      return false;
    }

    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.id || 'admin',
          };
          // Save directly to Firestore database!
          saveFirestoreProduct(updated);
          return updated;
        }
        return p;
      })
    );
    addToast('Product details updated and saved to database', 'success');
    return true;
  };

  const updateProductStock = (id: string, newStock: number): boolean => {
    if (!canEditProduct) {
      addToast('Access Denied: Cannot modify inventory levels.', 'error');
      return false;
    }
    const safeStock = Math.max(0, Math.floor(newStock));
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = {
            ...p,
            stockQuantity: safeStock,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.id || 'admin',
          };
          saveFirestoreProduct(updated);
          return updated;
        }
        return p;
      })
    );
    addToast(`Stock level adjusted to ${safeStock} units in database`, 'info');
    return true;
  };

  const deleteProduct = (id: string): boolean => {
    if (!canDeleteProduct) {
      addToast('Access Denied: Only Admins can permanently delete products.', 'error');
      return false;
    }

    setProducts(prev => prev.filter(p => p.id !== id));
    setCart(prev => prev.filter(item => item.product.id !== id));
    // Remove from Firestore database
    deleteFirestoreProduct(id);
    addToast('Product permanently deleted from database & catalog', 'info');
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
          const updated = { ...p, isPublished: nextState, updatedAt: new Date().toISOString() };
          saveFirestoreProduct(updated);
          addToast(`Product "${p.title}" ${nextState ? 'published to store & database' : 'hidden (draft)'}`, 'info');
          return updated;
        }
        return p;
      })
    );
    return true;
  };

  // Dynamic Product Review & Rating System
  const addProductReview = async (
    productId: string,
    reviewData: {
      rating: number;
      comment: string;
      reviewerName?: string;
      userGender?: UserGender;
    }
  ): Promise<boolean> => {
    if (!currentUser) {
      addToast('Please sign in or create an account to post a review.', 'warning');
      openLoginModal();
      return false;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      addToast('Product not found in catalog.', 'error');
      return false;
    }

    if (!reviewData.comment.trim()) {
      addToast('Please write a review comment.', 'warning');
      return false;
    }

    const validRating = Math.max(1, Math.min(5, Math.round(reviewData.rating)));
    const nowIso = new Date().toISOString();
    const reviewerName = (reviewData.reviewerName || currentUser.fullName || 'Verified Customer').trim();
    const gender = reviewData.userGender || currentUser.gender || 'male';

    const newReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: reviewerName,
      userGender: gender,
      rating: validRating,
      comment: reviewData.comment.trim(),
      createdAt: nowIso,
    };

    const existingReviews = product.reviews || [];
    const updatedReviews = [newReview, ...existingReviews];
    const totalScore = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const calculatedRating = Number((totalScore / updatedReviews.length).toFixed(1));

    const updatedProduct: Product = {
      ...product,
      reviews: updatedReviews,
      rating: calculatedRating,
      reviewsCount: updatedReviews.length,
      updatedAt: nowIso,
    };

    setProducts(prev => {
      const next = prev.map(p => (p.id === productId ? updatedProduct : p));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      return next;
    });
    await saveFirestoreProduct(updatedProduct);

    addToast(`Thank you, ${reviewerName}! Your rating & review has been added.`, 'success');
    return true;
  };

  const updateProductReview = async (
    productId: string,
    reviewId: string,
    updates: { rating: number; comment: string }
  ): Promise<boolean> => {
    if (!currentUser) {
      addToast('Please sign in to update your review.', 'warning');
      openLoginModal();
      return false;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      addToast('Product not found in catalog.', 'error');
      return false;
    }

    const existingReviews = product.reviews || [];
    const targetRev = existingReviews.find(r => r.id === reviewId);
    if (!targetRev) {
      addToast('Review not found.', 'error');
      return false;
    }

    const isOwner =
      targetRev.userId === currentUser.id ||
      (currentUser.email && targetRev.userEmail === currentUser.email) ||
      currentUser.role === 'admin';

    if (!isOwner) {
      addToast('Access Denied: You can only edit your own reviews.', 'error');
      return false;
    }

    const validRating = Math.max(1, Math.min(5, Math.round(updates.rating)));
    const nowIso = new Date().toISOString();

    const updatedReviews = existingReviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          rating: validRating,
          comment: updates.comment.trim(),
          updatedAt: nowIso,
        };
      }
      return r;
    });

    const totalScore = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const calculatedRating = Number((totalScore / updatedReviews.length).toFixed(1));

    const updatedProduct: Product = {
      ...product,
      reviews: updatedReviews,
      rating: calculatedRating,
      reviewsCount: updatedReviews.length,
      updatedAt: nowIso,
    };

    setProducts(prev => {
      const next = prev.map(p => (p.id === productId ? updatedProduct : p));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      return next;
    });
    await saveFirestoreProduct(updatedProduct);

    addToast('Your review has been updated successfully!', 'success');
    return true;
  };

  const deleteProductReview = async (productId: string, reviewId: string): Promise<boolean> => {
    if (!currentUser) {
      addToast('Please sign in to delete your review.', 'warning');
      openLoginModal();
      return false;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      addToast('Product not found in catalog.', 'error');
      return false;
    }

    const existingReviews = product.reviews || [];
    const targetRev = existingReviews.find(r => r.id === reviewId);
    if (!targetRev) {
      addToast('Review not found.', 'error');
      return false;
    }

    const isOwner =
      targetRev.userId === currentUser.id ||
      (currentUser.email && targetRev.userEmail === currentUser.email) ||
      currentUser.role === 'admin';

    if (!isOwner) {
      addToast('Access Denied: You can only delete your own reviews.', 'error');
      return false;
    }

    const updatedReviews = existingReviews.filter(r => r.id !== reviewId);
    const totalScore = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const calculatedRating =
      updatedReviews.length > 0 ? Number((totalScore / updatedReviews.length).toFixed(1)) : 0;

    const nowIso = new Date().toISOString();
    const updatedProduct: Product = {
      ...product,
      reviews: updatedReviews,
      rating: calculatedRating,
      reviewsCount: updatedReviews.length,
      updatedAt: nowIso,
    };

    setProducts(prev => {
      const next = prev.map(p => (p.id === productId ? updatedProduct : p));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      return next;
    });
    await saveFirestoreProduct(updatedProduct);

    addToast('Review deleted successfully.', 'info');
    return true;
  };

  const syncBusinessKoroProducts = async (
    apiKey: string,
    targetCategoryId: string = categories[0]?.id || 'cat-audio',
    onProgress?: (synced: number, total: number) => void
  ): Promise<{ success: boolean; count: number; message: string }> => {
    if (!canEditProduct) {
      addToast('Access Denied: Only Staff and Admin can import products.', 'error');
      return { success: false, count: 0, message: 'Access Denied.' };
    }

    try {
      const res = await syncBusinessKoroProductsToFirestore(apiKey, targetCategoryId, onProgress);
      if (res.success && res.count > 0) {
        addToast(`Successfully synced ${res.count} products from BusinessKoro to Firestore!`, 'success');
      } else {
        addToast(res.message, res.success ? 'info' : 'error');
      }
      return { success: res.success, count: res.count, message: res.message };
    } catch (err: any) {
      const msg = err.message || 'Failed to sync products from BusinessKoro.';
      addToast(msg, 'error');
      return { success: false, count: 0, message: msg };
    }
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
    saveFirestoreCategory(newCategory);
    addToast(`Category "${name}" saved to database`, 'success');
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
    if (!currentUser) {
      addToast('Please sign in or create an account to add items to your cart.', 'warning');
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }

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

  // Helper for dynamic delivery charge by location
  const getDeliveryChargeForLocation = (district?: string, thana?: string): number => {
    return calculateShippingCharge(district, thana);
  };

  // Dynamic delivery charge based on active customer location
  // (80 TK inside Dhaka city, 130 TK sub-urban & outside Dhaka)
  const deliveryCharge = useMemo(() => {
    const dist = currentUser?.address?.district || currentUser?.address?.city;
    const thana = currentUser?.address?.thana || currentUser?.address?.state;
    return calculateShippingCharge(dist, thana);
  }, [currentUser]);

  const cartTax = 0;

  const cartTotal = useMemo(() => {
    if (cart.length === 0) return 0;
    return cartSubtotal + deliveryCharge;
  }, [cart, cartSubtotal, deliveryCharge]);

  // Order creation & Inventory Deduction
  const createOrder = async (
    shippingAddress: ShippingAddress,
    paymentMethod: 'card' | 'paypal' | 'cod' | 'bkash',
    optionalEmail?: string,
    paymentDetails?: { bkashNumber?: string; trxId?: string }
  ): Promise<Order | null> => {
    if (cart.length === 0) {
      addToast('Cannot checkout an empty cart.', 'warning');
      return null;
    }

    const nowIso = new Date().toISOString();
    let orderCustomer = currentUser;

    // If customer is not currently logged in, seamlessly create or link customer account
    if (!orderCustomer) {
      const cleanPhone = (shippingAddress.phone || '').trim();
      const phoneDigits = cleanPhone.replace(/[^0-9]/g, '');
      const cleanName = (shippingAddress.fullName || '').trim() || 'Online Customer';
      const cleanEmail = (optionalEmail || '').trim().toLowerCase();

      // Look up existing customer by email or phone number
      const existingUser = users.find(u => {
        const emailMatch = cleanEmail && u.email.toLowerCase() === cleanEmail;
        const phoneMatch = u.phone && phoneDigits.length >= 8 && u.phone.replace(/[^0-9]/g, '') === phoneDigits;
        return emailMatch || phoneMatch;
      });

      if (existingUser) {
        orderCustomer = existingUser;
        setCurrentUserId(existingUser.id);
        localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, existingUser.id);
      } else {
        const newCustId = `usr-cust-${Date.now()}`;
        const newCustEmail = cleanEmail || `${phoneDigits || Date.now()}@customer.xeeroo.com`;
        const newCustomer: User = {
          id: newCustId,
          email: newCustEmail,
          fullName: cleanName,
          phone: cleanPhone,
          role: 'customer',
          approvalStatus: 'approved',
          isVerified: true,
          isBanned: false,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          createdAt: nowIso,
          address: shippingAddress,
        };

        setUsers(prev => [...prev, newCustomer]);
        await saveFirestoreCustomer(newCustomer);
        setCurrentUserId(newCustomer.id);
        localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, newCustomer.id);
        orderCustomer = newCustomer;
      }
    }

    if (orderCustomer.isBanned) {
      addToast('Account suspended: Cannot place orders.', 'error');
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

    // Calculate dynamic shipping fee for this order's exact location
    const orderDeliveryCharge = calculateShippingCharge(
      shippingAddress.district || shippingAddress.city,
      shippingAddress.thana || shippingAddress.state
    );
    const orderTotalAmount = cartSubtotal + orderDeliveryCharge;

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    const newOrder: Order = {
      id: orderId,
      userId: orderCustomer.id,
      userEmail: orderCustomer.email,
      status: 'pending',
      totalAmount: orderTotalAmount,
      shippingAddress,
      paymentMethod,
      ...(paymentDetails ? { paymentDetails } : {}),
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

    // Deduct stock locally and in Firestore database, and increment soldCount
    const updatedProductsList = products.map(p => {
      const orderedItem = cart.find(ci => ci.product.id === p.id);
      if (orderedItem) {
        const updatedProd = {
          ...p,
          stockQuantity: Math.max(0, p.stockQuantity - orderedItem.quantity),
          soldCount: (p.soldCount || 0) + orderedItem.quantity,
          updatedAt: new Date().toISOString(),
        };
        // Persist stock update in Firestore
        saveFirestoreProduct(updatedProd);
        return updatedProd;
      }
      return p;
    });

    setProducts(updatedProductsList);
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);

    // Save order directly to Firestore database!
    await saveFirestoreOrder(newOrder);

    // Notify Admin/Staff in real-time (Strictly targeted to staff, not customer account)
    addNotification({
      targetRole: 'staff',
      type: 'order_placed',
      title: 'New Customer Order Received',
      message: `Order #${orderId} was placed by ${orderCustomer.fullName || orderCustomer.email} for ${formatBDT(orderTotalAmount)} (${cart.length} items).`,
      orderId,
    });

    // Send Telegram Order Notification to Admin / Group if configured
    try {
      let tgConfig = telegramConfig;
      if (!tgConfig.botToken || !tgConfig.chatId) {
        const remoteTg = await fetchFirestoreTelegramConfig();
        if (remoteTg && remoteTg.botToken) {
          tgConfig = remoteTg;
        } else {
          tgConfig = getStoredTelegramConfig();
        }
      }

      if (tgConfig.enabled && tgConfig.botToken && tgConfig.chatId) {
        const tgMsg = formatOrderForTelegram(newOrder, 'XEEROO Store');
        sendTelegramMessage(tgConfig.botToken, tgConfig.chatId, tgMsg).then(res => {
          if (!res.success) {
            console.warn('Telegram order alert notice:', res.message);
          }
        });
      }
    } catch (tgErr) {
      console.warn('Telegram order alert dispatch exception:', tgErr);
    }

    addToast(`Order #${orderId} placed successfully and saved to database!`, 'success');
    return newOrder;
  };

  const updateTelegramConfig = async (newConfig: TelegramConfig): Promise<boolean> => {
    setTelegramConfig(newConfig);
    saveStoredTelegramConfig(newConfig);
    const ok = await saveFirestoreTelegramConfig(newConfig);
    return ok;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    if (!canUpdateOrderStatus) {
      addToast('Access Denied: Only Staff can update order status.', 'error');
      return false;
    }

    let targetOrder = orders.find(o => o.id === orderId);

    // If order was not found in local memory, fetch directly from Firestore
    if (!targetOrder) {
      try {
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        if (orderSnap.exists()) {
          targetOrder = orderSnap.data() as Order;
        }
      } catch (err) {
        console.warn('Error fetching order from Firestore:', err);
      }
    }

    if (!targetOrder) {
      addToast(`Order #${orderId} not found in database.`, 'error');
      return false;
    }

    const updatedOrder: Order = {
      ...targetOrder,
      status,
      updatedAt: new Date().toISOString(),
    };

    // 1. Save updated order in Firestore
    await saveFirestoreOrder(updatedOrder);

    // 2. Update local state
    setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));

    // 3. Resolve target customer ID, email, and phone strictly for customer notification
    let customerId = (targetOrder.userId || (targetOrder as any).customerId || '').trim();
    let customerEmail = (targetOrder.userEmail || '').trim();
    let customerPhone = (targetOrder.shippingAddress?.phone || '').replace(/[^0-9]/g, '');

    if (!customerId && customerEmail) {
      const match = users.find(u => u.email.toLowerCase() === customerEmail.toLowerCase());
      if (match) customerId = match.id;
    }
    if (!customerId && customerPhone) {
      const match = users.find(u => (u.phone || '').replace(/[^0-9]/g, '') === customerPhone);
      if (match) customerId = match.id;
    }

    const targetCustomerId = customerId || targetOrder.userId || (targetOrder as any).customerId || undefined;

    // 4. Create and trigger real-time notification document for customer in Firestore
    // STRICT RULE: Status update notifications (Processing, Shipped, Delivered) MUST be sent ONLY to the target customer's ID!
    const notifId = `notif-status-${orderId}-${Date.now()}`;
    await addNotification({
      id: notifId,
      userId: targetCustomerId,
      customerId: targetCustomerId,
      userEmail: customerEmail || undefined,
      phone: customerPhone || undefined,
      targetRole: 'customer',
      type: 'order_status',
      title: `Order #${orderId} Status: ${status.toUpperCase()}`,
      message: `Your order #${orderId} status has been updated to "${status.toUpperCase()}".`,
      orderId,
      orderStatus: status,
    });

    // Auto-trigger: Send a "Review Request" notification when status is 'delivered' strictly to the customer
    if (status === 'delivered' && targetOrder.items && targetOrder.items.length > 0) {
      for (const item of targetOrder.items) {
        const revNotifId = `notif-rev-${orderId}-${item.productId}-${Date.now()}`;
        await addNotification({
          id: revNotifId,
          userId: targetCustomerId,
          customerId: targetCustomerId,
          userEmail: customerEmail || undefined,
          phone: customerPhone || undefined,
          targetRole: 'customer',
          type: 'review_request',
          orderId,
          productId: item.productId,
          productTitle: item.productTitle,
          title: `Review Request: ${item.productTitle}`,
          message: `Your order #${orderId} has been delivered! How was your experience with ${item.productTitle}? Tap to leave a rating & review.`,
        });
      }
    }

    addToast(`Order #${orderId} marked as ${status.toUpperCase()}`, 'success');
    return true;
  };

  // Notification helper methods (Real-time Firestore)
  const addNotification = async (
    data: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { id?: string; createdAt?: string; isRead?: boolean }
  ): Promise<boolean> => {
    const newNotification: AppNotification = {
      ...data,
      id: data.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      isRead: data.isRead ?? false,
      createdAt: data.createdAt || new Date().toISOString(),
    };

    const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
    const isCustomerNotification =
      data.targetRole === 'customer' ||
      data.type === 'order_status' ||
      data.type === 'review_request' ||
      Boolean(data.customerId) ||
      (Boolean(data.userId) && data.userId !== currentUser?.id);

    // If staff is triggering a customer status update or customer notification,
    // NEVER put it into the staff member's local state or localStorage!
    // It is exclusively for the target customer to receive via Firestore.
    if (!isStaff || !isCustomerNotification) {
      setNotifications(prev => {
        const next = [newNotification, ...prev.filter(n => n.id !== newNotification.id)];
        try {
          localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(next));
        } catch (e) {
          console.warn('LocalStorage error:', e);
        }
        return next;
      });
    }

    await saveFirestoreNotification(newNotification);
    return true;
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications(prev => {
      const next = prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n));
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return next;
    });
    await updateFirestoreNotification(notificationId, { isRead: true });
  };

  const markAllNotificationsAsRead = async () => {
    const unreadIds = visibleNotifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;
    setNotifications(prev => {
      const next = prev.map(n => (unreadIds.includes(n.id) ? { ...n, isRead: true } : n));
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return next;
    });
    await Promise.all(unreadIds.map(id => updateFirestoreNotification(id, { isRead: true })));
    addToast('All notifications marked as read', 'info');
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== notificationId);
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return next;
    });
    await deleteFirestoreNotification(notificationId);
  };

  const clearAllNotifications = async () => {
    const idsToClear = visibleNotifications.map(n => n.id);
    setNotifications(prev => {
      const next = prev.filter(n => !idsToClear.includes(n.id));
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return next;
    });
    await Promise.all(idsToClear.map(id => deleteFirestoreNotification(id)));
    addToast('All notifications cleared', 'info');
  };

  // User-specific orders
  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'customer') {
      const currentId = (currentUser.id || '').trim();
      const currentEmail = (currentUser.email || '').toLowerCase().trim();
      const currentPhone = (currentUser.phone || '').replace(/[^0-9]/g, '');

      return orders.filter(o => {
        const orderUserId = (o.userId || (o as any).customerId || '').trim();
        const orderEmail = (o.userEmail || '').toLowerCase().trim();
        const orderPhone = (o.shippingAddress?.phone || '').replace(/[^0-9]/g, '');

        return (
          (orderUserId && (orderUserId === currentId || currentId.includes(orderUserId) || orderUserId.includes(currentId))) ||
          (currentEmail && orderEmail && orderEmail === currentEmail) ||
          (currentPhone && orderPhone && orderPhone === currentPhone)
        );
      });
    }
    return orders;
  }, [orders, currentUser]);

  const userOrderIds = useMemo(() => {
    return new Set(userOrders.map(o => o.id));
  }, [userOrders]);

  const visibleNotifications = useMemo(() => {
    if (!currentUser) {
      return notifications.filter(n => n.targetRole === 'all' && !n.orderId && !n.userId);
    }
    const isStaff = currentUser.role === 'admin' || currentUser.role === 'moderator';
    const currentId = (currentUser.id || '').trim();
    const currentEmail = (currentUser.email || '').toLowerCase().trim();
    const currentPhone = (currentUser.phone || '').replace(/[^0-9]/g, '');

    return notifications.filter(n => {
      const notifUserId = (n.userId || n.customerId || '').trim();
      const notifEmail = (n.userEmail || '').toLowerCase().trim();
      const notifPhone = (n.phone || '').replace(/[^0-9]/g, '');

      if (isStaff) {
        // CRITICAL BUG FIX: Staff/Admin accounts MUST NEVER receive or see customer order status updates
        // (Processing, Shipped, Delivered) or customer review requests!
        // These are strictly meant for the specific customer who placed the order.
        if (n.type === 'order_status' || n.type === 'review_request' || n.targetRole === 'customer') {
          return false;
        }

        return (
          n.targetRole === 'staff' ||
          n.type === 'order_placed' ||
          (n.targetRole === 'all' && !n.orderId && !n.userId)
        );
      }

      // Customer view:
      // STRICT RULE: Customer accounts MUST NEVER receive or see 'order_placed' notifications or staff-targeted notifications!
      if (n.targetRole === 'staff' || n.type === 'order_placed') {
        return false;
      }

      // Check if this notification is strictly meant for this customer:
      const isForThisCustomer =
        (notifUserId && (
          notifUserId === currentId ||
          currentId.includes(notifUserId) ||
          notifUserId.includes(currentId) ||
          (currentPhone && notifUserId === currentPhone)
        )) ||
        (currentEmail && notifEmail && notifEmail === currentEmail) ||
        (currentPhone && notifPhone && notifPhone === currentPhone) ||
        (Boolean(n.orderId) && userOrderIds.has(n.orderId!) && n.type === 'order_status');

      // Customers only receive order status updates (e.g. Processing, Shipped, Delivered) and review requests
      if (n.type === 'order_status' || n.type === 'review_request') {
        return isForThisCustomer;
      }

      if (n.targetRole === 'customer') {
        return isForThisCustomer;
      }

      // Only generic public broadcast notifications (without customer or order targeting)
      return n.targetRole === 'all' && !n.userId && !n.customerId && !n.orderId;
    });
  }, [notifications, currentUser, userOrderIds]);

  const unreadNotificationsCount = useMemo(() => {
    return visibleNotifications.filter(n => !n.isRead).length;
  }, [visibleNotifications]);

  // Reset to original mock data
  const resetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setOrders(INITIAL_ORDERS);
    setUsers(INITIAL_USERS);
    setBanners(INITIAL_BANNERS);
    setCart([]);
    setCurrentUserId(null);
    addToast('All demo inventory, banners, and orders reset.', 'info');
  };

  const value: StoreContextType = {
    // Telegram Bot Settings
    telegramConfig,
    updateTelegramConfig,

    currentUser,
    users,
    isLoggedIn,
    login,
    loginAsAdmin,
    loginWithGoogle,
    loginWithGooglePopup,
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
    openForgotPasswordModal,

    pendingRegistration,
    initiateRegistration,
    verifyOtpAndComplete,
    resendOtp,
    resetPassword,
    pendingPasswordReset,
    sendPasswordResetOtp,
    verifyPasswordResetOtpAndSetPassword,
    createAdminAccountInDatabase,

    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settingsModalInitialTab,
    openSettingsModal,
    updateUserProfile,

    viewMode,
    setViewMode,
    selectedProductId,
    setSelectedProductId,
    dashboardTab,
    setDashboardTab,
    navigateTo,
    navigateToProduct,
    navigateToContact,
    navigateToCheckout,
    navigateToOrders,
    navigateToDashboard,
    navigateToStore,
    navigateToSchemaDocs,

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
    addProductReview,
    updateProductReview,
    deleteProductReview,
    syncBusinessKoroProducts,

    // Real-time Notifications
    notifications: visibleNotifications,
    unreadNotificationsCount,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,

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
    deliveryCharge,
    getDeliveryChargeForLocation,
    cartTotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    openCheckoutModal,

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

    // Database Status & Sync Operations
    dbStatus,
    testDbConnection,
    syncCatalogToDatabase,
    pullCatalogFromDatabase,

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
