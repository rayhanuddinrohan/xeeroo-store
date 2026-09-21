/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShippingAddress, Order } from '../../types';
import { formatBDT } from '../../utils/currency';
import {
  X,
  CheckCircle2,
  CreditCard,
  Truck,
  ShieldCheck,
  ArrowRight,
  Package,
  ShoppingBag,
  AlertCircle,
  Clock,
  LogIn,
  ShieldAlert,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isLoggedIn,
    openLoginModal,
    cart,
    cartSubtotal,
    cartTax,
    cartTotal,
    createOrder,
    setViewMode,
  } = useStore();

  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: currentUser?.fullName || '',
    street: 'House 12, Road 4, Sector 7, Uttara',
    city: 'Dhaka',
    state: 'Dhaka Division',
    postalCode: '1230',
    country: 'Bangladesh',
    phone: currentUser?.phone || '+880 1570-243005',
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cod'>('cod');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  if (!isOpen) return null;

  const isPendingCustomer =
    currentUser?.role === 'customer' && currentUser?.approvalStatus !== 'approved';

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.street || !address.city || !address.postalCode) {
      return;
    }
    setStep('payment');
  };

  const handlePlaceOrder = () => {
    const order = createOrder(address, paymentMethod);
    if (order) {
      setCreatedOrder(order);
      setStep('success');
    }
  };

  const handleFinish = () => {
    onClose();
    setViewMode('orders');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-950 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white uppercase">
                XEEROO Checkout
              </span>
              <span className="text-xs text-slate-400">
                {step === 'shipping' && '1. Delivery Details'}
                {step === 'payment' && '2. Payment Method'}
                {step === 'success' && '3. Order Receipt'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {step === 'shipping' && 'Shipping & Delivery Address'}
              {step === 'payment' && 'Payment & Final Confirmation'}
              {step === 'success' && 'Order Placed Successfully'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate: Must be logged in */}
        {!isLoggedIn && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <LogIn className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Sign In Required for Checkout</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Please sign in to your registered customer account or administrator profile to complete your order with XEEROO.
            </p>
            <button
              onClick={() => {
                onClose();
                openLoginModal();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          </div>
        )}

        {/* Customer Pending Approval Gate */}
        {isLoggedIn && isPendingCustomer && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-amber-900">Customer Account Pending Admin Approval</h4>
            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              Your registration as <strong>{currentUser?.fullName}</strong> has been received and is currently in the <strong>Admin Approval Queue</strong>. Per XEEROO policy, orders cannot be completed until the administrator authorizes your customer profile.
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-800 space-y-1 max-w-md mx-auto">
              <div className="flex justify-between">
                <span>Account Email:</span>
                <span className="font-mono font-medium">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Back to Storefront
            </button>
          </div>
        )}

        {/* Step 1: Shipping Form (when authorized) */}
        {isLoggedIn && !isPendingCustomer && step === 'shipping' && (
          <form onSubmit={handleShippingSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={e => setAddress({ ...address, fullName: e.target.value })}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={address.phone}
                  onChange={e => setAddress({ ...address, phone: e.target.value })}
                  placeholder="+880 1570-243005"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Street Address / House / Flat *
              </label>
              <input
                type="text"
                required
                value={address.street}
                onChange={e => setAddress({ ...address, street: e.target.value })}
                placeholder="House 12, Road 4, Sector 7"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  City / District *
                </label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={e => setAddress({ ...address, city: e.target.value })}
                  placeholder="Dhaka"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  State / Division
                </label>
                <input
                  type="text"
                  value={address.state}
                  onChange={e => setAddress({ ...address, state: e.target.value })}
                  placeholder="Dhaka"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  required
                  value={address.postalCode}
                  onChange={e => setAddress({ ...address, postalCode: e.target.value })}
                  placeholder="1230"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Total Order Value: <strong className="text-gray-900 font-mono">{formatBDT(cartTotal)}</strong>
              </span>

              <button
                id="btn-shipping-next"
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Payment (when authorized) */}
        {isLoggedIn && !isPendingCustomer && step === 'payment' && (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Select Payment Method
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-100'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Truck className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block font-semibold">Cash on Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-100'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs block font-semibold">Debit / Credit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'paypal'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-100'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base font-extrabold text-indigo-600 block mb-0.5">MFS</span>
                  <span className="text-xs block font-semibold">bKash / Nagad</span>
                </button>
              </div>
            </div>

            {/* Test card simulation input if card chosen */}
            {paymentMethod === 'card' && (
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg font-mono text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg font-mono text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg font-mono text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Order summary breakdown in BDT */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Items ({cart.length} distinct products)</span>
                <span className="font-mono">{formatBDT(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping within Bangladesh</span>
                <span className="text-emerald-600 font-semibold">Free Express</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax (5%)</span>
                <span className="font-mono">{formatBDT(cartTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount Due</span>
                <span className="font-mono text-blue-600">{formatBDT(cartTotal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Back to Address
              </button>

              <button
                id="btn-confirm-order"
                type="button"
                onClick={handlePlaceOrder}
                className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Place Order ({formatBDT(cartTotal)})</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {step === 'success' && createdOrder && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-extrabold text-gray-900 mb-1">
                Thank You! Order Confirmed
              </h4>
              <p className="text-xs text-gray-500">
                Order <strong className="text-gray-900 font-mono">#{createdOrder.id}</strong> has been confirmed. Inventory has been updated automatically.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-gray-600">
                <span>Customer Account:</span>
                <span className="font-medium text-gray-900">{createdOrder.userEmail}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Paid:</span>
                <span className="font-bold text-gray-900 font-mono">{formatBDT(createdOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Order Status:</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800 uppercase">
                  {createdOrder.status}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Address:</span>
                <span className="text-right text-gray-900">
                  {createdOrder.shippingAddress.street}, {createdOrder.shippingAddress.city}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              View in My Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
