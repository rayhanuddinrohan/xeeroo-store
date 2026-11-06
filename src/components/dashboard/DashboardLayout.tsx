/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DashboardTab } from '../../types';
import { AnalyticsTab } from './AnalyticsTab';
import { ProductManagementTab } from './ProductManagementTab';
import { OrderManagementTab } from './OrderManagementTab';
import { UserManagementTab } from './UserManagementTab';
import { CategoryManagementTab } from './CategoryManagementTab';
import { BannerManagementTab } from './BannerManagementTab';
import { ProductImportTab } from './ProductImportTab';
import { DatabaseManagementTab } from './DatabaseManagementTab';
import { SchemaDocsModal } from './SchemaDocsModal';
import { AccountSettingsTab } from './AccountSettingsTab';
import { FacebookIntegrationTab } from './FacebookIntegrationTab';
import { ProductFormModal } from './ProductFormModal';
import { SyncProductsModal } from './SyncProductsModal';
import { OrderHistory } from '../store/OrderHistory';
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
  Lock,
  ExternalLink,
  RotateCcw,
  Image as ImageIcon,
  DownloadCloud,
  Database,
  Settings,
  Share2,
  Menu,
  X,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const {
    currentUser,
    dashboardTab,
    setDashboardTab,
    setViewMode,
    switchUserRole,
    canAccessDashboard,
    canManageUsers,
    canManageCategories,
    canViewAnalytics,
    resetDemoData,
    banners,
    orders,
    products,
    navigateToStore,
    openLoginModal,
  } = useStore();

  const isCustomer = currentUser?.role === 'customer';
  const isModerator = currentUser?.role === 'moderator';
  const isAdmin = currentUser?.role === 'admin';

  // Ensure customer stays on customer tabs, moderator on staff tabs
  useEffect(() => {
    if (isCustomer && !['my-orders', 'settings'].includes(dashboardTab)) {
      setDashboardTab('my-orders');
    } else if (isModerator && ['analytics', 'users', 'database', 'docs', 'importer'].includes(dashboardTab)) {
      setDashboardTab('orders');
    }
  }, [isCustomer, isModerator, dashboardTab, setDashboardTab]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const handleOpenNewProduct = () => {
    setIsDrawerOpen(false);
    setDashboardTab('products');
    setIsProductModalOpen(true);
  };

  const handleOpenSyncImport = () => {
    setIsDrawerOpen(false);
    setIsSyncModalOpen(true);
  };

  const handleOpenAddCategory = () => {
    setIsDrawerOpen(false);
    setDashboardTab('categories');
  };

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const handleSelectTab = (tab: DashboardTab) => {
    setDashboardTab(tab);
    setIsDrawerOpen(false); // Automatically close side drawer upon selecting any navigation item
  };

  const getTabTitle = (tab: DashboardTab): string => {
    switch (tab) {
      case 'orders': return 'Order Fulfillment & Lifecycle';
      case 'products': return 'Product Inventory Management';
      case 'banners': return 'Desktop Hero Banners';
      case 'categories': return 'Department Categories';
      case 'analytics': return 'Sales Analytics & Revenue';
      case 'users': return 'User Directory & Approvals';
      case 'importer': return 'Product Importer API';
      case 'facebook': return 'Facebook Page Auto-Post';
      case 'database': return 'Cloud Database (Firestore)';
      case 'docs': return 'Schema & SQL Docs';
      case 'my-orders': return 'My Orders & Invoices';
      case 'settings': return 'Account Settings & Address';
      default: return 'Admin Console';
    }
  };

  const getTabIcon = (tab: DashboardTab) => {
    switch (tab) {
      case 'orders': return <ShoppingBag className="w-4 h-4" />;
      case 'products': return <Package className="w-4 h-4" />;
      case 'banners': return <ImageIcon className="w-4 h-4" />;
      case 'categories': return <FolderTree className="w-4 h-4" />;
      case 'analytics': return <BarChart3 className="w-4 h-4 text-purple-600" />;
      case 'users': return <Users className="w-4 h-4 text-indigo-600" />;
      case 'importer': return <DownloadCloud className="w-4 h-4 text-emerald-600" />;
      case 'facebook': return <Share2 className="w-4 h-4 text-blue-600" />;
      case 'database': return <Database className="w-4 h-4 text-blue-500" />;
      case 'docs': return <FileCode className="w-4 h-4 text-purple-600" />;
      case 'my-orders': return <Package className="w-4 h-4 text-blue-600" />;
      case 'settings': return <Settings className="w-4 h-4 text-gray-600" />;
      default: return <Shield className="w-4 h-4 text-purple-600" />;
    }
  };

  // Guest Guard: Prompt to log in
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Administrator Sign In Required
          </h2>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            The Admin Dashboard is strictly restricted to administrator accounts. Please sign in with an authorized administrator account to access backend controls.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={openLoginModal}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
            >
              Sign In as Admin
            </button>
            <a
              href="/#/"
              onClick={(e) => {
                e.preventDefault();
                navigateToStore();
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-center"
            >
              Return to Storefront
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Customer / Non-admin role guard: strictly restricted to role === 'admin'
  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Admin Access Restricted
          </h2>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            The Admin Dashboard is only accessible to users with administrator privileges (<code className="px-1.5 py-0.5 rounded bg-gray-100 text-purple-700 font-bold font-mono">role === &apos;admin&apos;</code>). Your current account does not have access.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/#/"
              onClick={(e) => {
                e.preventDefault();
                navigateToStore();
              }}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
            >
              Return to Storefront
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col py-4 w-full">
      {/* =========================================================================
          RESPONSIVE TOP NAVIGATION BAR (Desktop & Mobile)
          Contains 3-line hamburger menu button to smoothly open admin side drawer
         ========================================================================= */}
      <header className="bg-white rounded-2xl border border-gray-200 shadow-xs p-3 sm:p-4 mb-6 flex items-center justify-between gap-3 sticky top-2 z-30 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3 min-w-0">
          {/* Top-left 3-line hamburger menu toggle button */}
          <button
            id="admin-nav-drawer-toggle"
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 sm:px-3 sm:py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 group"
            aria-label="Open Admin Navigation Menu"
            title="Open Admin Navigation Menu"
          >
            <Menu className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold hidden sm:inline">Admin Menu</span>
          </button>

          {/* Active section title & icon indicator */}
          <div className="flex items-center gap-2.5 min-w-0 pl-1 border-l border-gray-200">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              {getTabIcon(dashboardTab)}
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono leading-none truncate">
                {isCustomer ? 'Customer Portal' : isModerator ? 'Staff Dashboard' : 'Admin Console'}
              </span>
              <h1 className="text-xs sm:text-sm font-black text-gray-900 tracking-tight leading-tight truncate">
                {getTabTitle(dashboardTab)}
              </h1>
            </div>
          </div>
        </div>

        {/* Right side controls: Role Badge & Return to Storefront */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 sm:px-2.5 py-1 rounded-lg uppercase ${
              currentUser?.role === 'admin'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : currentUser?.role === 'moderator'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {currentUser?.role === 'admin' ? 'Master Admin' : currentUser?.role === 'moderator' ? 'Staff' : 'Customer'}
          </span>

          <button
            type="button"
            onClick={navigateToStore}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-950 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            title="Return to XEEROO Storefront"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Storefront</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          ACCESSIBLE SIDE DRAWER OVERLAY (Responsive Mobile & Desktop)
          Slides in smoothly from the left when clicking the 3-line hamburger menu
         ========================================================================= */}
      {isDrawerOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Side Drawer Content */}
          <aside
            id="admin-side-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Admin Navigation Menu"
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-250 ease-out border-r border-gray-200"
          >
            <div className="p-4 space-y-6">
              {/* Drawer Header with Brand Logo & Close Button */}
              <div className="pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BrandLogo size="xs" />
                    <div>
                      <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                        {isCustomer ? 'Customer Dashboard' : isModerator ? 'Staff Dashboard' : 'Admin Console'}
                      </h2>
                      <span className="text-[10px] text-gray-400 font-mono">XEEROO E-Commerce</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    aria-label="Close navigation drawer"
                    title="Close navigation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Current User Card */}
                <div className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <UserAvatar
                    user={currentUser}
                    gender={currentUser?.gender}
                    role={currentUser?.role}
                    size="sm"
                    showSignBadge={true}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-gray-900 truncate">
                      {currentUser?.fullName}
                    </p>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${
                        currentUser?.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : currentUser?.role === 'moderator'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {currentUser?.role === 'admin'
                        ? 'Master Admin'
                        : currentUser?.role === 'moderator'
                        ? 'Staff Moderator'
                        : 'Verified Customer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Links inside Drawer */}
              {isCustomer ? (
                /* Customer Navigation */
                <nav className="space-y-1">
                  <div className="px-2 pb-1 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 font-mono">
                      My Account
                    </span>
                  </div>

                  <button
                    type="button"
                    id="drawer-tab-btn-my-orders"
                    onClick={() => handleSelectTab('my-orders')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-xs ${
                      dashboardTab === 'my-orders'
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100 font-medium'
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-xs ${
                      dashboardTab === 'settings'
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4" />
                      <span>Account Settings & Address</span>
                    </div>
                  </button>
                </nav>
              ) : (
                /* Admin & Staff Navigation */
                <nav className="space-y-3">
                  {/* Consolidated Quick Administrative Actions */}
                  <div className="p-3 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-xl text-white space-y-2 shadow-xs border border-slate-700/60">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-700/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                        <span>Quick Actions</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-200 font-bold border border-indigo-400/30">
                        Admin
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {/* + New Product Button */}
                      <button
                        type="button"
                        id="drawer-action-btn-new-product"
                        onClick={handleOpenNewProduct}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer text-left active:scale-95"
                        title="Add a new product to catalog"
                      >
                        <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                        <span className="truncate">+ New Product</span>
                      </button>

                      {/* + Categories Button */}
                      <button
                        type="button"
                        id="drawer-action-btn-categories"
                        onClick={handleOpenAddCategory}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-[11px] border border-slate-700 shadow-xs transition-all cursor-pointer text-left active:scale-95"
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
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer text-left active:scale-95"
                        title="Sync catalog with BusinessKoro API"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-white shrink-0" />
                        <span className="truncate">Sync Import</span>
                      </button>

                      {/* Share Auto FB Post Button */}
                      <button
                        type="button"
                        id="drawer-action-btn-fb"
                        onClick={() => handleSelectTab('facebook')}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer text-left active:scale-95"
                        title="Facebook Page Auto-Post Settings"
                      >
                        <Share2 className="w-3.5 h-3.5 text-white shrink-0" />
                        <span className="truncate">Auto FB Post</span>
                      </button>
                    </div>

                    {/* API Web Importer button full width */}
                    <button
                      type="button"
                      id="drawer-action-btn-importer"
                      onClick={() => handleSelectTab('importer')}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] border border-slate-700/80 transition-all cursor-pointer active:scale-95"
                      title="Import Products via External API & Web Scraper"
                    >
                      <div className="flex items-center gap-1.5">
                        <DownloadCloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>API & Web Importer</span>
                      </div>
                      <span className="text-[9px] font-mono bg-cyan-950/80 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800">
                        External Scraper
                      </span>
                    </button>
                  </div>

                  {/* Staff Operations Group */}
                  <div className="space-y-1">
                    <div className="px-2 pb-1 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 font-mono">
                        Staff Operations
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold">
                        Active
                      </span>
                    </div>

                  {/* Order Management */}
                  <button
                    type="button"
                    id="drawer-tab-btn-orders"
                    onClick={() => handleSelectTab('orders')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                      dashboardTab === 'orders'
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Order Fulfillment</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        dashboardTab === 'orders'
                          ? 'bg-blue-700 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {orders.length}
                    </span>
                  </button>

                  {/* Product Catalog */}
                  <button
                    type="button"
                    id="drawer-tab-btn-products"
                    onClick={() => handleSelectTab('products')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                      dashboardTab === 'products'
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4" />
                      <span>Product Catalog</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        dashboardTab === 'products'
                          ? 'bg-blue-700 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {products.length}
                    </span>
                  </button>

                  {/* Desktop Banners */}
                  <button
                    type="button"
                    id="drawer-tab-btn-banners"
                    onClick={() => handleSelectTab('banners')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                      dashboardTab === 'banners'
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4" />
                      <span>Desktop Banners</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        dashboardTab === 'banners'
                          ? 'bg-blue-700 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {banners.length}/10
                    </span>
                  </button>

                  {/* Categories */}
                  <button
                    type="button"
                    id="drawer-tab-btn-categories"
                    onClick={() => handleSelectTab('categories')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                      dashboardTab === 'categories'
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderTree className="w-4 h-4" />
                      <span>Categories</span>
                    </div>
                  </button>
                </div>

                  {/* ADMIN ONLY MANAGEMENT SECTION */}
                  {isAdmin ? (
                    <div className="pt-3 border-t border-gray-100 space-y-1">
                      <div className="px-2 pb-1 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 font-mono">
                          Master Administration
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold">
                          Admin
                        </span>
                      </div>

                      {/* Analytics */}
                      <button
                        type="button"
                        id="drawer-tab-btn-analytics"
                        onClick={() => handleSelectTab('analytics')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                          dashboardTab === 'analytics'
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <BarChart3 className="w-4 h-4" />
                          <span>Sales Analytics</span>
                        </div>
                      </button>

                      {/* Users */}
                      <button
                        type="button"
                        id="drawer-tab-btn-users"
                        onClick={() => handleSelectTab('users')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                          dashboardTab === 'users'
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4" />
                          <span>Users & Approvals</span>
                        </div>
                      </button>

                      {/* Product Importer */}
                      <button
                        type="button"
                        id="drawer-tab-btn-importer"
                        onClick={() => handleSelectTab('importer')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                          dashboardTab === 'importer'
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <DownloadCloud className="w-4 h-4 text-emerald-600" />
                          <span>Product Importer</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          API
                        </span>
                      </button>

                      {/* Facebook Auto-Post */}
                      <button
                        type="button"
                        id="drawer-tab-btn-facebook"
                        onClick={() => handleSelectTab('facebook')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                          dashboardTab === 'facebook'
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Share2 className={`w-4 h-4 ${dashboardTab === 'facebook' ? 'text-white' : 'text-blue-600'}`} />
                          <span>Facebook Auto-Post</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${dashboardTab === 'facebook' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'}`}>
                          Active
                        </span>
                      </button>

                      {/* Cloud Database (Firestore) */}
                      <button
                        type="button"
                        id="drawer-tab-btn-database"
                        onClick={() => handleSelectTab('database')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                          dashboardTab === 'database'
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                          dashboardTab === 'docs'
                            ? 'bg-purple-600 text-white font-bold shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <FileCode className="w-4 h-4" />
                          <span>Schema & SQL Docs</span>
                        </div>
                      </button>
                    </div>
                  ) : null}

                  {/* Personal Account Group */}
                  <div className="pt-3 border-t border-gray-100 space-y-1">
                    <div className="px-2 pb-1 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 font-mono">
                        Personal Account
                      </span>
                    </div>

                    <button
                      type="button"
                      id="drawer-tab-btn-my-personal-orders"
                      onClick={() => handleSelectTab('my-orders')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-xs ${
                        dashboardTab === 'my-orders'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4" />
                        <span>My Personal Orders</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="drawer-tab-btn-personal-settings"
                      onClick={() => handleSelectTab('settings')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-xs ${
                        dashboardTab === 'settings'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4" />
                        <span>Account Settings</span>
                      </div>
                    </button>
                  </div>
                </nav>
              )}
            </div>

            {/* Bottom shortcut to Storefront */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/70">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigateToStore();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-gray-800 hover:text-gray-950 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to XEEROO Store</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Dashboard Content Area - Expansive Full Width */}
      <main className="w-full min-w-0">

        {/* Tab Content Components */}
        {dashboardTab === 'analytics' && <AnalyticsTab />}
        {dashboardTab === 'products' && <ProductManagementTab />}
        {dashboardTab === 'orders' && <OrderManagementTab />}
        {dashboardTab === 'banners' && <BannerManagementTab />}
        {dashboardTab === 'users' && <UserManagementTab />}
        {dashboardTab === 'categories' && <CategoryManagementTab />}
        {dashboardTab === 'importer' && <ProductImportTab />}
        {dashboardTab === 'database' && <DatabaseManagementTab />}
        {dashboardTab === 'facebook' && <FacebookIntegrationTab />}
        {dashboardTab === 'docs' && <SchemaDocsModal />}
        {dashboardTab === 'my-orders' && <OrderHistory />}
        {dashboardTab === 'settings' && <AccountSettingsTab />}
      </main>

      {/* Product Form Modal (triggered directly from drawer) */}
      {isProductModalOpen && (
        <ProductFormModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
        />
      )}

      {/* Sync Products Modal (triggered directly from drawer) */}
      {isSyncModalOpen && (
        <SyncProductsModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
        />
      )}
    </div>
  );
};
