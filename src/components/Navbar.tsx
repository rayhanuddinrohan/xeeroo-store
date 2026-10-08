/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { XEEROO_CONTACT } from '../data/mockData';
import { BrandLogo } from './common/BrandLogo';
import { ContactModal } from './ContactModal';
import { formatBDT } from '../utils/currency';
import {
  ShoppingBag,
  Search,
  Shield,
  ChevronDown,
  Database,
  X,
  FileCode,
  Phone,
  Mail,
  Share2,
  ExternalLink,
  Crown,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
  LogOut,
  LogIn,
  UserPlus,
  UserCheck,
  Clock,
  User as UserIcon,
  Layers,
  MessageCircle,
  Settings,
  Package,
} from 'lucide-react';

interface NavbarProps {
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const {
    currentUser,
    isLoggedIn,
    logout,
    openLoginModal,
    openRegisterModal,
    viewMode,
    setViewMode,
    cartTotalCount,
    searchQuery,
    setSearchQuery,
    canAccessDashboard,
    resetDemoData,
    openSettingsModal,
    products,
    setSelectedProductId,
  } = useStore();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Real-time search dropdown state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for real-time instant dropdown popup
  const matchingProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

    return products.filter(p => {
      if (!isStaff && !p.isPublished) return false;
      return (
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, currentUser]);

  const handleSelectSearchProduct = (productId: string) => {
    setSelectedProductId(productId);
    setViewMode('product-detail');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleViewAllSearchResults = () => {
    setViewMode('store');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Auto-hide header when scrolling down on mobile, show when scrolling up
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (window.innerWidth < 768) {
            if (currentScrollY > 70 && currentScrollY > lastScrollY) {
              // Scrolling down - hide header on mobile
              setShowHeader(false);
            } else if (currentScrollY < lastScrollY || currentScrollY <= 20) {
              // Scrolling up or at top - reveal header
              setShowHeader(true);
            }
          } else {
            setShowHeader(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode !== 'store') {
      setViewMode('store');
    }
  };

  const handleDashboardClick = () => {
    setViewMode('dashboard');
  };

  return (
    <header
      id="main-store-header"
      className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs transition-transform duration-300 ease-in-out ${
        showHeader ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
      }`}
    >
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand - Strictly XEEROO only */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              id="nav-brand-logo"
              onClick={() => {
                setViewMode('store');
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className="flex items-center gap-2.5 text-gray-900 group cursor-pointer"
            >
              <BrandLogo size="md" />
              <div className="text-left">
                <span className="text-2xl font-black tracking-widest text-gray-950 block leading-none">
                  XEEROO
                </span>
              </div>
            </button>

            {/* Nav links (Storefront and Order History removed for desktop per request) */}
            <nav className="hidden md:flex items-center space-x-1 text-sm font-medium ml-2">
              {canAccessDashboard && (
                <button
                  id="nav-link-dashboard"
                  onClick={() => setViewMode('dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    viewMode === 'dashboard'
                      ? currentUser?.role === 'moderator'
                        ? 'text-amber-800 bg-amber-50 font-semibold'
                        : 'text-purple-700 bg-purple-50 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 ${currentUser?.role === 'moderator' ? 'text-amber-600' : 'text-purple-600'}`} />
                  <span>{currentUser?.role === 'moderator' ? 'Staff Dashboard' : 'Admin Dashboard'}</span>
                </button>
              )}
              <button
                id="nav-link-contact"
                onClick={() => setContactModalOpen(true)}
                className="px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                Contact
              </button>
            </nav>
          </div>

          {/* Desktop Search bar with Real-time Dropdown Popup */}
          <div ref={searchContainerRef} className="flex-1 max-w-md hidden sm:block relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="nav-search-input"
                type="text"
                placeholder="Search XEEROO gear, acoustics, wearables..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                className="w-full pl-10 pr-9 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Real-Time Search Popup Dropdown List */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>Search Results ({matchingProducts.length} products found)</span>
                  <span className="text-[10px] text-gray-400 font-normal">Real-time Search</span>
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
                  {matchingProducts.length > 0 ? (
                    matchingProducts.map(product => {
                      const hasImg = product.images && product.images.length > 0 && product.images[0];
                      const isOutOfStock = product.stockQuantity <= 0;
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleSelectSearchProduct(product.id)}
                          className="p-3 hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center gap-3 group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {hasImg ? (
                              <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                {product.brand}
                              </span>
                              {isOutOfStock ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">
                                  Out of Stock
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700">
                                  In Stock ({product.stockQuantity})
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {product.title}
                            </h4>
                            <p className="text-[11px] text-gray-400 font-mono">
                              SKU: {product.sku}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black text-gray-900 font-mono block">
                              {formatBDT(product.price)}
                            </span>
                            <span className="text-[10px] font-semibold text-blue-600 group-hover:underline">
                              View →
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-500">
                      No products found matching "{searchQuery}"
                    </div>
                  )}
                </div>

                {matchingProducts.length > 0 && (
                  <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                    <button
                      type="button"
                      onClick={handleViewAllSearchResults}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      View all results ({matchingProducts.length} products) →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right actions: Mobile Search Toggle, Dashboard, Auth/Profile, Cart */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Search Button Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Search Products"
            >
              <Search className="w-5 h-5" />
            </button>
            {/* Staff / Admin Dashboard Quick Button if staff */}
            {canAccessDashboard && (
              <button
                id="nav-dashboard-btn"
                onClick={handleDashboardClick}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  viewMode === 'dashboard'
                    ? currentUser?.role === 'moderator'
                      ? 'bg-amber-800 text-white border-amber-700'
                      : 'bg-purple-900 text-white border-purple-800'
                    : currentUser?.role === 'moderator'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
                title={currentUser?.role === 'moderator' ? 'Open XEEROO Staff Dashboard' : 'Open XEEROO Admin Dashboard'}
              >
                <Shield className={`w-4 h-4 ${currentUser?.role === 'moderator' ? 'text-amber-600' : 'text-purple-600'}`} />
                <span className="hidden sm:inline">
                  {currentUser?.role === 'moderator' ? 'Staff Dashboard' : 'Admin Dashboard'}
                </span>
                <span className="sm:hidden">
                  {currentUser?.role === 'moderator' ? 'Staff' : 'Admin'}
                </span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              id="nav-cart-btn"
              type="button"
              onClick={onOpenCart}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer border border-gray-200 shadow-xs"
              title={`Shopping Cart (${cartTotalCount} items)`}
            >
              <div className="relative flex items-center">
                <ShoppingBag className="w-4 h-4 text-gray-700" />
                {cartTotalCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
                    {cartTotalCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
            </button>

            {/* Unified Login Button */}
            {!isLoggedIn ? (
              <div className="flex items-center">
                <button
                  id="nav-login-btn"
                  onClick={openLoginModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                  title="Sign In to Your Account"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
                  <span>Login</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  id="nav-user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors bg-white cursor-pointer"
                  title={`${currentUser?.fullName} (${currentUser?.role})`}
                >
                  <img
                    src={
                      currentUser?.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
                    }
                    alt={currentUser?.fullName || 'User'}
                    className={`w-7 h-7 rounded-full object-cover ring-2 ${
                      currentUser?.role === 'admin' ? 'ring-purple-500' : 'ring-blue-500'
                    }`}
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      {/* User Info Header */}
                      <div className="px-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {currentUser?.fullName}
                          </p>
                          {currentUser?.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider bg-purple-100 text-purple-700">
                              <Crown className="w-2.5 h-2.5" />
                              ADMIN
                            </span>
                          ) : currentUser?.role === 'moderator' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider bg-amber-100 text-amber-800">
                              <Shield className="w-2.5 h-2.5" />
                              STAFF / MODERATOR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider bg-blue-100 text-blue-700">
                              <UserIcon className="w-2.5 h-2.5" />
                              CUSTOMER
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{currentUser?.email}</p>
                        {currentUser?.phone && (
                          <p className="text-xs text-gray-500 truncate mt-0.5 font-mono">{currentUser.phone}</p>
                        )}

                        {/* Customer Approval Badge if customer */}
                        {currentUser?.role === 'customer' && (
                          <div className="mt-2">
                            {currentUser.approvalStatus === 'approved' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span>Account Approved (Ordering Active)</span>
                              </span>
                            ) : currentUser.approvalStatus === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <span>Account Rejected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Admin Approval</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dropdown Navigation Links */}
                      <div className="py-2 px-2 space-y-1">
                        {canAccessDashboard && (
                          <button
                            onClick={() => {
                              setViewMode('dashboard');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-medium"
                          >
                            <LayoutDashboard className={`w-4 h-4 ${currentUser?.role === 'moderator' ? 'text-amber-600' : 'text-purple-600'}`} />
                            <span>{currentUser?.role === 'moderator' ? 'Staff Dashboard' : 'Admin Dashboard'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onOpenCart();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-gray-600" />
                            <span>View Cart</span>
                          </div>
                          {cartTotalCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                              {cartTotalCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setViewMode('orders');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                          <ShoppingBag className="w-4 h-4 text-blue-600" />
                          <span>Order History & Invoices</span>
                        </button>

                        <button
                          id="nav-dropdown-settings-btn"
                          onClick={() => {
                            openSettingsModal();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                          <Settings className="w-4 h-4 text-blue-600" />
                          <span>Account Settings & Address</span>
                        </button>

                        <button
                          onClick={() => {
                            setContactModalOpen(true);
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                          <Phone className="w-4 h-4 text-emerald-600" />
                          <span>Contact Support</span>
                        </button>
                      </div>

                      {/* Logout Action Option */}
                      <div className="pt-2 border-t border-gray-100 px-2 space-y-1">
                        <button
                          id="nav-logout-btn"
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out from Account</span>
                        </button>

                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => {
                              resetDemoData();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Store Data</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar Expandable Drawer */}
      {isMobileSearchOpen && (
        <div ref={mobileSearchRef} className="sm:hidden px-4 pb-3 pt-1 border-t border-gray-100 bg-white relative animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Search products in real-time..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Real-Time Dropdown on Mobile */}
          {searchQuery.trim().length > 0 && (
            <div className="mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {matchingProducts.length > 0 ? (
                matchingProducts.map(product => {
                  const hasImg = product.images && product.images.length > 0 && product.images[0];
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectSearchProduct(product.id)}
                      className="p-2.5 hover:bg-blue-50/70 flex items-center gap-2.5 cursor-pointer"
                    >
                      {hasImg ? (
                        <img src={product.images[0]} alt={product.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                          <Package className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-blue-600 uppercase block">{product.brand}</span>
                        <h4 className="text-xs font-bold text-gray-900 truncate">{product.title}</h4>
                        <span className="text-xs font-black text-emerald-600 font-mono">{formatBDT(product.price)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-gray-400">No products found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contact Modal */}
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </header>
  );
};
