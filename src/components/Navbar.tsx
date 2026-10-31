/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { XEEROO_CONTACT } from '../data/mockData';
import { BrandLogo } from './common/BrandLogo';
import { UserAvatar } from './common/UserAvatar';
import { ContactModal } from './ContactModal';
import { NotificationBell } from './NotificationBell';
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
  Menu,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Check,
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
    selectedCategory,
    setSelectedCategory,
    categories,
    sortBy,
    setSortBy,
    inStockOnly,
    setInStockOnly,
    canAccessDashboard,
    resetDemoData,
    openSettingsModal,
    products,
    setSelectedProductId,
    setDashboardTab,
    navigateToStore,
    navigateToProduct,
    navigateToContact,
    navigateToOrders,
    navigateToDashboard,
  } = useStore();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleCloseDrawer = () => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setIsMobileDrawerOpen(false);
      setIsDrawerClosing(false);
    }, 240);
  };

  // Real-time search dropdown state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  // Filter products for real-time instant dropdown popup
  const matchingProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    return products.filter(p => {
      if (!isStaff && !p.isPublished) return false;
      return (
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.sku ? p.sku.toLowerCase().includes(q) : false) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, isStaff]);

  // Compute stock counts for mobile categories
  const categoriesWithStock = useMemo(() => {
    return categories
      .map(cat => {
        const inStockCount = products.filter(
          p => p.categoryId === cat.id && (isStaff || p.isPublished) && p.stockQuantity > 0
        ).length;
        return {
          ...cat,
          inStockCount,
        };
      })
      .filter(cat => cat.inStockCount > 0);
  }, [categories, products, isStaff]);

  const totalInStockCount = useMemo(() => {
    return products.filter(p => (isStaff || p.isPublished) && p.stockQuantity > 0).length;
  }, [products, isStaff]);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    inStockOnly ||
    sortBy !== 'featured';

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setInStockOnly(false);
    setSortBy('featured');
    setSearchQuery('');
  };

  const handleSelectSearchProduct = (productId: string) => {
    navigateToProduct(productId);
    setIsSearchFocused(false);
  };

  const handleViewAllSearchResults = () => {
    navigateToStore();
    setIsSearchFocused(false);
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
      navigateToStore();
    }
  };

  const handleDashboardClick = () => {
    if (currentUser?.role === 'moderator') {
      setDashboardTab('orders');
      navigateToDashboard('orders');
    } else {
      navigateToDashboard();
    }
  };

  return (
    <>
      <header
        id="main-store-header"
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs"
      >
        {/* =========================================================================
            DESKTOP VIEW (hidden on mobile, visible on md: screens and above)
           ========================================================================= */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Brand - Strictly XEEROO only */}
            <div className="flex items-center gap-4 shrink-0">
              <a
                id="nav-brand-logo"
                href="/#/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToStore();
                }}
                className="flex items-center gap-2.5 text-gray-900 group cursor-pointer"
              >
                <BrandLogo size="md" />
                <div className="text-left">
                  <span className="text-2xl font-black tracking-widest text-gray-950 block leading-none">
                    XEEROO
                  </span>
                </div>
              </a>

              {/* Desktop Nav links */}
              <nav className="flex items-center space-x-1 text-sm font-medium ml-2">
                <a
                  id="nav-link-store"
                  href="/#/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToStore();
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'store'
                      ? 'text-blue-600 bg-blue-50 font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Store
                </a>

                {canAccessDashboard && (
                  <a
                    id="nav-link-dashboard"
                    href="/#/dashboard"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDashboardClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      viewMode === 'dashboard'
                        ? currentUser?.role === 'moderator'
                          ? 'text-amber-800 bg-amber-50 font-semibold'
                          : 'text-purple-700 bg-purple-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutDashboard className={`w-4 h-4 ${currentUser?.role === 'moderator' ? 'text-amber-600' : 'text-purple-600'}`} />
                    <span>{currentUser?.role === 'moderator' ? 'Staff Operations (Orders)' : 'Admin Dashboard'}</span>
                  </a>
                )}

                <a
                  id="nav-link-contact"
                  href="/#/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToContact();
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'contact'
                      ? 'text-blue-600 bg-blue-50 font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Contact
                </a>
              </nav>
            </div>

            {/* Desktop Search bar with Real-time Dropdown Popup (Hidden on admin dashboard) */}
            {viewMode !== 'dashboard' && (
              <div ref={searchContainerRef} className="flex-1 max-w-md relative">
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
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
                              <p className="text-[11px] text-emerald-700 font-medium">
                                {product.soldCount || 0} pcs sold • {product.stockQuantity} pcs in stock
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
          )}

            {/* Right actions: Dashboard, Cart, Notifications, Auth/Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
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
                  <span>
                    {currentUser?.role === 'moderator' ? 'Staff Operations' : 'Admin Dashboard'}
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
                <span>Cart</span>
              </button>

              {/* Real-time Notification Bell */}
              <NotificationBell />

              {/* Unified Login Button / Profile */}
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
                    className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors bg-white cursor-pointer"
                    title={`${currentUser?.fullName} (${currentUser?.role})`}
                  >
                    <UserAvatar
                      user={currentUser}
                      gender={currentUser?.gender}
                      role={currentUser?.role}
                      size="xs"
                      showSignBadge={true}
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
                        {/* User Info Header with UserAvatar */}
                        <div className="px-4 pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              user={currentUser}
                              gender={currentUser?.gender}
                              role={currentUser?.role}
                              size="md"
                              showSignBadge={true}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-900 truncate">
                                  {currentUser?.fullName}
                                </h4>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    currentUser?.role === 'admin'
                                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                      : currentUser?.role === 'moderator'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {currentUser?.role === 'admin'
                                    ? 'Admin'
                                    : currentUser?.role === 'moderator'
                                    ? 'Staff'
                                    : 'Customer'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {currentUser?.email || currentUser?.phone}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Options */}
                        <div className="py-2 px-2 space-y-1">
                          {canAccessDashboard && (
                            <button
                              onClick={() => {
                                handleDashboardClick();
                                setUserDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer font-semibold"
                            >
                              <Shield className="w-4 h-4 text-purple-600" />
                              <span>
                                {currentUser?.role === 'moderator'
                                  ? 'Staff Orders & Operations'
                                  : 'Admin Control Center'}
                              </span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              navigateToOrders();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-medium"
                          >
                            <Package className="w-4 h-4 text-blue-600" />
                            <span>My Orders & Invoices</span>
                          </button>

                          <button
                            onClick={() => {
                              openSettingsModal();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-medium"
                          >
                            <Settings className="w-4 h-4 text-gray-600" />
                            <span>Account Settings & Address</span>
                          </button>

                          <a
                            href="/#/contact"
                            onClick={(e) => {
                              e.preventDefault();
                              navigateToContact();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-medium"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                            <span>Contact Support & Desk</span>
                          </a>
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

        {/* =========================================================================
            MOBILE VIEW (only mobile view er jonno: md:hidden)
            1. Top row:
               - Top-left: 3-line hamburger menu button
               - Top-middle: Centered XEEROO logo and text
               - Top-right (beside XEEROO): Notification bell + Cart button
            2. Second row:
               - Full-width long search bar with real-time dropdown results
           ========================================================================= */}
        <div className="md:hidden">
          {/* Collapsible Top Bar and Search Row (Auto-hides on scroll down, reveals on scroll up) */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              !showHeader && viewMode === 'store'
                ? 'max-h-0 opacity-0 pointer-events-none'
                : 'max-h-64 opacity-100'
            }`}
          >
            {/* Top Bar Row */}
            <div className="flex items-center justify-between h-14 px-3 gap-2 border-b border-gray-100">
              {/* Top Left: 3-Line Hamburger Menu Button */}
              <button
                type="button"
                id="mobile-drawer-btn"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="relative p-2 text-gray-800 hover:text-gray-950 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer shrink-0"
                aria-label="Open Menu & Filters"
              >
                <Menu className="w-6 h-6 text-gray-900" />
                {hasActiveFilters && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>

              {/* Top Middle: Centered Logo and XEEROO */}
              <div className="flex-1 flex items-center justify-center">
                <a
                  href="/#/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToStore();
                  }}
                  className="flex items-center gap-2 text-gray-950 group cursor-pointer"
                >
                  <BrandLogo size="sm" />
                  <span className="text-xl font-black tracking-widest text-gray-950 leading-none">
                    XEEROO
                  </span>
                </a>
              </div>

              {/* Top Right: Notification Bell & Shopping Cart Button (Beside XEEROO) */}
              <div className="flex items-center gap-1 shrink-0">
                <NotificationBell />

                <button
                  type="button"
                  id="mobile-cart-btn"
                  onClick={onOpenCart}
                  className="relative p-2 text-gray-800 hover:text-gray-950 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  aria-label={`Shopping Cart (${cartTotalCount} items)`}
                >
                  <ShoppingBag className="w-5 h-5 text-gray-800" />
                  {cartTotalCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
                      {cartTotalCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Long Search Bar Row (Hidden on admin dashboard) */}
            {viewMode !== 'dashboard' && (
              <div ref={mobileSearchRef} className="px-3 py-2 bg-white relative">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    id="mobile-long-search-input"
                    type="text"
                    placeholder="Search XEEROO gear, acoustics, wearables..."
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* Real-Time Dropdown Popup on Mobile Search */}
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute left-3 right-3 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    <div className="p-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span>Found {matchingProducts.length} results</span>
                      <span className="text-[10px] text-gray-400 font-normal">Real-time Search</span>
                    </div>

                    <div className="divide-y divide-gray-100">
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

                    {matchingProducts.length > 0 && (
                      <div className="p-2 bg-gray-50 text-center">
                        <button
                          type="button"
                          onClick={handleViewAllSearchResults}
                          className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          View all ({matchingProducts.length}) →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 3: Horizontal Scrollable Category Pills Bar (STAYS STICKY AT VERY TOP ON SCROLL DOWN, NEVER HIDES!) */}
          {viewMode === 'store' && (
            <div className="px-3 pb-2 pt-1 border-t border-gray-100 bg-white/95 backdrop-blur-md flex items-center gap-1.5 shadow-2xs">
              {!showHeader && (
                <button
                  type="button"
                  id="mobile-drawer-mini-btn"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors cursor-pointer shrink-0 animate-in fade-in"
                  title="Open Menu & Filters"
                  aria-label="Open Menu & Filters"
                >
                  <Menu className="w-4 h-4 text-gray-900" />
                </button>
              )}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 touch-pan-x">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    if (viewMode !== 'store') navigateToStore();
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <span>All Products</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedCategory === 'all'
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {totalInStockCount}
                  </span>
                </button>

                {categoriesWithStock.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      if (viewMode !== 'store') navigateToStore();
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedCategory === cat.id
                          ? 'bg-blue-700 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {cat.inStockCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          MOBILE 3-LINE DRAWER (Top-Left 3 Line Menu)
          Contains:
          1. Account Info / Logo / Status / Admin & Staff Operations
          2. Store Navigation & Contact
          3. Price Sorting & Filter Controls (price sort etcc sob 3 line er vitorei)
         ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop with smooth fade-in and fade-out */}
          <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-xs ${
              isDrawerClosing ? 'animate-fade-out-overlay' : 'animate-fade-in-overlay'
            }`}
            onClick={handleCloseDrawer}
          />

          {/* Drawer Panel - Positioned on the LEFT with smooth opening and closing animations */}
          <div
            className={`fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col z-50 ${
              isDrawerClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'
            }`}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-950 text-white">
              <div className="flex items-center gap-2.5">
                <BrandLogo size="sm" />
                <span className="text-xl font-black tracking-widest text-white">XEEROO</span>
              </div>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-4 space-y-4">
              {/* SECTION 1: User Account & Admin (Account, Logo, Admin etc) */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Account & Operations
                </div>

                {isLoggedIn && currentUser ? (
                  <div className="space-y-3">
                    {/* User Card */}
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-3">
                      <UserAvatar
                        user={currentUser}
                        gender={currentUser.gender}
                        role={currentUser.role}
                        size="md"
                        showSignBadge={true}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {currentUser.fullName}
                          </h4>
                        </div>
                        <span
                          className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            currentUser.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : currentUser.role === 'moderator'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {currentUser.role === 'admin'
                            ? 'Admin'
                            : currentUser.role === 'moderator'
                            ? 'Staff Operations'
                            : 'Verified Customer'}
                        </span>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {currentUser.email || currentUser.phone}
                        </p>
                      </div>
                    </div>

                    {/* Dashboard Button (Contains Orders, Account Settings & Controls inside) */}
                    {currentUser.role === 'customer' ? (
                      <button
                        type="button"
                        onClick={() => {
                          navigateToDashboard('my-orders');
                          handleCloseDrawer();
                        }}
                        className="w-full flex items-center justify-between p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span>My Account Dashboard</span>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-600">Orders & Settings →</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleDashboardClick();
                          handleCloseDrawer();
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentUser.role === 'moderator'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                            : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${currentUser.role === 'moderator' ? 'text-amber-600' : 'text-purple-600'}`} />
                          <span>
                            {currentUser.role === 'moderator'
                              ? 'Staff Orders & Operations'
                              : 'Admin Control Center'}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400">Open →</span>
                      </button>
                    )}

                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          resetDemoData();
                          handleCloseDrawer();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 p-1.5 text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Store Data</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-2">
                    <p className="text-xs text-gray-600 font-medium">
                      Sign in to view orders, address & profile
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          openLoginModal();
                          handleCloseDrawer();
                        }}
                        className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Log In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openRegisterModal();
                          handleCloseDrawer();
                        }}
                        className="py-2 px-3 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Register
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Navigation Links */}
              <div className="pt-3 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Navigation
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigateToStore();
                    handleCloseDrawer();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === 'store'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>XEEROO Store Catalog</span>
                  {viewMode === 'store' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigateToContact();
                    handleCloseDrawer();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === 'contact'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Contact Support & Desk</span>
                  </div>
                  {viewMode === 'contact' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                {/* Slim Contact on WhatsApp button */}
                <a
                  href="https://wa.me/8801570243005?text=Hello%20XEEROO%2C%20I%20want%20to%20contact%20support"
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleCloseDrawer}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs mt-1"
                >
                  <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain" />
                  <span>Contact on WhatsApp</span>
                </a>
              </div>

              {/* SECTION 3: Price Sort & Filters (price sort etcc sob 3 line er vitorei) */}
              <div className="pt-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-900">
                      Price Sort & Filters
                    </span>
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Sort By Options */}
                <div className="mb-4">
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                    <span>Sort Products</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'featured', label: 'Featured' },
                      { id: 'price-asc', label: 'Price: Low → High' },
                      { id: 'price-desc', label: 'Price: High → Low' },
                      { id: 'rating', label: 'Highest Rated' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSortBy(opt.id as any)}
                        className={`px-2.5 py-2 text-xs font-medium rounded-xl text-left transition-colors border cursor-pointer ${
                          sortBy === opt.id
                            ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* In Stock Only Toggle Switch */}
                <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">In-Stock Only</span>
                    <span className="text-[10px] text-gray-500">Hide sold out gear</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      inStockOnly ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        inStockOnly ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Categories Filter */}
                <div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1.5">
                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                    <span>Categories</span>
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                        selectedCategory === 'all'
                          ? 'bg-blue-600 border-blue-600 text-white font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium'
                      }`}
                    >
                      <span>All Products</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        selectedCategory === 'all' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {totalInStockCount}
                      </span>
                    </button>

                    {categoriesWithStock.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                          selectedCategory === cat.id
                            ? 'bg-blue-600 border-blue-600 text-white font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          selectedCategory === cat.id ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {cat.inStockCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer with "View Products" & Logout at bottom */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleCloseDrawer();
                  if (viewMode !== 'store') {
                    navigateToStore();
                  }
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors text-center cursor-pointer"
              >
                View Products {hasActiveFilters ? '(Filtered)' : ''}
              </button>

              {isLoggedIn && (
                <button
                  type="button"
                  id="mobile-drawer-logout-btn"
                  onClick={() => {
                    handleCloseDrawer();
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Log Out from Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </>
  );
};
