/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import { Order } from '../../types';
import { isValidBDPhone } from '../../utils/shipping';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  ShoppingBag,
  HelpCircle,
  Phone,
  Sparkles,
  ArrowRight,
  Send,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    deliveryCharge,
    cartTotal,
    currentUser,
    createOrder,
    setViewMode,
    openSettingsModal,
    addToast,
    navigateToStore,
    navigateToOrders,
  } = useStore();

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash'>('cod');
  const [bkashNumber, setBkashNumber] = useState(currentUser?.phone || '');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // Check if customer has a valid shipping address saved in Account Settings
  const hasShippingAddress = Boolean(
    currentUser?.address?.street?.trim() &&
    (currentUser?.address?.district || currentUser?.address?.city)
  );

  const officialBkashNumber = '01780417575';

  const handleCopyBkash = () => {
    navigator.clipboard.writeText(officialBkashNumber);
    setCopiedNumber(true);
    addToast('Official bKash number copied to clipboard: ' + officialBkashNumber, 'success');
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      addToast('Please sign in to complete your checkout.', 'warning');
      return;
    }

    if (!hasShippingAddress || !currentUser.address) {
      addToast('Please set your delivery address in Account Settings first.', 'warning');
      openSettingsModal('address');
      return;
    }

    const currentPhone = currentUser.address?.phone || currentUser.phone || '';
    if (!isValidBDPhone(currentPhone)) {
      addToast('Invalid phone number: Please provide an 11-digit Bangladeshi mobile number in Account Settings.', 'error');
      openSettingsModal('address');
      return;
    }

    if (cart.length === 0) {
      addToast('Your cart is empty.', 'warning');
      return;
    }

    if (paymentMethod === 'bkash') {
      if (!bkashNumber.trim()) {
        addToast('Please enter your bKash account number.', 'warning');
        return;
      }
      if (!bkashTrxId.trim()) {
        addToast('Please enter the bKash Transaction ID (TrxID) after sending money.', 'warning');
        return;
      }
    }

    setIsPlacingOrder(true);
    try {
      const paymentDetails =
        paymentMethod === 'bkash'
          ? { bkashNumber: bkashNumber.trim(), trxId: bkashTrxId.trim().toUpperCase() }
          : undefined;

      const order = await createOrder(
        currentUser.address,
        paymentMethod,
        currentUser.email,
        paymentDetails
      );

      if (order) {
        setOrderSuccess(order);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } catch (err: any) {
      addToast(err?.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleOrderViaWhatsApp = () => {
    if (!currentUser?.address) {
      openSettingsModal('address');
      return;
    }

    const cartItemsText = cart
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.product.title} x ${item.quantity} = ${formatBDT(item.product.price * item.quantity)}`
      )
      .join('\n');

    const paymentLabel =
      paymentMethod === 'bkash'
        ? `bKash MFS (Sender: ${bkashNumber || 'N/A'}, TrxID: ${bkashTrxId || 'N/A'})`
        : paymentMethod === 'cod'
        ? 'Cash on Delivery (COD)'
        : 'Credit / Debit Card';

    const orderMsg = `Hello XEEROO! I would like to place an order:

📦 Ordered Products:
${cartItemsText}

Subtotal: ${formatBDT(cartSubtotal)}
Delivery Charge: ${formatBDT(deliveryCharge)}
Total Payable: ${formatBDT(cartTotal)}

💳 Payment Method: ${paymentLabel}

📍 Customer Delivery Address:
Name: ${currentUser.address.fullName || currentUser.fullName}
Phone: ${currentUser.address.phone || currentUser.phone}
Address: ${currentUser.address.street}
Area/Thana: ${currentUser.address.thana || currentUser.address.state}
District: ${currentUser.address.district || currentUser.address.city}
Country: Bangladesh

Please confirm and dispatch my order. Thank you!`;

    const waUrl = `https://wa.me/8801570243005?text=${encodeURIComponent(orderMsg)}`;
    window.open(waUrl, '_blank');
  };

  // SUCCESS RECEIPT VIEW
  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-6 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
            Order Confirmed & Saved to Database
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
            Thank you for your order!
          </h2>

          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
            Your order has been recorded in the XEEROO cloud system. Our dispatch team is preparing your package.
          </p>

          <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-6 mb-8 text-left space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-slate-400 block font-mono">Order Reference ID:</span>
                <span className="text-lg font-black text-white font-mono">#{orderSuccess.id}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Amount:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {formatBDT(orderSuccess.totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Payment Method:</span>
                <span className="font-bold uppercase text-slate-200">
                  {orderSuccess.paymentMethod === 'bkash'
                    ? 'bKash MFS'
                    : orderSuccess.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : 'Card'}
                </span>
                {orderSuccess.paymentDetails?.trxId && (
                  <span className="block text-[11px] font-mono text-pink-300 mt-0.5">
                    TrxID: {orderSuccess.paymentDetails.trxId}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Delivery Destination:</span>
                <span className="font-bold text-slate-200 block truncate">
                  {orderSuccess.shippingAddress.fullName} ({orderSuccess.shippingAddress.phone})
                </span>
                <span className="text-slate-300 block truncate text-[11px]">
                  {orderSuccess.shippingAddress.street}, {orderSuccess.shippingAddress.thana || orderSuccess.shippingAddress.state}, {orderSuccess.shippingAddress.district || orderSuccess.shippingAddress.city}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400 block mb-2 font-medium">Items Ordered:</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {orderSuccess.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs text-slate-300">
                    <span className="truncate max-w-[70%]">
                      • {item.productTitle} × {item.quantity}
                    </span>
                    <span className="font-mono text-slate-400">
                      {formatBDT(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/#/orders"
              onClick={(e) => {
                e.preventDefault();
                navigateToOrders();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View Order History</span>
            </a>

            <a
              href="/#/"
              onClick={(e) => {
                e.preventDefault();
                navigateToStore();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-gray-300"
            >
              <span>Continue Shopping</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART STATE
  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Currently Empty</h3>
        <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
          Explore the XEEROO collection of high-performance hardware, audio, and wearables to add products to your cart.
        </p>
        <a
          href="/#/"
          onClick={(e) => {
            e.preventDefault();
            navigateToStore();
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Storefront</span>
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <a
            href="/#/"
            onClick={(e) => {
              e.preventDefault();
              navigateToStore();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Store</span>
          </a>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
            Checkout & Direct Order
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Secure Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Shipping Verification & Payment Options */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: SHIPPING ADDRESS STATUS */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Delivery Destination
                </h2>
              </div>

              {hasShippingAddress && (
                <button
                  type="button"
                  onClick={() => openSettingsModal('address')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Edit in Settings
                </button>
              )}
            </div>

            {hasShippingAddress && currentUser?.address ? (
              /* Address is already saved in Account Settings! */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {currentUser.address.fullName || currentUser.fullName}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Default Address
                      </span>
                    </div>

                    <p className="text-gray-700 font-medium">
                      Phone: <span className="font-mono text-gray-900">{currentUser.address.phone || currentUser.phone}</span>
                    </p>

                    <p className="text-gray-600 leading-relaxed pt-1">
                      {currentUser.address.street}
                      <br />
                      {currentUser.address.thana || currentUser.address.state}, {currentUser.address.district || currentUser.address.city}
                      <br />
                      Bangladesh
                    </p>
                  </div>

                  <span className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                </div>
              </div>
            ) : (
              /* Customer has NOT saved a shipping address yet! Prompt and direct to settings */
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <h3 className="text-sm font-bold text-amber-900">
                      Shipping Address Not Set Yet
                    </h3>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      To complete your purchase, please add your delivery address (District, Thana & Street) in your Account Settings. You only need to do this once, and all your future orders will be processed instantly without retyping!
                    </p>
                    <button
                      type="button"
                      onClick={() => openSettingsModal('address')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Set Delivery Address in Settings</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: PAYMENT METHOD & DIRECT ORDER */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Payment Method
                </h2>
              </div>
              <p className="text-xs text-gray-500">
                Choose how you would like to complete your order payment
              </p>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Cash on Delivery (Default) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                  paymentMethod === 'cod'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  {paymentMethod === 'cod' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <span className="text-xs font-bold text-gray-900 block">Cash on Delivery</span>
                <span className="text-[11px] text-gray-500 block">Pay at Doorstep with Cash</span>
              </button>

              {/* 2. bKash (MFS) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                  paymentMethod === 'bkash'
                    ? 'border-[#D12053] bg-pink-50/50 ring-2 ring-[#D12053]/20 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-[#D12053] text-white tracking-wider">
                    bKash
                  </span>
                  {paymentMethod === 'bkash' && (
                    <CheckCircle2 className="w-4 h-4 text-[#D12053]" />
                  )}
                </div>
                <span className="text-xs font-bold text-gray-900 block">bKash (MFS)</span>
                <span className="text-[11px] text-gray-500 block">Instant Send Money to Official Account</span>
              </button>
            </div>

            {/* DEDICATED BKASH PAYMENT BOX */}
            {paymentMethod === 'bkash' && (
              <div className="bg-pink-50/60 border border-pink-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#D12053] text-white flex items-center justify-center font-bold text-xs">
                      ৳
                    </span>
                    <h3 className="text-xs font-bold text-gray-900">
                      bKash Payment Instructions
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#D12053] font-mono">
                    Total: {formatBDT(cartTotal)}
                  </span>
                </div>

                <div className="text-xs text-gray-700 space-y-2 leading-relaxed">
                  <p>
                    1. Open your <strong>bKash App</strong> and tap on <strong>Send Money</strong>.
                  </p>
                  <p>
                    2. Send exact amount <strong>{formatBDT(cartTotal)}</strong> to our official XEEROO account number:
                  </p>

                  {/* Copyable bKash Number */}
                  <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-pink-300">
                    <Phone className="w-4 h-4 text-[#D12053] shrink-0" />
                    <span className="font-mono text-sm font-black text-gray-900 tracking-wider flex-1">
                      {officialBkashNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyBkash}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 hover:bg-pink-200 text-[#D12053] rounded-md font-bold text-xs transition-colors cursor-pointer"
                    >
                      {copiedNumber ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p>
                    3. After completing the transfer, enter your bKash mobile number and Transaction ID (TrxID) below:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Your bKash Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 017XXXXXXXX"
                      value={bkashNumber}
                      onChange={e => setBkashNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D12053]/30 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Transaction ID (TrxID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9J87K2L1P0"
                      value={bkashTrxId}
                      onChange={e => setBkashTrxId(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D12053]/30 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Need help with bKash transfer? Message our WhatsApp order desk directly.
                  </span>
                </div>
              </div>
            )}

            {/* COD NOTE */}
            {paymentMethod === 'cod' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
                <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Cash on Delivery Selected</span>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Pay <strong>{formatBDT(cartTotal)}</strong> in cash when the delivery person arrives at your doorstep with your authentic package.
                  </p>
                </div>
              </div>
            )}


            {/* SUBMIT ORDER BUTTONS */}
            <div className="pt-2 space-y-3">
              {hasShippingAddress ? (
                <button
                  id="btn-confirm-order-submit"
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-98"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Placing Order in Database...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Confirm & Place Order • {formatBDT(cartTotal)}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openSettingsModal('address')}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Set Delivery Address to Confirm Order</span>
                </button>
              )}

              {/* Order via WhatsApp direct button */}
              <button
                type="button"
                onClick={handleOrderViaWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs transition-all cursor-pointer border border-[#25D366]/30 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Confirm Order via WhatsApp (+880 1570-243005)</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Items & Pricing Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 sticky top-24">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-mono font-normal text-gray-500">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </h2>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-gray-100">
              {cart.map(item => (
                <div key={item.product.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.product.images[0] || ''}
                    alt={item.product.title}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">
                      {item.product.title}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Qty: {item.quantity} × {formatBDT(item.product.price)}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-900 shrink-0">
                    {formatBDT(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 pt-4 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-gray-900">{formatBDT(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span>Delivery Charge</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                    {deliveryCharge === 80 ? 'Inside Dhaka City (80 ৳)' : 'Sub-urban / Outside Dhaka (130 ৳)'}
                  </span>
                </span>
                <span className="font-mono font-medium text-gray-900">{formatBDT(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount Due</span>
                <span className="font-mono text-blue-600">{formatBDT(cartTotal)}</span>
              </div>
            </div>

            {/* Guarantees */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Official Brand Genuine Hardware Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Fast Dispatch from Dhaka Fulfillment Center</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>7-Day Direct Replacement Warranty Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
