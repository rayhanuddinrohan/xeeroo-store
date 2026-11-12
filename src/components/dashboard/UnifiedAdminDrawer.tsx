/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DashboardTab } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { SyncProductsModal } from './SyncProductsModal';
import { BrandLogo } from '../common/BrandLogo';
import { UserAvatar } from '../common/UserAvatar';
import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  FolderPlus,
  FileCode,
  ArrowLeft,
  Shield,
  Layers,
  Image as ImageIcon,
  DownloadCloud,
  Database,
  Settings,
  Share2,
  X,
  Plus,
  RefreshCw,
  Sparkles,
  Store,
  LogIn,
  UserPlus,
  LogOut,
  Headphones,
  Tag,
} from 'lucide-react';

export const UnifiedAdminDrawer: React.FC = () => {
  const {
    isAdminDrawerOpen,
    closeAdminDrawer,
    currentUser,
    dashboardTab,
    setDashboardTab,
    setViewMode,
    orders,
    products,
    banners,
    categories,
    selectedCategory,
    navigateToStore,
    navigateToOrders,
    navigateToContact,
    openLoginModal,
    openRegisterModal,
    openSettingsModal,
    logout,
    facebookConfig,
  } = useStore();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isAdminDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAdminDrawerOpen]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAdminDrawerOpen) {
        closeAdminDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminDrawerOpen, closeAdminDrawer]);

  const isModerator = currentUser?.role === 'moderator';
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = isModerator || isAdmin;

  const handleSelectTab = (tab: DashboardTab) => {
    if (!isStaff) {
      closeAdminDrawer();
      return;
    }
    setDashboardTab(tab);
    setViewMode('dashboard');
    closeAdminDrawer();
  };

  const handleOpenNewProduct = () => {
    if (!isStaff) return;
    setDashboardTab('products');
    setViewMode('dashboard');
    setIsProductModalOpen(true);
    closeAdminDrawer();
  };

  const handleOpenSyncImport = () => {
    if (!isStaff) return;
    setIsSyncModalOpen(true);
    closeAdminDrawer();
  };

  const handleOpenAddCategory = () => {
    if (!isStaff) return;
    setDashboardTab('categories');
    setViewMode('dashboard');
    closeAdminDrawer();
  };

  const publishedCategories = categories.filter(cat => {
    if (cat.id === 'all') return false;
    return products.some(
      p => p.isPublished && p.stockQuantity > 0 && p.categoryId === cat.id
    );
  });

  return (
    <>
      {/* Backdrop with smooth blur & fade transition for both open/close */}
      <div
        className={`fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm transition-all duration-300 ease-out cursor-pointer ${
          isAdminDrawerOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={closeAdminDrawer}
        aria-hidden="true"
      />

      {/* Modern Glassmorphic Side Drawer Content with silky spring-like slide transitions */}
      <aside
        id="unified-admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={isStaff ? 'Unified Admin Navigation & Actions Menu' : 'Store Navigation Menu'}
        className={`fixed inset-y-0 left-0 z-50 w-84 max-w-[88vw] bg-white/85 backdrop-blur-2xl border-r border-white/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] flex flex-col justify-between overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isAdminDrawerOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto visible'
            : '-translate-x-full opacity-0 pointer-events-none invisible'
        }`}
      >
        <div className="p-4 space-y-4">
          {/* Glassy Drawer Header with Brand Logo & Close Button */}
          <div className="pb-3 border-b border-gray-200/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <BrandLogo size="xs" />
                <div>
                  <h2 className="text-xs font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>XEEROO</span>
                    {isStaff && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50/80 border border-blue-200/70 px-1.5 py-0.2 rounded font-mono">
                        {isAdmin ? 'ADMIN' : 'STAFF'}
                      </span>
                    )}
                  </h2>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {isStaff ? 'Operations Console' : 'Official Tech Store'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-unified-drawer"
                onClick={closeAdminDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
                aria-label="Close navigation drawer"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current User Card / Guest Account Card */}
            {currentUser ? (
              <div className="flex items-center gap-2.5 p-2 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 backdrop-blur-sm rounded-2xl border border-blue-200/60 shadow-2xs">
                <UserAvatar
                  user={currentUser}
                  gender={currentUser?.gender}
                  role={currentUser?.role}
                  size="sm"
                  showSignBadge={true}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-gray-900 truncate">
                    {currentUser.fullName}
                  </p>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : currentUser.role === 'moderator'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {currentUser.role === 'admin'
                      ? 'Master Admin'
                      : currentUser.role === 'moderator'
                      ? 'Staff Moderator'
                      : 'Verified Customer'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gradient-to-br from-blue-50/90 to-indigo-50/70 backdrop-blur-sm rounded-2xl border border-blue-100/80 shadow-2xs space-y-2">
                <div className="text-center">
                  <p className="text-xs text-gray-900 font-bold">Welcome to XEEROO</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Sign in to track orders or register for advance discounts
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    id="drawer-guest-login-btn"
                    onClick={() => {
                      closeAdminDrawer();
                      openLoginModal();
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    id="drawer-guest-register-btn"
                    onClick={() => {
                      closeAdminDrawer();
                      openRegisterModal();
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Register</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Administrative Actions Card — ONLY visible to Staff / Admin */}
          {isStaff && (
            <div className="p-3 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-indigo-950/95 backdrop-blur-md rounded-2xl text-white space-y-2 shadow-lg border border-slate-700/60">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>Quick Actions</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-200 font-bold border border-indigo-400/30">
                  1-Click
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {/* + New Product Button */}
                <button
                  type="button"
                  id="drawer-action-btn-new-product"
                  onClick={handleOpenNewProduct}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer text-left active:scale-95"
                  title="Add a new product to catalog"
                >
                  <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="truncate">+ New Products</span>
                </button>

                {/* + Categories Button */}
                <button
                  type="button"
                  id="drawer-action-btn-categories"
                  onClick={handleOpenAddCategory}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-bold text-[11px] border border-slate-700 shadow-xs transition-all cursor-pointer text-left active:scale-95"
                  title="Manage product departments & categories"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">+ Categories</span>
                </button>

                {/* Sync Import Button */}
                <button
                  type="button"
                  id="drawer-action-btn-sync"
                  onClick={handleOpenSyncImport}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer text-left active:scale-95"
                  title="Sync catalog with BusinessKoro API"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="truncate">Sync Import</span>
                </button>

                {/* Share Auto FB Post Button — Admin only */}
                {isAdmin && (
                  <button
                    type="button"
                    id="drawer-action-btn-fb"
                    onClick={() => handleSelectTab('facebook')}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer text-left active:scale-95"
                    title="Facebook Page Auto-Post Settings"
                  >
                    <Share2 className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="truncate">Auto FB Post</span>
                  </button>
                )}
              </div>

              {/* API Web Importer button full width — Admin only */}
              {isAdmin && (
                <button
                  type="button"
                  id="drawer-action-btn-importer"
                  onClick={() => handleSelectTab('importer')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] border border-slate-700/70 transition-all cursor-pointer active:scale-95"
                  title="Import Products via External API & Web Scraper"
                >
                  <div className="flex items-center gap-1.5">
                    <DownloadCloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>API Web Importer</span>
                  </div>
                  <span className="text-[9px] font-mono bg-cyan-950/80 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800">
                    External Scraper
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Navigation Links inside Drawer */}
          <nav className="space-y-3">
            {/* Staff Operations Group — ONLY visible to Staff / Admin */}
            {isStaff && (
              <div className="space-y-1 bg-white/40 backdrop-blur-xs p-1.5 rounded-2xl border border-gray-100/60 shadow-2xs">
                <div className="px-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 font-mono">
                    Store & Operations
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold">
                    Staff
                  </span>
                </div>

                {/* Order Fulfillment & Lifecycle */}
                <button
                  type="button"
                  id="drawer-tab-btn-orders"
                  onClick={() => handleSelectTab('orders')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'orders'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Orders & Fulfillments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {orders.some(o => (o.status || 'pending').toLowerCase().trim() === 'pending') && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-white"
                        title="Pending Orders Awaiting Fulfillment"
                      >
                        {orders.filter(o => (o.status || 'pending').toLowerCase().trim() === 'pending').length} pending
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        dashboardTab === 'orders' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {orders.length}
                    </span>
                  </div>
                </button>

                {/* Product Catalog */}
                <button
                  type="button"
                  id="drawer-tab-btn-products"
                  onClick={() => handleSelectTab('products')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'products'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>Product Catalog</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      dashboardTab === 'products' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {products.length}
                  </span>
                </button>

                {/* Category Department (Retain ONLY the primary Category Department section) */}
                <button
                  type="button"
                  id="drawer-tab-btn-categories"
                  onClick={() => handleSelectTab('categories')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'categories'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderTree className="w-4 h-4 text-blue-600" />
                    <span>Category Department</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      dashboardTab === 'categories' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {categories.filter(c => c.id !== 'all').length}
                  </span>
                </button>

                {/* Desktop Banners */}
                <button
                  type="button"
                  id="drawer-tab-btn-banners"
                  onClick={() => handleSelectTab('banners')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'banners'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>Desktop Banners</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      dashboardTab === 'banners' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {banners.length}/10
                  </span>
                </button>
              </div>
            )}

            {/* Master Administration Group — ONLY visible to Master Admin */}
            {isAdmin && (
              <div className="pt-2 border-t border-gray-200/50 space-y-1 bg-white/40 backdrop-blur-xs p-1.5 rounded-2xl border border-gray-100/60 shadow-2xs">
                <div className="px-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 font-mono">
                    Master Administration
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold">
                    Admin
                  </span>
                </div>

                {/* Users & Directory */}
                <button
                  type="button"
                  id="drawer-tab-btn-users"
                  onClick={() => handleSelectTab('users')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'users'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>Users & Approvals</span>
                  </div>
                </button>

                {/* Facebook Auto-Post */}
                <button
                  type="button"
                  id="drawer-tab-btn-facebook"
                  onClick={() => handleSelectTab('facebook')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'facebook'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 className={`w-4 h-4 ${dashboardTab === 'facebook' ? 'text-white' : 'text-blue-600'}`} />
                    <span>Share Auto FB Post</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      facebookConfig?.enabled && facebookConfig?.autoPostOnAdd
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {facebookConfig?.enabled ? 'Active' : 'Disabled'}
                  </span>
                </button>

                {/* Product Importer API */}
                <button
                  type="button"
                  id="drawer-tab-btn-importer"
                  onClick={() => handleSelectTab('importer')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'importer'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <DownloadCloud className="w-4 h-4 text-emerald-600" />
                    <span>API Web Importer</span>
                  </div>
                </button>

                {/* Sales Analytics */}
                <button
                  type="button"
                  id="drawer-tab-btn-analytics"
                  onClick={() => handleSelectTab('analytics')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'analytics'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Sales Analytics</span>
                  </div>
                </button>

                {/* Cloud Database (Firestore) */}
                <button
                  type="button"
                  id="drawer-tab-btn-database"
                  onClick={() => handleSelectTab('database')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'database'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>Cloud Database</span>
                  </div>
                </button>

                {/* Schema & SQL Docs */}
                <button
                  type="button"
                  id="drawer-tab-btn-docs"
                  onClick={() => handleSelectTab('docs')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'docs'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCode className="w-4 h-4" />
                    <span>Schema & SQL Docs</span>
                  </div>
                </button>
              </div>
            )}

            {/* Storefront & Customer Navigation Section (Shown cleanly to Guests & Customers; Account links for Staff too) */}
            {!isStaff ? (
              <>
                <div className="space-y-1 bg-white/40 backdrop-blur-xs p-1.5 rounded-2xl border border-gray-100/60 shadow-2xs">
                  <div className="px-2 pb-1 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 font-mono">
                      Store Navigation
                    </span>
                  </div>

                  <button
                    type="button"
                    id="drawer-store-btn-catalog"
                    onClick={() => {
                      closeAdminDrawer();
                      navigateToStore('all');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs text-gray-700 hover:bg-white/70 hover:text-gray-950 font-semibold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Store className="w-4 h-4 text-blue-600" />
                      <span>All Products</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="drawer-store-btn-orders"
                    onClick={() => {
                      closeAdminDrawer();
                      navigateToOrders();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs text-gray-700 hover:bg-white/70 hover:text-gray-950 font-semibold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-indigo-600" />
                      <span>{currentUser ? 'My Orders & Tracking' : 'Track Orders'}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="drawer-store-btn-contact"
                    onClick={() => {
                      closeAdminDrawer();
                      navigateToContact();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs text-gray-700 hover:bg-white/70 hover:text-gray-950 font-semibold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Headphones className="w-4 h-4 text-emerald-600" />
                      <span>Contact Support</span>
                    </div>
                  </button>

                  {currentUser && (
                    <button
                      type="button"
                      id="drawer-store-btn-settings"
                      onClick={() => {
                        closeAdminDrawer();
                        openSettingsModal('profile');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs text-gray-700 hover:bg-white/70 hover:text-gray-950 font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-gray-600" />
                        <span>Account Settings</span>
                      </div>
                    </button>
                  )}
                </div>

                {/* Clean Shop by Category links for Guests & Customers */}
                {publishedCategories.length > 0 && (
                  <div className="space-y-1 bg-white/40 backdrop-blur-xs p-1.5 rounded-2xl border border-gray-100/60 shadow-2xs">
                    <div className="px-2 pb-1 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 font-mono">
                        Categories
                      </span>
                    </div>
                    {publishedCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          closeAdminDrawer();
                          navigateToStore(cat.id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-xs ${
                          selectedCategory === cat.id
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-gray-700 hover:bg-white/70 hover:text-gray-950 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="pt-2 border-t border-gray-200/50 space-y-1 bg-white/40 backdrop-blur-xs p-1.5 rounded-2xl border border-gray-100/60 shadow-2xs">
                <div className="px-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 font-mono">
                    Personal Account
                  </span>
                </div>

                <button
                  type="button"
                  id="drawer-tab-btn-my-orders"
                  onClick={() => handleSelectTab('my-orders')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'my-orders'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>My Orders & Invoices</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="drawer-tab-btn-account-settings"
                  onClick={() => handleSelectTab('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-xs ${
                    dashboardTab === 'settings'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-gray-700 hover:bg-white/70 hover:text-gray-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </div>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom shortcut: Return to Storefront + Logout (when signed in) */}
        <div className="p-4 border-t border-gray-200/60 bg-white/60 backdrop-blur-md space-y-2">
          <button
            type="button"
            id="drawer-btn-return-storefront"
            onClick={() => {
              closeAdminDrawer();
              navigateToStore();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-gray-800 hover:text-gray-950 bg-white/90 hover:bg-white border border-gray-200/80 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
            <span>Return to XEEROO Store</span>
          </button>

          {currentUser && (
            <button
              type="button"
              id="drawer-btn-logout"
              onClick={() => {
                closeAdminDrawer();
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50/80 border border-red-200/60 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Product Form Modal (triggered directly from drawer — Staff/Admin only) */}
      {isStaff && isProductModalOpen && (
        <ProductFormModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
        />
      )}

      {/* Sync Products Modal (triggered directly from drawer — Staff/Admin only) */}
      {isStaff && isSyncModalOpen && (
        <SyncProductsModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
        />
      )}
    </>
  );
};
