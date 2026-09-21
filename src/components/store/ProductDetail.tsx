/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import { XEEROO_CONTACT } from '../../data/mockData';
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
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    setViewMode,
    categories,
    addToCart,
    currentUser,
    setDashboardTab,
  } = useStore();

  const product = products.find(p => p.id === selectedProductId) || products[0];
  const category = categories.find(c => c.id === product?.categoryId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  const handleEditInDashboard = () => {
    setSelectedProductId(product.id);
    setDashboardTab('products');
    setViewMode('dashboard');
  };

  const currentImage =
    product.images[activeImageIndex] ||
    product.images[0] ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?product=${product.id}`
      : `https://xeeroo.com/?product=${product.id}`;

  const whatsappOrderUrl = `https://wa.me/8801570243005?text=${encodeURIComponent(
    `Hello XEEROO! I would like to place an order:
*Product:* ${product.title}
*Price:* ${formatBDT(product.price * selectedQuantity)}
*Quantity:* ${selectedQuantity}
*SKU:* ${product.sku}
*Product Link:* ${productUrl}

Please confirm stock availability and proceed with my delivery.`
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
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mb-4 group">
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

            {/* Purchase & Quantity Actions */}
            <div className="pt-6 border-t border-gray-100 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Quantity Counter */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0 self-start sm:self-auto bg-gray-50">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={isOutOfStock || selectedQuantity <= 1}
                    className="px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold text-gray-900 min-w-10 text-center">
                    {selectedQuantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={isOutOfStock || selectedQuantity >= product.stockQuantity}
                    className="px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  id="detail-add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-xs cursor-pointer ${
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isOutOfStock ? 'Sold Out' : `Add to Cart - ${formatBDT(product.price * selectedQuantity)}`}
                  </span>
                </button>
              </div>

              {/* Direct WhatsApp Ordering Button */}
              <a
                id="btn-whatsapp-order-product"
                href={whatsappOrderUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Direct Order via WhatsApp (+880 1570-243005)</span>
              </a>

              {/* Assurances */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Prompt Bangladesh nationwide courier delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Authentic Hardware & Direct Customer Support</span>
                </div>
              </div>
            </div>
          </div>
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
                  <div className="aspect-4/3 overflow-hidden bg-gray-100 relative">
                    <img
                      src={
                        relProduct.images[0] ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={relProduct.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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
