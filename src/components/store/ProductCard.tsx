/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { ShoppingBag, Star, Eye, AlertCircle, Edit, Check, Package, Image as ImageIcon, Flame } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    setSelectedProductId,
    setViewMode,
    addToCart,
    openCheckoutModal,
    openLoginModal,
    addToast,
    currentUser,
    setDashboardTab,
  } = useStore();

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const isStaff = currentUser?.role === 'moderator' || currentUser?.role === 'admin';

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?product=${product.id}`
      : `https://xeeroo.com/?product=${product.id}`;

  const whatsappUrl = `https://wa.me/8801570243005?text=${encodeURIComponent(
    `Hello! I would like to order this product:
📦 Product: ${product.title}
💰 Price: ${formatBDT(product.price)}
🔗 Link: ${productUrl}

My Delivery Address:`
  )}`;

  const handleCardClick = () => {
    setSelectedProductId(product.id);
    setViewMode('product-detail');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      addToast('Please sign in or create an account to add items to your cart.', 'warning');
      openLoginModal();
      return;
    }
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      addToast('Please sign in or create an account to proceed to checkout.', 'warning');
      openLoginModal();
      return;
    }
    if (!isOutOfStock) {
      addToCart(product, 1);
      openCheckoutModal();
    }
  };

  const handleQuickEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProductId(product.id);
    setDashboardTab('products');
    setViewMode('dashboard');
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className={`group relative bg-white rounded-xl border transition-all duration-200 flex flex-col h-full overflow-hidden cursor-pointer ${
        !product.isPublished
          ? 'border-amber-300 ring-2 ring-amber-100'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden flex items-center justify-center">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4">
            <Package className="w-10 h-10 text-gray-300 mb-1" />
            <span className="text-[11px] font-medium text-gray-400">No Image</span>
          </div>
        )}

        {/* Staff Draft Badge if unpublished */}
        {!product.isPublished && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-amber-500 text-white shadow-xs uppercase tracking-wide">
              Draft (Staff View)
            </span>
          </div>
        )}

        {/* Staff Quick Edit Overlay Button */}
        {isStaff && (
          <button
            onClick={handleQuickEdit}
            className="absolute bottom-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-white/90 text-gray-800 hover:bg-white shadow-md transition-all text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100"
            title="Edit in Staff Dashboard"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 gap-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 sm:px-2.5 py-0.5 rounded-full shadow-2xs">
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
              <span>{product.soldCount || 0} sold</span>
            </span>
            {product.reviewsCount > 0 ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProductId(product.id);
                  setViewMode('product-detail');
                }}
                className="flex items-center gap-1 text-amber-500 cursor-pointer hover:opacity-80 transition-opacity"
                title="View customer reviews"
              >
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span className="font-bold text-gray-800 text-[11px] sm:text-xs">{product.rating.toFixed(1)}</span>
                <span className="text-gray-400 text-[10px] sm:text-[11px]">({product.reviewsCount})</span>
              </div>
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProductId(product.id);
                  setViewMode('product-detail');
                }}
                className="text-[10px] sm:text-[11px] text-gray-400 italic cursor-pointer hover:text-blue-600 transition-colors"
                title="Rate this product"
              >
                No ratings
              </span>
            )}
          </div>

          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
            {product.title}
          </h3>

          {/* Stock Quantity in Pieces - Keep only under title */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs mb-2.5 sm:mb-3 py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
              <span>Stock:</span>
            </span>
            <span
              className={`font-mono font-bold ${
                isOutOfStock
                  ? 'text-rose-600'
                  : isLowStock
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {product.stockQuantity > 0 ? `${product.stockQuantity} pcs` : 'Out of stock'}
            </span>
          </div>
        </div>

        <div className="pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between gap-1 sm:gap-2 mt-auto">
          <div>
            <span className="text-[10px] sm:text-xs text-gray-400 block font-medium">Price</span>
            <span className="text-sm sm:text-lg font-bold text-gray-900 font-mono">
              {formatBDT(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gray-100 text-gray-400 font-semibold text-[11px] sm:text-xs border border-gray-200">
                Sold Out
              </span>
            ) : (
              <>
                <button
                  id={`quick-order-btn-${product.id}`}
                  type="button"
                  onClick={handleQuickBuy}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs shadow-xs transition-all cursor-pointer hover:scale-102 active:scale-98"
                  title="Direct Online Order"
                >
                  <span>Order</span>
                </button>

                <button
                  id={`add-to-cart-btn-${product.id}`}
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center p-1 sm:px-2 sm:py-1.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium text-xs transition-colors cursor-pointer"
                  title="Add to Shopping Cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-gray-600" />
                </button>

                <a
                  id={`whatsapp-order-btn-${product.id}`}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => {
                    e.stopPropagation();
                    addToCart(product, 1);
                  }}
                  className="p-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 transition-all cursor-pointer"
                  title="Order via WhatsApp (also saves to your cart)"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
