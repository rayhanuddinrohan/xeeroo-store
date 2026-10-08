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
import { BrandLogo } from '../common/BrandLogo';
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
  } = useStore();

  const isModerator = currentUser?.role === 'moderator';
  const isAdmin = currentUser?.role === 'admin';

  // Ensure moderators automatically land on staff tabs (orders or products)
  useEffect(() => {
    if (isModerator && ['analytics', 'users', 'database', 'docs'].includes(dashboardTab)) {
      setDashboardTab('orders');
    }
  }, [isModerator, dashboardTab, setDashboardTab]);

  // RBAC Access Guard: Customers cannot access Dashboard
  if (!canAccessDashboard) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Restricted Dashboard Access
          </h2>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            You are currently authenticated with the <strong className="text-blue-600">Customer</strong> role. Only staff members with <strong className="text-amber-600">Moderator</strong> or <strong className="text-purple-600">Admin</strong> privileges may access the back-office management console.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setViewMode('store')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Return to Storefront
            </button>
            <button
              onClick={() => switchUserRole('moderator')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Switch to Moderator
            </button>
            <button
              onClick={() => switchUserRole('admin')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Switch to Admin
            </button>
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
                {isModerator ? 'Staff Dashboard' : 'Admin Console'}
              </h2>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-600 truncate font-medium">
                {currentUser?.fullName || (isModerator ? 'Staff Member' : 'Administrator')}
              </p>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${
                  isModerator ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                }`}
              >
                {isModerator ? 'Staff Moderator' : 'Master Admin'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4 text-xs font-medium">
            {/* SECTION 1: STAFF OPERATIONS (Moderator & Admin) */}
            <div className="space-y-1">
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
            </div>

            {/* SECTION 2: ADMINISTRATIVE CONTROLS (Admin Only) */}
            {isAdmin ? (
              <div className="space-y-1 pt-2 border-t border-gray-100">
                <div className="px-2 pb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 font-mono">
                    Admin Controls
                  </span>
                </div>

                {/* Sales Analytics */}
                <button
                  id="tab-btn-analytics"
                  onClick={() => setDashboardTab('analytics')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    dashboardTab === 'analytics'
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Sales Analytics</span>
                  </div>
                </button>

                {/* Users & Roles */}
                <button
                  id="tab-btn-users"
                  onClick={() => setDashboardTab('users')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    dashboardTab === 'users'
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>Users & Staff</span>
                  </div>
                </button>

                {/* API Product Importer */}
                <button
                  id="tab-btn-importer"
                  onClick={() => setDashboardTab('importer')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    dashboardTab === 'importer'
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <DownloadCloud className="w-4 h-4" />
                    <span>API Product Importer</span>
                  </div>
                </button>

                {/* Cloud Database */}
                <button
                  id="tab-btn-database"
                  onClick={() => setDashboardTab('database')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    dashboardTab === 'database'
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4" />
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
                    You have active authorization to manage orders and the product catalog. Advanced system settings are reserved for the Master Admin.
                  </p>
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom shortcut to Storefront */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => setViewMode('store')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to XEEROO Store</span>
          </button>
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
                : 'PostgreSQL DDL & RLS Policies'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Authority:</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded uppercase ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {currentUser?.role || 'Guest'}
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
        {dashboardTab === 'docs' && <SchemaDocsModal />}
      </main>
    </div>
  );
};
