/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { ShoppingBag, Star, Eye, AlertCircle, Edit, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    setSelectedProductId,
    setViewMode,
    addToCart,
    categories,
    currentUser,
    setDashboardTab,
  } = useStore();

  const category = categories.find(c => c.id === product.categoryId);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const isStaff = currentUser?.role === 'moderator' || currentUser?.role === 'admin';

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?product=${product.id}`
      : `https://xeeroo.com/?product=${product.id}`;

  const whatsappUrl = `https://wa.me/8801570243005?text=${encodeURIComponent(
    `আসসালামু আলাইকুম! আমি এই প্রোডাক্টটি অর্ডার করতে চাই:
📦 পণ্য: ${product.title}
💰 দাম: ${formatBDT(product.price)}
🏷️ SKU: ${product.sku}
🔗 লিংক: ${productUrl}

আমার নাম ও ডেলিভারি ঠিকানা:`
  )}`;

  const handleCardClick = () => {
    setSelectedProductId(product.id);
    setViewMode('product-detail');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
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
      <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10">
          {category && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 backdrop-blur-xs text-gray-800 shadow-xs">
              {category.name}
            </span>
          )}

          {!product.isPublished && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-white shadow-xs uppercase tracking-wide">
              Draft (Staff View)
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-900/80 backdrop-blur-xs text-white">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-600 text-white shadow-xs">
              Only {product.stockQuantity} left
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600 text-white shadow-xs">
              In Stock ({product.stockQuantity})
            </span>
          )}
        </div>

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
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-mono text-[11px] text-gray-400">SKU: {product.sku}</span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
              <span className="text-gray-400">({product.reviewsCount})</span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
            {product.title}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Price</span>
            <span className="text-lg font-bold text-gray-900 font-mono">
              {formatBDT(product.price)}
            </span>
          </div>

          <div>
            <a
              id={`whatsapp-order-btn-${product.id}`}
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-sm transition-all cursor-pointer hover:scale-102 active:scale-98"
              title="হোয়াটসঅ্যাপে অর্ডার করুন"
            >
              <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
              <span>হোয়াটসঅ্যাপ অর্ডার</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
