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

  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment'>('review');
  const [paymentMethod, setPaymentMethod] = useState<'advance' | 'cod'>('advance');
  const [advanceGateway, setAdvanceGateway] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [senderNumber, setSenderNumber] = useState(currentUser?.phone || '');
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // Advance Payment gives an instant 50 TK discount!
  const advanceDiscount = paymentMethod === 'advance' ? 50 : 0;
  const payableTotal = Math.max(0, cartTotal - advanceDiscount);

  // Check if customer has a valid shipping address saved in Account Settings
  const hasShippingAddress = Boolean(
    currentUser?.address?.street?.trim() &&
    (currentUser?.address?.district || currentUser?.address?.city)
  );

  const officialBkashNumber = '01780417575';
  const officialNagadNumber = '01780417575';
  const officialRocketNumber = '017804175752';
  const currentOfficialNumber =
    advanceGateway === 'bkash'
      ? officialBkashNumber
      : advanceGateway === 'nagad'
      ? officialNagadNumber
      : officialRocketNumber;

  const handleCopyNumber = (num: string, gatewayName: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    addToast(`Official ${gatewayName} number copied to clipboard: ${num}`, 'success');
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleProceedToPayment = () => {
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

    setCheckoutStep('payment');
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
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

    if (paymentMethod === 'advance') {
      const gatewayName =
        advanceGateway === 'bkash' ? 'bKash' : advanceGateway === 'nagad' ? 'Nagad' : 'Rocket';
      if (!senderNumber.trim()) {
        addToast(`Please enter your ${gatewayName} mobile account number.`, 'warning');
        return;
      }
      if (!trxId.trim()) {
        addToast(`Please enter the ${gatewayName} Transaction ID (TrxID) after sending money.`, 'warning');
        return;
      }
    }

    setIsPlacingOrder(true);
    try {
      const paymentDetails =
        paymentMethod === 'advance'
          ? {
              gateway: advanceGateway,
              senderNumber: senderNumber.trim(),
              bkashNumber: advanceGateway === 'bkash' ? senderNumber.trim() : undefined,
              nagadNumber: advanceGateway === 'nagad' ? senderNumber.trim() : undefined,
              rocketNumber: advanceGateway === 'rocket' ? senderNumber.trim() : undefined,
              trxId: trxId.trim().toUpperCase(),
              advanceDiscount: 50,
            }
          : undefined;

      const order = await createOrder(
        currentUser.address,
        paymentMethod,
        currentUser.email,
        paymentDetails,
        advanceDiscount
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

    const gatewayName =
      advanceGateway === 'bkash' ? 'bKash' : advanceGateway === 'nagad' ? 'Nagad' : 'Rocket';

    const paymentLabel =
      paymentMethod === 'advance'
        ? `Full Advance Payment (${gatewayName}) [৳50 Discount Applied! Sender: ${senderNumber || 'N/A'}, TrxID: ${trxId || 'N/A'}]`
        : 'Cash on Delivery (COD)';

    const discountLine =
      paymentMethod === 'advance'
        ? `Advance Payment Discount: -${formatBDT(50)} (Instant ৳50 Discount)\n`
        : '';

    const orderMsg = `Hello XEEROO! I would like to place an order:

📦 Ordered Products:
${cartItemsText}

Subtotal: ${formatBDT(cartSubtotal)}
Delivery Charge: ${formatBDT(deliveryCharge)}
${discountLine}Total Payable: ${formatBDT(payableTotal)}

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
          {checkoutStep === 'payment' ? (
            <button
              type="button"
              onClick={() => {
                setCheckoutStep('review');
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Order Details</span>
            </button>
          ) : (
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
          )}
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
            {checkoutStep === 'payment' ? 'Advance Payment Gateway' : 'Checkout & Direct Order'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Stepper Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold">
            <span className={checkoutStep === 'review' ? 'text-blue-600' : 'text-emerald-600'}>
              1. Order Details
            </span>
            <span className="text-gray-300">→</span>
            <span className={checkoutStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}>
              2. bKash / Nagad / Rocket Payment
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Steps */}
        <div className="lg:col-span-7 space-y-6">
          {checkoutStep === 'review' ? (
            /* STEP 1: REVIEW & SELECT PAYMENT METHOD */
            <>
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
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-amber-900">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <h3 className="text-sm font-bold text-amber-900">
                          Shipping Address Not Set Yet
                        </h3>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          To complete your purchase, please add your delivery address (District, Thana & Street) in your Account Settings. You only need to do this once.
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

              {/* SECTION 2: PAYMENT METHOD (Exactly 2 Options) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Payment Method
                      </h2>
                    </div>
                    {paymentMethod === 'advance' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>৳50 Discount Applied</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Choose how you would like to complete your order payment
                  </p>
                </div>

                {/* 2 Payment Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Option 1: Full TK Pay (Advance Payment - Default Selected) */}
                  <button
                    type="button"
                    id="btn-payment-full-pay"
                    onClick={() => setPaymentMethod('advance')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                      paymentMethod === 'advance'
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20 shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-[10px] shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Save ৳50 Instantly</span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                          ৳
                        </span>
                        <span className="text-xs font-black text-gray-900">
                          Full TK Pay (Advance Payment)
                        </span>
                      </div>
                      {paymentMethod === 'advance' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>

                    <p className="text-[11px] text-gray-600 leading-snug mb-2">
                      Pay in full in advance via bKash, Nagad, or Rocket and receive an instant <strong>৳50 discount</strong> on your order.
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                      <span className="px-1.5 py-0.5 rounded bg-pink-100 text-[#D12053] font-bold">bKash</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-[#F7931E] font-bold">Nagad</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#8C3494] font-bold">Rocket</span>
                      <span>(Send Money)</span>
                    </div>
                  </button>

                  {/* Option 2: Cash on Delivery (COD) */}
                  <button
                    type="button"
                    id="btn-payment-cod"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                      paymentMethod === 'cod'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-gray-900">
                          Cash on Delivery
                        </span>
                      </div>
                      {paymentMethod === 'cod' && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>

                    <p className="text-[11px] text-gray-600 leading-snug mb-1">
                      Pay with cash when the delivery agent delivers your package to your doorstep.
                    </p>

                    <span className="text-[10px] text-gray-400 font-medium block">
                      Regular Total Payable: {formatBDT(cartTotal)}
                    </span>
                  </button>
                </div>

                {/* Selected Method Details & Guidance */}
                {paymentMethod === 'advance' ? (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">Advance Payment Selected (৳50 Discount Applied)</span>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        An instant ৳50 discount is deducted from your bill. Click <strong>&quot;Proceed to Payment&quot;</strong> to view bKash, Nagad, and Rocket payment details on the next page.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">Cash on Delivery Selected</span>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        Pay <strong>{formatBDT(cartTotal)}</strong> in cash when the delivery person arrives at your doorstep with your authentic package.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 space-y-3">
                  {hasShippingAddress ? (
                    paymentMethod === 'advance' ? (
                      <button
                        id="btn-proceed-to-payment"
                        type="button"
                        onClick={handleProceedToPayment}
                        className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98"
                      >
                        <span>Proceed to Payment • {formatBDT(payableTotal)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        id="btn-confirm-order-cod"
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
                            <span>Confirm & Place Order • {formatBDT(cartTotal)}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => openSettingsModal('address')}
                      className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Set Delivery Address to Continue</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOrderViaWhatsApp}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs transition-all cursor-pointer border border-[#25D366]/30 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Order via WhatsApp ({formatBDT(payableTotal)})</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* STEP 2: DEDICATED SEPARATE PAYMENT PAGE FOR BKASH & NAGAD */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep('review');
                      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 mb-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Order Details</span>
                  </button>
                  <h2 className="text-base font-black text-gray-900 tracking-tight">
                    Make Advance Payment
                  </h2>
                  <p className="text-xs text-gray-500">
                    Send money via bKash, Nagad, or Rocket to complete your order with ৳50 discount
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block line-through">
                    Original: {formatBDT(cartTotal)}
                  </span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    Total: {formatBDT(payableTotal)}
                  </span>
                </div>
              </div>

              {/* Gateway Tabs: bKash vs Nagad vs Rocket */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Select Mobile Payment Wallet:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* bKash Tab */}
                  <button
                    type="button"
                    onClick={() => setAdvanceGateway('bkash')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      advanceGateway === 'bkash'
                        ? 'border-[#D12053] bg-pink-50 ring-2 ring-[#D12053]/25 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#D12053] text-white font-black text-xs">
                        bKash
                      </span>
                      <div className="text-left hidden sm:block">
                        <span className="text-xs font-bold text-gray-900 block">bKash</span>
                        <span className="text-[10px] text-gray-500">Send Money</span>
                      </div>
                    </div>
                    {advanceGateway === 'bkash' && (
                      <CheckCircle2 className="w-4 h-4 text-[#D12053] shrink-0" />
                    )}
                  </button>

                  {/* Nagad Tab */}
                  <button
                    type="button"
                    onClick={() => setAdvanceGateway('nagad')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      advanceGateway === 'nagad'
                        ? 'border-[#F7931E] bg-orange-50 ring-2 ring-[#F7931E]/25 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#F7931E] text-white font-black text-xs">
                        Nagad
                      </span>
                      <div className="text-left hidden sm:block">
                        <span className="text-xs font-bold text-gray-900 block">Nagad</span>
                        <span className="text-[10px] text-gray-500">Send Money</span>
                      </div>
                    </div>
                    {advanceGateway === 'nagad' && (
                      <CheckCircle2 className="w-4 h-4 text-[#F7931E] shrink-0" />
                    )}
                  </button>

                  {/* Rocket Tab */}
                  <button
                    type="button"
                    onClick={() => setAdvanceGateway('rocket')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      advanceGateway === 'rocket'
                        ? 'border-[#8C3494] bg-purple-50 ring-2 ring-[#8C3494]/25 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#8C3494] text-white font-black text-xs">
                        Rocket
                      </span>
                      <div className="text-left hidden sm:block">
                        <span className="text-xs font-bold text-gray-900 block">Rocket</span>
                        <span className="text-[10px] text-gray-500">Send Money</span>
                      </div>
                    </div>
                    {advanceGateway === 'rocket' && (
                      <CheckCircle2 className="w-4 h-4 text-[#8C3494] shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Step-by-Step Payment Instructions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-3 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="flex-1">
                    Open your <strong>{advanceGateway === 'bkash' ? 'bKash' : advanceGateway === 'nagad' ? 'Nagad' : 'Rocket'} App</strong> and select <strong>Send Money</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="flex-1">
                    Send exact amount <strong className="text-emerald-700 font-mono text-sm">{formatBDT(payableTotal)}</strong> (with ৳50 discount applied) to our official personal account number:
                  </p>
                </div>

                {/* Copyable Account Box */}
                <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-300">
                  <Phone className={`w-4 h-4 ${advanceGateway === 'bkash' ? 'text-[#D12053]' : advanceGateway === 'nagad' ? 'text-[#F7931E]' : 'text-[#8C3494]'} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase block">
                      XEEROO Official {advanceGateway === 'bkash' ? 'bKash' : advanceGateway === 'nagad' ? 'Nagad' : 'Rocket'} (Personal / Send Money)
                    </span>
                    <span className="font-mono text-sm font-black text-gray-900 tracking-wider">
                      {currentOfficialNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyNumber(currentOfficialNumber, advanceGateway === 'bkash' ? 'bKash' : advanceGateway === 'nagad' ? 'Nagad' : 'Rocket')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                      advanceGateway === 'bkash'
                        ? 'bg-pink-100 hover:bg-pink-200 text-[#D12053]'
                        : advanceGateway === 'nagad'
                        ? 'bg-orange-100 hover:bg-orange-200 text-[#F7931E]'
                        : 'bg-purple-100 hover:bg-purple-200 text-[#8C3494]'
                    }`}
                  >
                    {copiedNumber ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="flex-1">
                    After completing the transfer, enter your mobile number and the <strong>Transaction ID (TrxID)</strong> below:
                  </p>
                </div>
              </div>

              {/* Form Inputs for Sender Mobile & TrxID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Your {advanceGateway === 'bkash' ? 'bKash' : advanceGateway === 'nagad' ? 'Nagad' : 'Rocket'} Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    value={senderNumber}
                    onChange={e => setSenderNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Transaction ID (TrxID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      advanceGateway === 'bkash'
                        ? 'e.g. 9J87K2L1P0'
                        : advanceGateway === 'nagad'
                        ? 'e.g. 7N38D9A1'
                        : 'e.g. 8K42M9B1'
                    }
                    value={trxId}
                    onChange={e => setTrxId(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  Need assistance? Message our WhatsApp order desk directly (+880 1570-243005).
                </span>
              </div>

              {/* Confirm Order Button */}
              <div className="pt-2 space-y-3">
                <button
                  id="btn-confirm-advance-order"
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-98"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying & Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Payment & Place Order • {formatBDT(payableTotal)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOrderViaWhatsApp}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs transition-all cursor-pointer border border-[#25D366]/30 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Order Details via WhatsApp</span>
                </button>
              </div>
            </div>
          )}
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

              {/* Advance Payment Discount Line */}
              {paymentMethod === 'advance' && (
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <span className="flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Advance Payment Discount</span>
                  </span>
                  <span className="font-mono font-black text-emerald-700">-{formatBDT(advanceDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount Due</span>
                <div className="text-right">
                  {paymentMethod === 'advance' && (
                    <del className="text-xs text-gray-400 font-normal font-mono block">
                      {formatBDT(cartTotal)}
                    </del>
                  )}
                  <span className={`font-mono text-base ${paymentMethod === 'advance' ? 'text-emerald-700' : 'text-blue-600'}`}>
                    {formatBDT(payableTotal)}
                  </span>
                </div>
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
