/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShippingAddress, Order } from '../../types';
import { formatBDT } from '../../utils/currency';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshDistricts';
import {
  getShippingZoneInfo,
  calculateShippingCharge,
  isValidBDPhone,
} from '../../utils/shipping';
import {
  X,
  CheckCircle2,
  CreditCard,
  Truck,
  ShieldCheck,
  ArrowRight,
  Package,
  ShoppingBag,
  Loader2,
  MapPin,
  ChevronDown,
  Phone,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncompleteOrder?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onIncompleteOrder,
}) => {
  const {
    currentUser,
    isLoggedIn,
    openLoginModal,
    cart,
    cartSubtotal,
    deliveryCharge,
    cartTotal,
    createOrder,
    setViewMode,
    addToast,
  } = useStore();

  const [step, setStep] = useState<'shipping' | 'payment' | 'advance_gateway' | 'success'>('shipping');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Bangladesh District and Thana state
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Dhaka');
  const [selectedThana, setSelectedThana] = useState<string>('Uttara East');

  // Form address state (postal code removed as requested)
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [street, setStreet] = useState(currentUser?.address?.street || '');

  // Sorted districts list
  const districtList = useMemo(() => {
    return [...BANGLADESH_DISTRICTS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Available thanas for current district
  const availableThanas = useMemo(() => {
    const matched = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());
    return matched ? matched.thanas : [];
  }, [selectedDistrict]);

  // Dynamic shipping fee calculation for selected location
  // 80 TK inside Dhaka city, 130 TK sub-urban & outside Dhaka
  const shippingInfo = useMemo(() => {
    return getShippingZoneInfo(selectedDistrict, selectedThana);
  }, [selectedDistrict, selectedThana]);

  const modalDeliveryCharge = shippingInfo.charge;
  const modalCartTotal = cartSubtotal + modalDeliveryCharge;

  // Sync when currentUser changes or modal opens
  useEffect(() => {
    if (currentUser) {
      setCustomerEmail(currentUser.email || '');
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      if (currentUser.address?.street) {
        setStreet(currentUser.address.street);
      }
      if (currentUser.address?.city) {
        const found = BANGLADESH_DISTRICTS.find(
          d => d.name.toLowerCase() === currentUser.address?.city?.toLowerCase()
        );
        if (found) {
          setSelectedDistrict(found.name);
          if (currentUser.address?.state && found.thanas.includes(currentUser.address.state)) {
            setSelectedThana(currentUser.address.state);
          } else if (found.thanas.length > 0) {
            setSelectedThana(found.thanas[0]);
          }
        }
      }
    }
  }, [currentUser, isOpen]);

  // When district changes, update thana to first available thana
  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    const matched = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === districtName.toLowerCase());
    if (matched && matched.thanas.length > 0) {
      setSelectedThana(matched.thanas[0]);
    } else {
      setSelectedThana('');
    }
  };

  const [paymentMethod, setPaymentMethod] = useState<'advance' | 'cod'>('advance');
  const [advanceGateway, setAdvanceGateway] = useState<'bkash' | 'nagad'>('bkash');
  const [senderNumber, setSenderNumber] = useState(currentUser?.phone || '');
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  const officialBkashNumber = '01780417575';
  const officialNagadNumber = '01780417575';
  const currentOfficialNumber = advanceGateway === 'bkash' ? officialBkashNumber : officialNagadNumber;

  const handleCopyNumber = (num: string, gatewayName: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    addToast(`Official ${gatewayName} number copied to clipboard: ${num}`, 'success');
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const modalAdvanceDiscount = paymentMethod === 'advance' ? 50 : 0;
  const modalPayableTotal = Math.max(0, modalCartTotal - modalAdvanceDiscount);

  if (!isOpen) return null;

  // Build current ShippingAddress object
  const currentAddress: ShippingAddress = {
    fullName: fullName.trim(),
    street: street.trim(),
    city: selectedDistrict, // District
    state: selectedThana, // Thana
    district: selectedDistrict,
    thana: selectedThana,
    country: 'Bangladesh',
    phone: phone.trim(),
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !street.trim() || !selectedDistrict || !selectedThana) {
      return;
    }
    if (!isValidBDPhone(phone)) {
      addToast('Please enter a valid 11-digit Bangladeshi mobile number starting with 013-019 (e.g. 017XXXXXXXX).', 'error');
      return;
    }
    setStep('payment');
  };

  const handlePlaceOnlineOrder = async () => {
    if (!isValidBDPhone(phone)) {
      addToast('Please enter a valid 11-digit Bangladeshi mobile number starting with 013-019 (e.g. 017XXXXXXXX).', 'error');
      setStep('shipping');
      return;
    }

    if (paymentMethod === 'advance') {
      const gatewayName = advanceGateway === 'bkash' ? 'bKash' : 'Nagad';
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
              trxId: trxId.trim().toUpperCase(),
              advanceDiscount: 50,
            }
          : undefined;

      const order = await createOrder(
        currentAddress,
        paymentMethod,
        customerEmail,
        paymentDetails,
        modalAdvanceDiscount
      );
      if (order) {
        setCreatedOrder(order);
        setStep('success');
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceOrderViaWhatsApp = async () => {
    if (!isValidBDPhone(phone)) {
      addToast('Please enter a valid 11-digit Bangladeshi mobile number starting with 013-019 (e.g. 017XXXXXXXX).', 'error');
      setStep('shipping');
      return;
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
              trxId: trxId.trim().toUpperCase(),
              advanceDiscount: 50,
            }
          : undefined;

      const order = await createOrder(
        currentAddress,
        paymentMethod,
        customerEmail,
        paymentDetails,
        modalAdvanceDiscount
      );
      const cartItemsText = cart
        .map(
          (item, idx) =>
            `${idx + 1}. ${item.product.title} x ${item.quantity} = ${formatBDT(item.product.price * item.quantity)}`
        )
        .join('\n');

      const paymentLabel =
        paymentMethod === 'advance'
          ? `Full Advance Payment (${advanceGateway === 'bkash' ? 'bKash' : 'Nagad'}) [৳50 Discount Applied! Sender: ${senderNumber || 'N/A'}, TrxID: ${trxId || 'N/A'}]`
          : 'Cash on Delivery (COD)';

      const discountLine =
        paymentMethod === 'advance'
          ? `Advance Payment Discount: -${formatBDT(50)} (Instant ৳50 Discount)\n`
          : '';

      const orderMsg = `Hello! I would like to confirm my order:

📦 Ordered Items:
${cartItemsText}

Subtotal: ${formatBDT(cartSubtotal)}
Delivery Charge: ${formatBDT(modalDeliveryCharge)} (${shippingInfo.label})
${discountLine}Total Payable: ${formatBDT(modalPayableTotal)}

Payment Method: ${paymentLabel}

📍 Delivery Address:
Name: ${fullName}
Phone: ${phone}
District: ${selectedDistrict}
Thana / Upazila: ${selectedThana}
Address: ${street}
Country: Bangladesh

Please confirm and dispatch the order. Thank you!`;

      const waUrl = `https://wa.me/8801570243005?text=${encodeURIComponent(orderMsg)}`;
      window.open(waUrl, '_blank');
      if (order) {
        setCreatedOrder(order);
        setStep('success');
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCloseCheckout = () => {
    if (step !== 'success' && cart.length > 0) {
      addToast('Order not completed. Your items are saved in your cart.', 'info');
      onClose();
      onIncompleteOrder?.();
    } else {
      onClose();
    }
  };

  const handleReturnToCart = () => {
    addToast('Your items are saved in your cart.', 'info');
    onClose();
    onIncompleteOrder?.();
  };

  const handleFinish = () => {
    onClose();
    setViewMode('store');
  };

  const handleGoToOrders = () => {
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
                Checkout
              </span>
              <span className="text-xs text-slate-400">
                {step === 'shipping' && 'Step 1: Delivery Details'}
                {step === 'payment' && 'Step 2: Payment Method'}
                {step === 'advance_gateway' && 'Step 3: bKash / Nagad Payment'}
                {step === 'success' && 'Step 4: Order Receipt'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {step === 'shipping' && 'Shipping & Delivery Address'}
              {step === 'payment' && 'Select Payment Method'}
              {step === 'advance_gateway' && 'Advance Payment Gateway'}
              {step === 'success' && 'Order Placed Successfully'}
            </h3>
          </div>

          <button
            onClick={handleCloseCheckout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Shipping Form */}
        {step === 'shipping' && (
          <form onSubmit={handleShippingSubmit} className="p-6 space-y-4">
            {!isLoggedIn && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Already have an account? Sign in for faster checkout.</span>
                </div>
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="font-bold text-blue-700 hover:text-blue-900 underline shrink-0 cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address (Optional - for order tracking & receipts)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* District & Thana Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  District *
                </label>
                <div className="relative">
                  <select
                    id="select-district"
                    value={selectedDistrict}
                    onChange={e => handleDistrictChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 appearance-none bg-white pr-8 cursor-pointer"
                  >
                    {districtList.map(dist => (
                      <option key={dist.name} value={dist.name}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Thana / Upazila *
                </label>
                <div className="relative">
                  <select
                    id="select-thana"
                    value={selectedThana}
                    onChange={e => setSelectedThana(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 appearance-none bg-white pr-8 cursor-pointer"
                  >
                    {availableThanas.map(th => (
                      <option key={th} value={th}>
                        {th}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Street Address / House & Road Details *
              </label>
              <textarea
                required
                rows={2}
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="House 12, Road 4, Block C, Area details..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-100 gap-2">
              <button
                type="button"
                onClick={handleReturnToCart}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Save items and return to shopping cart"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                <span>Return to Cart</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-xs text-gray-600">
                  <span>Subtotal: <strong className="text-gray-900 font-mono">{formatBDT(cartSubtotal)}</strong></span>
                  <span className="mx-1.5 text-gray-300">|</span>
                  <span>Delivery: <strong className="text-emerald-700 font-mono">{formatBDT(modalDeliveryCharge)}</strong></span>
                </div>

                <button
                  id="btn-shipping-next"
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: Payment & Final Confirmation */}
        {step === 'payment' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Delivery Destination Summary */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs flex items-start gap-2.5 text-gray-800">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{fullName} ({phone})</p>
                <p className="text-gray-600 truncate">{street}, {selectedThana}, {selectedDistrict}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer underline shrink-0"
              >
                Change
              </button>
            </div>

            {/* Cart Items Summary */}
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700">Order Items ({cart.length})</span>
                <span className="text-[11px] text-gray-500 font-mono">
                  Total {cart.reduce((sum, i) => sum + i.quantity, 0)} items
                </span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-lg border border-gray-100"
                  >
                    {item.product.images && item.product.images[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <Package className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-[11px]">{item.product.title}</p>
                      <span className="text-[10px] text-gray-500">
                        {formatBDT(item.product.price)} × {item.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 font-mono text-xs">
                      {formatBDT(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selector - Exactly 2 Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">
                  Select Payment Method
                </label>
                {paymentMethod === 'advance' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Save ৳50 Instantly</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Full TK Pay (Advance Payment - Default Selected) */}
                <button
                  type="button"
                  id="modal-btn-payment-full-pay"
                  onClick={() => setPaymentMethod('advance')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                    paymentMethod === 'advance'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                        ৳
                      </span>
                      <span className="text-xs font-black text-gray-900 block">Full TK Pay</span>
                    </div>
                    {paymentMethod === 'advance' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    Save ৳50 Instantly
                  </span>
                  <span className="text-[9px] text-gray-500 block">bKash / Nagad Send Money</span>
                </button>

                {/* 2. Cash on Delivery */}
                <button
                  type="button"
                  id="modal-btn-payment-cod"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-100 shadow-xs'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-gray-900 block">Cash on Delivery</span>
                    </div>
                    {paymentMethod === 'cod' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-600 block">Pay at Doorstep</span>
                  <span className="text-[9px] text-gray-400 block">Regular Total</span>
                </button>
              </div>

              {/* Selected Method Guidance Note */}
              <div className="mt-3">
                {paymentMethod === 'advance' ? (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold block text-xs">Advance Payment Selected (৳50 Discount Applied)</span>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        An instant ৳50 discount is deducted from your bill. Click <strong>&quot;Proceed to Payment&quot;</strong> to view bKash and Nagad payment details on the next page.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold block text-xs">Cash on Delivery Selected</span>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        Pay <strong>{formatBDT(modalCartTotal)}</strong> in cash when the delivery person arrives at your doorstep with your authentic package.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Price Breakdown with Dynamic Location Delivery Charge */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-mono">{formatBDT(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span>Delivery Charge</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                    {shippingInfo.label}
                  </span>
                </span>
                <span className="font-mono font-semibold text-gray-900">{formatBDT(modalDeliveryCharge)}</span>
              </div>

              {/* Advance discount */}
              {paymentMethod === 'advance' && (
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  <span className="flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Advance Payment Discount</span>
                  </span>
                  <span className="font-mono font-bold">-{formatBDT(modalAdvanceDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount Due</span>
                <div className="text-right">
                  {paymentMethod === 'advance' && (
                    <del className="text-[11px] text-gray-400 font-normal font-mono block">
                      {formatBDT(modalCartTotal)}
                    </del>
                  )}
                  <span className={`font-mono text-base ${paymentMethod === 'advance' ? 'text-emerald-700 font-black' : 'text-blue-600'}`}>
                    {formatBDT(modalPayableTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Proceed to Payment or Confirm Order */}
            <div className="space-y-2.5 pt-1">
              {paymentMethod === 'advance' ? (
                <button
                  id="btn-modal-proceed-to-payment"
                  type="button"
                  onClick={() => setStep('advance_gateway')}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98"
                >
                  <span>Proceed to Payment • {formatBDT(modalPayableTotal)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-confirm-online-order"
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOnlineOrder}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 disabled:opacity-50"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Placing Order & Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Confirm & Place Order • {formatBDT(modalCartTotal)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer py-2 px-1"
                  >
                    ← Edit Address
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleReturnToCart}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer py-2 px-1 flex items-center gap-1"
                    title="Keep items and view in shopping cart"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Return to Cart</span>
                  </button>
                </div>

                <button
                  id="btn-confirm-order-whatsapp"
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrderViaWhatsApp}
                  className="py-2.5 px-4 text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl shadow-md shadow-[#25D366]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-98"
                  title="Confirm and send order via WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Dedicated Advance Payment Gateway Page (bKash & Nagad) */}
        {step === 'advance_gateway' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer mb-1"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Back to Payment Method</span>
                </button>
                <h4 className="text-sm font-black text-gray-900">
                  Make Advance Payment
                </h4>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-400 line-through block font-mono">
                  {formatBDT(modalCartTotal)}
                </span>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  {formatBDT(modalPayableTotal)}
                </span>
              </div>
            </div>

            {/* Gateway Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Select Mobile Wallet:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdvanceGateway('bkash')}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-xs ${
                    advanceGateway === 'bkash'
                      ? 'border-[#D12053] bg-pink-50 ring-2 ring-[#D12053]/25 font-bold text-[#D12053]'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#D12053] text-white font-bold text-[10px]">
                      bKash
                    </span>
                    <span>Send Money</span>
                  </div>
                  {advanceGateway === 'bkash' && <CheckCircle2 className="w-3.5 h-3.5 text-[#D12053]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setAdvanceGateway('nagad')}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-xs ${
                    advanceGateway === 'nagad'
                      ? 'border-[#F7931E] bg-orange-50 ring-2 ring-[#F7931E]/25 font-bold text-[#F7931E]'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#F7931E] text-white font-bold text-[10px]">
                      Nagad
                    </span>
                    <span>Send Money</span>
                  </div>
                  {advanceGateway === 'nagad' && <CheckCircle2 className="w-3.5 h-3.5 text-[#F7931E]" />}
                </button>
              </div>
            </div>

            {/* Step-by-Step Payment Instructions */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="flex-1 text-[11px]">
                  Open your <strong>{advanceGateway === 'bkash' ? 'bKash' : 'Nagad'} App</strong> and select <strong>Send Money</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="flex-1 text-[11px]">
                  Send exact amount <strong className="text-emerald-700 font-mono">{formatBDT(modalPayableTotal)}</strong> (with ৳50 discount applied) to our official personal account number:
                </p>
              </div>

              {/* Copyable Account Box */}
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-300">
                <Phone className={`w-3.5 h-3.5 ${advanceGateway === 'bkash' ? 'text-[#D12053]' : 'text-[#F7931E]'} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs font-black text-gray-900 tracking-wider">
                    {currentOfficialNumber}
                  </span>
                  <span className="text-[9px] text-gray-500 block uppercase font-medium">
                    Official {advanceGateway === 'bkash' ? 'bKash' : 'Nagad'} (Personal / Send Money)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyNumber(currentOfficialNumber, advanceGateway === 'bkash' ? 'bKash' : 'Nagad')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    advanceGateway === 'bkash'
                      ? 'bg-pink-100 hover:bg-pink-200 text-[#D12053]'
                      : 'bg-orange-100 hover:bg-orange-200 text-[#F7931E]'
                  }`}
                >
                  {copiedNumber ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <p className="flex-1 text-[11px]">
                  After sending money, enter your mobile account number and the Transaction ID (TrxID) below:
                </p>
              </div>
            </div>

            {/* Inputs for Sender Mobile & TrxID */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">
                  Your {advanceGateway === 'bkash' ? 'bKash' : 'Nagad'} Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={senderNumber}
                  onChange={e => setSenderNumber(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">
                  TrxID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9J87K2L1P0"
                  value={trxId}
                  onChange={e => setTrxId(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                />
              </div>
            </div>

            {/* Confirm Payment Button */}
            <div className="space-y-2 pt-2">
              <button
                id="btn-confirm-advance-order"
                type="button"
                disabled={isPlacingOrder}
                onClick={handlePlaceOnlineOrder}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Verifying Payment & Placing Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Confirm Payment & Place Order • {formatBDT(modalPayableTotal)}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer py-2 px-1"
                >
                  ← Back to Payment Options
                </button>

                <button
                  id="btn-confirm-advance-whatsapp"
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrderViaWhatsApp}
                  className="py-2 px-3 text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl shadow-md shadow-[#25D366]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-98"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {step === 'success' && createdOrder && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider mb-2">
                Order Confirmed
              </span>
              <h4 className="text-xl font-extrabold text-gray-900 mb-1">
                Thank you! Your order has been placed
              </h4>
              <p className="text-xs text-gray-500">
                Order ID <strong className="text-blue-600 font-mono">#{createdOrder.id}</strong> has been saved directly to the Cloud Database.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between text-gray-600 pb-2 border-b border-gray-200">
                <span className="font-semibold">Recipient Name:</span>
                <span className="font-bold text-gray-900">{createdOrder.shippingAddress.fullName}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phone Number:</span>
                <span className="font-mono text-gray-900 font-medium">{createdOrder.shippingAddress.phone}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Email Address:</span>
                <span className="text-gray-900 truncate max-w-[200px]">{createdOrder.userEmail}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge:</span>
                <span className="font-mono text-gray-900 font-medium">{formatBDT(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Amount:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">{formatBDT(createdOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-gray-900 uppercase">
                  {createdOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash / Nagad'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Status:</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800 uppercase text-[11px]">
                  {createdOrder.status}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1 border-t border-gray-100">
                <span>Delivery Address:</span>
                <span className="text-right text-gray-900 font-medium">
                  {createdOrder.shippingAddress.street}, {createdOrder.shippingAddress.thana || createdOrder.shippingAddress.state}, {createdOrder.shippingAddress.district || createdOrder.shippingAddress.city}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleGoToOrders}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Track in My Orders
              </button>
              <button
                onClick={handleFinish}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
