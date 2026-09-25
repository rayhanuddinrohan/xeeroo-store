/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  } = useStore();

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
                XEEROO Admin
              </h2>
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              {currentUser?.fullName || 'Administrator'} (Master Admin)
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-medium">
            {/* Analytics Tab (Admin Only) */}
            <button
              onClick={() => {
                if (canViewAnalytics) {
                  setDashboardTab('analytics');
                }
              }}
              disabled={!canViewAnalytics}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                dashboardTab === 'analytics'
                  ? 'bg-purple-50 text-purple-700 font-bold'
                  : canViewAnalytics
                  ? 'text-gray-700 hover:bg-gray-50'
                  : 'text-gray-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Sales Analytics</span>
              </div>
              {!canViewAnalytics && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-gray-100 text-gray-500 font-mono">
                  Admin
                </span>
              )}
            </button>

            {/* Product Management (Moderator & Admin) */}
            <button
              onClick={() => setDashboardTab('products')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                dashboardTab === 'products'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Product Catalog</span>
              </div>
            </button>

            {/* Order Management (Moderator & Admin) */}
            <button
              onClick={() => setDashboardTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                dashboardTab === 'orders'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Order Fulfillment</span>
              </div>
            </button>

            {/* Banner Management (Staff - Up to 10 banners) */}
            <button
              id="tab-btn-banners"
              onClick={() => setDashboardTab('banners')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                dashboardTab === 'banners'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4" />
                <span>Desktop Banners</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono font-bold">
                {banners.length}/10
              </span>
            </button>

            {/* User Management (Admin Only) */}
            <button
              onClick={() => {
                if (canManageUsers) {
                  setDashboardTab('users');
                }
              }}
              disabled={!canManageUsers}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                dashboardTab === 'users'
                  ? 'bg-purple-50 text-purple-700 font-bold'
                  : canManageUsers
                  ? 'text-gray-700 hover:bg-gray-50'
                  : 'text-gray-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Users & Roles</span>
              </div>
              {!canManageUsers && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-gray-100 text-gray-500 font-mono">
                  Admin
                </span>
              )}
            </button>

            {/* Category Management (Staff & Admin) */}
            <button
              id="tab-btn-categories"
              onClick={() => {
                if (canManageCategories) {
                  setDashboardTab('categories');
                }
              }}
              disabled={!canManageCategories}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                dashboardTab === 'categories'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : canManageCategories
                  ? 'text-gray-700 hover:bg-gray-50'
                  : 'text-gray-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderTree className="w-4 h-4" />
                <span>Categories</span>
              </div>
              {!canManageCategories && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-gray-100 text-gray-500 font-mono">
                  Staff
                </span>
              )}
            </button>

            {/* API Product Importer (New System!) */}
            <button
              id="tab-btn-importer"
              onClick={() => setDashboardTab('importer')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                dashboardTab === 'importer'
                  ? 'bg-cyan-50 text-cyan-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DownloadCloud className="w-4 h-4 text-cyan-600" />
                <span>API Product Importer</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono font-bold">
                API
              </span>
            </button>

            {/* Cloud Database & Tables */}
            <button
              id="tab-btn-database"
              onClick={() => setDashboardTab('database')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                dashboardTab === 'database'
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Cloud Database & Tables</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            {/* Schema & SQL Docs */}
            <button
              onClick={() => setDashboardTab('docs')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                dashboardTab === 'docs'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4" />
                <span>Schema & RLS Docs</span>
              </div>
            </button>
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
