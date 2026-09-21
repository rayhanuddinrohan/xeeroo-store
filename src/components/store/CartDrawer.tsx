/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import { ShoppingBag, X, Trash2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotalCount,
    cartSubtotal,
    cartTax,
    cartTotal,
    setViewMode,
  } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-900" />
              <h2 className="text-base font-bold text-gray-900">
                Shopping Cart ({cartTotalCount})
              </h2>
            </div>
            <button
              id="btn-close-cart"
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Your cart is empty</h3>
                <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto">
                  Browse our high-performance hardware and acoustics catalog to add items.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    setViewMode('store');
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              cart.map(({ product, quantity }) => {
                const maxStock = product.stockQuantity;
                const isMax = quantity >= maxStock;

                return (
                  <div
                    key={product.id}
                    className="flex gap-3.5 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80'}
                      alt={product.title}
                      className="w-16 h-16 rounded-lg object-cover bg-gray-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 truncate">
                            {product.title}
                          </h4>
                          <span className="text-[11px] font-mono text-gray-400">
                            {formatBDT(product.price)} each
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-gray-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-200 rounded-md bg-white">
                          <button
                            onClick={() => updateCartQuantity(product.id, quantity - 1)}
                            className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-800 min-w-6 text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(product.id, quantity + 1)}
                            disabled={isMax}
                            className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-bold text-gray-900 font-mono">
                          {formatBDT(product.price * quantity)}
                        </span>
                      </div>

                      {isMax && (
                        <span className="text-[10px] text-amber-600 font-medium mt-1">
                          Max stock reached ({maxStock})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50/80 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatBDT(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Estimated Tax (5%)</span>
                  <span className="font-mono">{formatBDT(cartTax)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Due</span>
                  <span className="font-mono text-blue-600 font-bold">{formatBDT(cartTotal)}</span>
                </div>
              </div>

              <button
                id="btn-proceed-checkout"
                onClick={onProceedToCheckout}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted & Verified Stock</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
