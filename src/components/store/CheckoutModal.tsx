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
    deliveryCharge,
    cartTotal,
    createOrder,
    setViewMode,
  } = useStore();

  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
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

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cod'>('cod');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

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
    setStep('payment');
  };

  const handlePlaceOnlineOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const order = await createOrder(currentAddress, paymentMethod, customerEmail);
      if (order) {
        setCreatedOrder(order);
        setStep('success');
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceOrderViaWhatsApp = async () => {
    setIsPlacingOrder(true);
    try {
      const order = await createOrder(currentAddress, paymentMethod, customerEmail);
      const cartItemsText = cart
        .map(
          (item, idx) =>
            `${idx + 1}. ${item.product.title} x ${item.quantity} = ${formatBDT(item.product.price * item.quantity)}`
        )
        .join('\n');

      const paymentLabel =
        paymentMethod === 'cod'
          ? 'Cash on Delivery'
          : paymentMethod === 'paypal'
          ? 'bKash / Nagad (MFS)'
          : 'Credit / Debit Card';

      const orderMsg = `Hello! I would like to confirm my order:

📦 Ordered Items:
${cartItemsText}

Subtotal: ${formatBDT(cartSubtotal)}
Delivery Charge: ${formatBDT(deliveryCharge)}
Total Payable: ${formatBDT(cartTotal)}

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
                {step === 'payment' && 'Step 2: Payment & Review'}
                {step === 'success' && 'Step 3: Order Receipt'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {step === 'shipping' && 'Shipping & Delivery Address'}
              {step === 'payment' && 'Payment Method & Final Confirmation'}
              {step === 'success' && 'Order Placed Successfully'}
            </h3>
          </div>

          <button
            onClick={onClose}
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
                        {dist.name} ({dist.division} Division)
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

            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <div className="text-xs text-gray-600">
                <span>Subtotal: <strong className="text-gray-900 font-mono">{formatBDT(cartSubtotal)}</strong></span>
                <span className="mx-1.5 text-gray-300">|</span>
                <span>Delivery: <strong className="text-emerald-700 font-mono">{formatBDT(deliveryCharge)}</strong></span>
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
                    <img
                      src={
                        item.product.images?.[0] ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={item.product.title}
                      className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0"
                    />
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

            {/* Payment Method Selector */}
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
                  <span className="text-[10px] text-gray-500 block">Pay at Doorstep</span>
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
                  <span className="text-base font-extrabold text-pink-600 block mb-0.5">MFS</span>
                  <span className="text-xs block font-semibold">bKash / Nagad</span>
                  <span className="text-[10px] text-gray-500 block">Mobile Wallet</span>
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
                  <span className="text-[10px] text-gray-500 block">Visa, Mastercard</span>
                </button>
              </div>
            </div>

            {/* Simulated Card Form */}
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
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg font-mono text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">CVC Code</label>
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

            {/* Order Price Breakdown with 150 BDT Delivery Charge */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-mono">{formatBDT(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge (All Bangladesh)</span>
                <span className="font-mono font-semibold text-gray-900">{formatBDT(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount Due</span>
                <span className="font-mono text-blue-600 text-base">{formatBDT(cartTotal)}</span>
              </div>
            </div>

            {/* Action Buttons: Online Order & WhatsApp */}
            <div className="space-y-2.5 pt-1">
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
                    <span>Confirm Online Order ({formatBDT(cartTotal)})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer py-2 px-1"
                >
                  ← Edit Address
                </button>

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
                  {createdOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : createdOrder.paymentMethod === 'paypal' ? 'bKash / Nagad' : 'Card'}
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
