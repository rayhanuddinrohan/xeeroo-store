/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import { XEEROO_CONTACT } from '../../data/mockData';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import {
  ArrowLeft,
  ShoppingBag,
  Star,
  CheckCircle,
  Truck,
  Shield,
  Layers,
  Edit,
  AlertTriangle,
  Package,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  FileText,
  ShieldCheck,
  Zap,
  RotateCcw,
  Clock,
  Award,
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    setViewMode,
    categories,
    addToCart,
    openCheckoutModal,
    currentUser,
    setDashboardTab,
  } = useStore();

  const product = products.find(p => p.id === selectedProductId) || products[0];
  const category = categories.find(c => c.id === product?.categoryId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'warranty'>('overview');

  // Always scroll to top when opening or switching product detail
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [product?.id]);

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Product not found.</p>
        <button
          onClick={() => setViewMode('store')}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg cursor-pointer"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const isStaff = currentUser?.role === 'moderator' || currentUser?.role === 'admin';

  // Related products from the same category (excluding current product)
  const relatedProducts = products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.isPublished)
    .slice(0, 4);

  const handleQuantityChange = (delta: number) => {
    setSelectedQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > product.stockQuantity) return product.stockQuantity;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, selectedQuantity);
    }
  };

  const handleBuyNow = () => {
    if (!isOutOfStock) {
      addToCart(product, selectedQuantity);
      openCheckoutModal();
    }
  };

  const handleEditInDashboard = () => {
    setSelectedProductId(product.id);
    setDashboardTab('products');
    setViewMode('dashboard');
  };

  const currentImage =
    (product.images && product.images[activeImageIndex]) ||
    (product.images && product.images[0]) ||
    '';

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?product=${product.id}`
      : `https://xeeroo.com/?product=${product.id}`;

  const whatsappOrderUrl = `https://wa.me/8801570243005?text=${encodeURIComponent(
    `Hello! I would like to order this product:
📦 Product: ${product.title}
💰 Price: ${formatBDT(product.price * selectedQuantity)}
🔢 Quantity: ${selectedQuantity}
🏷️ SKU: ${product.sku}
🔗 Link: ${productUrl}

