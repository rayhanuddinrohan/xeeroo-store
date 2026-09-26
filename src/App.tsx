/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { HeroBanner } from './components/store/HeroBanner';
import { ProductListing } from './components/store/ProductListing';
import { ProductDetail } from './components/store/ProductDetail';
import { CartDrawer } from './components/store/CartDrawer';
import { CheckoutModal } from './components/store/CheckoutModal';
import { OrderHistory } from './components/store/OrderHistory';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { SchemaDocsModal } from './components/dashboard/SchemaDocsModal';
import { AuthModal } from './components/AuthModal';
import { CustomerSettingsModal } from './components/CustomerSettingsModal';
import { ContactModal } from './components/ContactModal';
import {
  ShoppingBag,
  Shield,
  Layers,
  Database,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Phone,
  Mail,
  Crown,
  MessageCircle,
} from 'lucide-react';
import { XEEROO_CONTACT } from './data/mockData';
import { BrandLogo } from './components/common/BrandLogo';

const AppContent: React.FC = () => {
  const { viewMode, setViewMode, currentUser, canAccessDashboard, resetDemoData } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleOpenCart = () => {
    setIsCartOpen(true);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Navbar with Role Switcher */}
      <Navbar onOpenCart={handleOpenCart} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'store' && (
          <div>
            <HeroBanner />
            <ProductListing />
          </div>
        )}

        {viewMode === 'product-detail' && <ProductDetail />}

        {viewMode === 'orders' && <OrderHistory />}

        {viewMode === 'dashboard' && <DashboardLayout />}

        {viewMode === 'schema-docs' && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setViewMode('store')}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
              >
                ← Return to Storefront
              </button>
            </div>
            <SchemaDocsModal />
          </div>
        )}
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Interactive Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Login & Customer Registration Modal */}
      <AuthModal />

      {/* Customer Account Settings Modal */}
      <CustomerSettingsModal />

      {/* Customer Support & WhatsApp Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Toast Notification Stack */}
      <ToastContainer />

      {/* Floating WhatsApp Quick Order Button */}
      <a
        id="btn-floating-whatsapp"
        href="https://wa.me/8801570243005?text=Hello%20XEEROO%2C%20I%20want%20to%20place%20an%20order"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-full shadow-lg shadow-[#25D366]/30 hover:shadow-xl transition-all cursor-pointer group hover:scale-105"
        title="Direct WhatsApp Order"
      >
        <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
        <span className="hidden sm:inline">Order on WhatsApp</span>
      </a>

      {/* XEEROO Official Global Footer */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-16 pt-12 pb-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 pb-8 border-b border-slate-800">
            {/* Col 1: Brand */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <BrandLogo size="sm" />
                <span className="text-xl font-black text-white tracking-wider">XEEROO</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Official destination for high-performance audio, premium wearables, and precision tech hardware. Verified genuine products with rapid delivery.
              </p>
            </div>

            {/* Col 2: Official Direct Contacts */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                Official Contact
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <span className="text-slate-400 block text-[11px]">Direct WhatsApp Order Desk:</span>
                  <a
                    href="https://wa.me/8801570243005"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 transition-colors font-mono font-semibold flex items-center gap-1.5 mt-0.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>+880 1570-243005</span>
                  </a>
                </li>
                <li>
                  <span className="text-slate-400 block text-[11px]">Direct Support Line:</span>
                  <a
                    href={`tel:${XEEROO_CONTACT.phone}`}
                    className="text-white hover:text-blue-400 transition-colors font-mono font-semibold flex items-center gap-1.5 mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{XEEROO_CONTACT.phone}</span>
                  </a>
                </li>
                <li>
                  <span className="text-slate-400 block text-[11px]">Direct Support Email:</span>
                  <a
                    href={`mailto:${XEEROO_CONTACT.email}`}
                    className="text-white hover:text-blue-400 transition-colors font-mono flex items-center gap-1.5 mt-0.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{XEEROO_CONTACT.email}</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Official Social Channels */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                Follow XEEROO
              </h4>
              <div className="flex flex-col gap-2">
                <a
                  href={XEEROO_CONTACT.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 transition-colors group cursor-pointer"
                >
                  <img src="/facebook.png" alt="Facebook" className="w-5 h-5 object-contain shrink-0" />
                  <span className="text-xs font-semibold">Facebook</span>
                </a>
                <a
                  href={XEEROO_CONTACT.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 transition-colors group cursor-pointer"
                >
                  <img src="/instagram.png" alt="Instagram" className="w-5 h-5 object-contain shrink-0" />
                  <span className="text-xs font-semibold">Instagram</span>
                </a>
                <a
                  href={XEEROO_CONTACT.messenger || 'https://m.me/xeeroo.0'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 transition-colors group cursor-pointer"
                >
                  <img src="/messenger.png" alt="Messenger" className="w-5 h-5 object-contain shrink-0" />
                  <span className="text-xs font-semibold">Messenger</span>
                </a>
                <a
                  href={XEEROO_CONTACT.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 transition-colors group cursor-pointer"
                >
                  <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain shrink-0" />
                  <span className="text-xs font-semibold">WhatsApp Order</span>
                </a>
              </div>
            </div>

            {/* Col 4: Quick Store Links */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                Store Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setViewMode('store')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    XEEROO Catalog
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setViewMode('orders')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Order History & Invoices
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsContactOpen(true)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Customer Support
                  </button>
                </li>
                {canAccessDashboard && (
                  <>
                    <li className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setViewMode('dashboard')}
                        className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer font-semibold"
                      >
                        Admin Dashboard
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setViewMode('schema-docs')}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Architecture & DDL Schema
                      </button>
                    </li>
                  </>
                )}
                {currentUser?.role === 'admin' && (
                  <li className="pt-1">
                    <button
                      onClick={resetDemoData}
                      className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Store Data</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} XEEROO. All rights reserved. Official Store.</p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Authentic Electronics & Tech Hardware</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
