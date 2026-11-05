/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
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
import { OrderHistory } from '../store/OrderHistory';
import { BrandLogo } from '../common/BrandLogo';
import { UserAvatar } from '../common/UserAvatar';
import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
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
    <div className="min-h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 py-4">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header info */}
          <div className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <BrandLogo size="xs" />
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                {isCustomer ? 'Customer Dashboard' : isModerator ? 'Staff Dashboard' : 'Admin Console'}
              </h2>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
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

          {/* Navigation Links */}
          {isCustomer ? (
            /* Customer Tabs */
            <nav className="space-y-1">
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 font-mono">
                  My Account
                </span>
              </div>

              <button
                id="tab-btn-my-orders"
                onClick={() => setDashboardTab('my-orders')}
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
                id="tab-btn-account-settings"
                onClick={() => setDashboardTab('settings')}
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
            /* Admin & Staff Tabs */
            <nav className="space-y-1">
              {/* Staff Operations Group */}
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 font-mono">
                  Staff Operations
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold">
                  Active
                </span>
              </div>

              {/* Order Management (Orders) */}
              <button
                id="tab-btn-orders"
                onClick={() => setDashboardTab('orders')}
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

              {/* Product Catalog (Products) */}
              <button
                id="tab-btn-products"
                onClick={() => setDashboardTab('products')}
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
                id="tab-btn-banners"
                onClick={() => setDashboardTab('banners')}
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
                id="tab-btn-categories"
                onClick={() => setDashboardTab('categories')}
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

              {/* ADMIN ONLY MANAGEMENT SECTION */}
              {isAdmin ? (
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <div className="px-2 pb-1 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 font-mono">
                      Administration
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold">
                      Master
                    </span>
                  </div>

                  {/* Analytics */}
                  <button
                    id="tab-btn-analytics"
                    onClick={() => setDashboardTab('analytics')}
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
                    id="tab-btn-users"
                    onClick={() => setDashboardTab('users')}
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
                    id="tab-btn-importer"
                    onClick={() => setDashboardTab('importer')}
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
                    id="tab-btn-facebook"
                    onClick={() => setDashboardTab('facebook')}
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
                    id="tab-btn-database"
                    onClick={() => setDashboardTab('database')}
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
                    id="tab-btn-docs"
                    onClick={() => setDashboardTab('docs')}
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
              ) : (
                <div className="pt-2 border-t border-gray-100">
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-amber-900">
                      <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Staff Privileges</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      You have active authorization to manage orders and the product catalog.
                    </p>
                  </div>
                </div>
              )}

              {/* Personal Account Group for Staff / Admin */}
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <div className="px-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 font-mono">
                    Personal Account
                  </span>
                </div>

                <button
                  id="tab-btn-my-orders"
                  onClick={() => setDashboardTab('my-orders')}
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
                  id="tab-btn-account-settings"
                  onClick={() => setDashboardTab('settings')}
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
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <a
            href="/#/"
            onClick={(e) => {
              e.preventDefault();
              navigateToStore();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to XEEROO Store</span>
          </a>
        </div>
      </aside>

      {/* Main Dashboard Content Area */}
      <main className="flex-1 min-w-0">
        {/* Header Breadcrumb inside dashboard */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Dashboard</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-bold capitalize">
              {dashboardTab === 'analytics'
                ? 'Sales Analytics & Revenue'
                : dashboardTab === 'products'
                ? 'Product Inventory Management'
                : dashboardTab === 'orders'
                ? 'Order Fulfillment & Lifecycle'
                : dashboardTab === 'banners'
                ? 'Desktop Hero Banners (Auto-switch)'
                : dashboardTab === 'users'
                ? 'User Directory & Customer Approvals'
                : dashboardTab === 'categories'
                ? 'Department Categories'
                : dashboardTab === 'importer'
                ? 'API & External Website Product Importer'
                : dashboardTab === 'database'
                ? 'Cloud Database Collections & Customer Tables'
                : dashboardTab === 'facebook'
                ? 'Facebook Page Auto-Post Integration'
                : dashboardTab === 'my-orders'
                ? 'My Personal Orders & Tracking'
                : dashboardTab === 'settings'
                ? 'Account Settings & Delivery Address'
                : 'PostgreSQL DDL & RLS Policies'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Role:</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded uppercase ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : currentUser?.role === 'moderator'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {currentUser?.role || 'Customer'}
            </span>
          </div>
        </div>

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
    </div>
  );
};