My Delivery Address:`
  )}`;

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          id="btn-back-to-store"
          onClick={() => setViewMode('store')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </button>

        {isStaff && (
          <button
            onClick={handleEditInDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <Edit className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manage Product (Staff Edit)</span>
          </button>
        )}
      </div>

      {/* Main Product Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Left Column: Image Gallery & Full View Trigger */}
          <div>
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mb-4 group flex items-center justify-center">
              {currentImage ? (
                <>
                  <img
                    src={currentImage}
                    alt={product.title}
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
                    onClick={() => setIsLightboxOpen(true)}
                  />

                  {/* Full view button overlay */}
                  <button
                    id="btn-open-full-view"
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/75 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs transition-all shadow-md cursor-pointer"
                    title="Open full view image"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Full View</span>
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8">
                  <Package className="w-16 h-16 text-gray-300 mb-2" />
                  <span className="text-sm font-medium text-gray-400">No Image Available</span>
                </div>
              )}

              {!product.isPublished && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-500 text-white shadow-md uppercase tracking-wider">
                    Unpublished Draft
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-blue-600 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Category, Brand, & SKU */}
              <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 mb-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600 uppercase tracking-wide">
                    {category?.name || 'General Hardware'}
                  </span>
                  <span>•</span>
                  <span className="text-gray-600 font-medium">{product.brand}</span>
                </div>
                <span className="font-mono text-gray-400">SKU: {product.sku}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug mb-3">
                {product.title}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-800">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">
                  ({product.reviewsCount} customer reviews)
                </span>
              </div>

              {/* Price & Stock status */}
              <div className="flex items-baseline gap-4 mb-6 pb-6 border-b border-gray-100">
                <span className="text-3xl font-extrabold text-gray-900 font-mono">
                  {formatBDT(product.price)}
                </span>

                <div>
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      Currently Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      Low Inventory: Only {product.stockQuantity} remaining
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      In Stock ({product.stockQuantity} units available)
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Product Overview
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Features list */}
              {product.features && product.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                    Key Specifications
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Purchase & Quantity Actions (Online Order & WhatsApp) */}
            <div className="pt-6 border-t border-gray-100 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Quantity Counter */}
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0 self-start sm:self-auto bg-gray-50">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={isOutOfStock || selectedQuantity <= 1}
                    className="px-3.5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-3 text-sm font-semibold text-gray-900 min-w-10 text-center font-mono">
                    {selectedQuantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={isOutOfStock || selectedQuantity >= product.stockQuantity}
                    className="px-3.5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Primary Buy Now / Online Order Button */}
                {isOutOfStock ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none shadow-none pointer-events-none"
                    title="Out of stock - ordering unavailable"
                  >
                    <Package className="w-5 h-5 text-gray-400 shrink-0 opacity-50" />
                    <span>Out of Stock</span>
                  </button>
                ) : (
                  <button
                    id="btn-buy-now-product"
                    type="button"
                    onClick={handleBuyNow}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-98"
                  >
                    <CheckCircle className="w-5 h-5 text-white shrink-0" />
                    <span>Order Online Now ({formatBDT(product.price * selectedQuantity)})</span>
                  </button>
                )}
              </div>

              {/* Secondary Actions: Add to Cart & WhatsApp */}
              {!isOutOfStock && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    id="btn-add-to-cart-detail"
                    type="button"
                    onClick={handleAddToCart}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-gray-600 shrink-0" />
                    <span>Add to Cart</span>
                  </button>

                  <a
                    id="btn-whatsapp-order-product"
                    href={whatsappOrderUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      addToCart(product, selectedQuantity);
                    }}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs border border-[#25D366]/30 transition-all cursor-pointer"
                    title="Order via WhatsApp (also saves to your cart)"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                    <span>Order via WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Assurances */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Prompt Bangladesh nationwide courier delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Authentic Hardware & Direct Customer Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Professional Detailed Product Tabs: Overview, Specs & Warranty */}
        {/* ============================================================== */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          {/* Tabs Navigation Header */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-gray-200 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Overview & Description</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'specs'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Technical Specifications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('warranty')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'warranty'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Warranty & Shipping Policy</span>
            </button>
          </div>

          {/* Tab 1: Overview Content */}
          {activeTab === 'overview' && (
            <div className="pt-6 space-y-8 animate-in fade-in duration-200">
              {/* Detailed Description */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Product Detailed Description</span>
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-normal whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Hardware Value Proposition Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-1.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Precision Engineering</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Designed for peak acoustic responsiveness and high ergonomic endurance.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-1.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">100% Genuine Guaranteed</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Every piece is authentic, direct sourced, and verified prior to packaging.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-1.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Fast Express Dispatch</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Same-day handover to courier with rapid tracking updates.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-1.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">7-Day Replacement</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Hassle-free replacement policy for manufacturing issues.
                  </p>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Key Highlighted Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.features.map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-200/60"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-medium text-gray-800">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Technical Specifications Content */}
          {activeTab === 'specs' && (
            <div className="pt-6 animate-in fade-in duration-200">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <td className="py-3 px-4 font-bold text-gray-600 w-1/3 sm:w-1/4">Brand</td>
                      <td className="py-3 px-4 font-semibold text-gray-950">{product.brand}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-bold text-gray-600">Model / SKU</td>
                      <td className="py-3 px-4 font-mono font-medium text-gray-800">{product.sku}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <td className="py-3 px-4 font-bold text-gray-600">Category</td>
                      <td className="py-3 px-4 font-semibold text-blue-600">{category?.name || 'Tech Hardware'}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-bold text-gray-600">Inventory Status</td>
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="font-bold text-rose-600">Out of Stock</span>
                        ) : (
                          <span className="font-bold text-emerald-600">
                            In Stock ({product.stockQuantity} units available)
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <td className="py-3 px-4 font-bold text-gray-600">Customer Rating</td>
                      <td className="py-3 px-4 text-amber-600 font-bold">
                        ★ {product.rating.toFixed(1)} / 5.0 ({product.reviewsCount} verified reviews)
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-bold text-gray-600">Price</td>
                      <td className="py-3 px-4 font-black font-mono text-emerald-600 text-sm">
                        {formatBDT(product.price)}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <td className="py-3 px-4 font-bold text-gray-600">Packaging & Box</td>
                      <td className="py-3 px-4 text-gray-700">100% Brand Sealed Retail Pack with authentic QR seal</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-gray-600">Support & Warranty</td>
                      <td className="py-3 px-4 text-gray-700">
                        Official Brand Warranty + 7-Day Direct Replacement Guarantee
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Delivery & Warranty Content */}
          {activeTab === 'warranty' && (
            <div className="pt-6 space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Information Box */}
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Delivery Timeline & Fee</h4>
                      <p className="text-xs text-gray-500">Rapid nationwide doorstep delivery</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Nationwide Delivery Fee:</strong> Flat ৳150 across all districts of Bangladesh.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Inside Dhaka:</strong> 24 to 48 hours delivery with Cash on Delivery available.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Outside Dhaka:</strong> 2 to 3 days home delivery via leading couriers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Option to inspect package before signing with courier.</span>
                    </li>
                  </ul>
                </div>

                {/* Warranty & Return Information Box */}
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Warranty & Return Policy</h4>
                      <p className="text-xs text-gray-500">Official authentic guarantee</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>7-Day Replacement:</strong> Free instant replacement for manufacturing defects.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>100% Genuine Products:</strong> No clones or copies; verified original hardware only.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>Direct dedicated support via our WhatsApp and helpline desk.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Category Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-950 tracking-tight">
                More from {category?.name || 'this category'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Explore matching gear and hardware accessories
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(relProduct => (
              <div
                key={relProduct.id}
                onClick={() => {
                  setSelectedProductId(relProduct.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-4/3 overflow-hidden bg-gray-100 relative flex items-center justify-center">
                    {relProduct.images && relProduct.images[0] ? (
                      <img
                        src={relProduct.images[0]}
                        alt={relProduct.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2">
                        <Package className="w-8 h-8 text-gray-300 mb-1" />
                        <span className="text-[10px] font-medium text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {relProduct.brand}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {relProduct.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {relProduct.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-gray-50 mt-3 flex items-center justify-between">
                  <span className="text-sm font-black text-gray-950 font-mono">
                    {formatBDT(relProduct.price)}
                  </span>
                  <span className="text-xs font-bold text-blue-600 group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          {/* Top Bar with counter & close button */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3 mb-2">
            <div className="text-xs font-semibold text-gray-300 flex items-center gap-2">
              <span>{product.title}</span>
              <span>•</span>
              <span>
                {activeImageIndex + 1} / {product.images.length || 1}
              </span>
            </div>
            <button
              id="btn-close-lightbox"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close full view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Full-Size Image Frame */}
          <div className="relative w-full max-w-5xl h-[70vh] max-h-[750px] flex items-center justify-center">
            {/* Prev Image Button */}
            {product.images.length > 1 && (
              <button
                onClick={() =>
                  setActiveImageIndex(prev =>
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 sm:left-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={currentImage}
              alt={product.title}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            />

            {/* Next Image Button */}
            {product.images.length > 1 && (
              <button
                onClick={() =>
                  setActiveImageIndex(prev =>
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 sm:right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnails in Lightbox */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-2 mt-4 max-w-5xl overflow-x-auto p-1">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-white ring-2 ring-white/50'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
