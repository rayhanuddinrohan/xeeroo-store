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
import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  FileCode,
  ArrowLeft,
  Shield,
  Lock,
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
    navigateToStore,
    openLoginModal,
  } = useStore();

  const isCustomer = currentUser?.role === 'customer';
  const isModerator = currentUser?.role === 'moderator';

  // Ensure customer stays on customer tabs, moderator on staff tabs
  useEffect(() => {
    if (isCustomer && !['my-orders', 'settings'].includes(dashboardTab)) {
      setDashboardTab('my-orders');
    } else if (isModerator && ['analytics', 'users', 'database', 'docs', 'importer'].includes(dashboardTab)) {
      setDashboardTab('orders');
    }
  }, [isCustomer, isModerator, dashboardTab, setDashboardTab]);

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
          {/* Active section title & icon indicator */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 shrink-0 shadow-2xs">
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
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-950 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer active:scale-95"
            title="Return to XEEROO Storefront"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Storefront</span>
          </button>
        </div>
      </header>

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
    </div>
  );
};
