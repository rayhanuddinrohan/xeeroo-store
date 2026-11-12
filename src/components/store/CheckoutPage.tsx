/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import { Order, ShippingAddress } from '../../types';
import { isValidBDPhone, getShippingZoneInfo } from '../../utils/shipping';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshDistricts';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Copy,
  Check,
  ShoppingBag,
  HelpCircle,
  Phone,
  Sparkles,
  ArrowRight,
  Send,
  UserCheck,
  LogIn,
  ChevronDown,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    currentUser,
    createOrder,
    openLoginModal,
    addToast,
    navigateToStore,
    navigateToOrders,
  } = useStore();

  // Step state: 'review' (Guest form + payment option) or 'payment' (bKash/Nagad gateway info for Advance)
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment'>('review');

  // Customer Form State (Mandatory: Name, Phone, Delivery Address; Optional: Email)
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || currentUser?.address?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Dhaka');
  const [selectedThana, setSelectedThana] = useState<string>('Uttara East');
  const [street, setStreet] = useState(currentUser?.address?.street || '');

  // Payment method: 'cod' (default for frictionless guest checkout) or 'advance' (with 50 TK discount)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'advance'>('cod');
  const [advanceGateway, setAdvanceGateway] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [senderNumber, setSenderNumber] = useState(currentUser?.phone || '');
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // Sync initial values if currentUser logs in or is present
  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.fullName || '');
      if (!phone) setPhone(currentUser.phone || currentUser.address?.phone || '');
      if (!email) setEmail(currentUser.email || '');
      if (currentUser.address?.street && !street) setStreet(currentUser.address.street);

      if (currentUser.address?.city || currentUser.address?.district) {
        const distName = currentUser.address.district || currentUser.address.city;
        const matched = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === distName.toLowerCase());
        if (matched) {
          setSelectedDistrict(matched.name);
          const thName = currentUser.address.thana || currentUser.address.state;
          if (thName && matched.thanas.includes(thName)) {
            setSelectedThana(thName);
          } else if (matched.thanas.length > 0) {
            setSelectedThana(matched.thanas[0]);
          }
        }
      }
    }
  }, [currentUser]);

  // Available Thanas for currently selected district
  const availableThanas = useMemo(() => {
    const matched = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());
    return matched ? matched.thanas : [];
  }, [selectedDistrict]);

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    const matched = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === districtName.toLowerCase());
    if (matched && matched.thanas.length > 0) {
      setSelectedThana(matched.thanas[0]);
    } else {
      setSelectedThana('');
    }
  };

  // Dynamic delivery charge based on selected location
  const shippingInfo = useMemo(() => {
    return getShippingZoneInfo(selectedDistrict, selectedThana);
  }, [selectedDistrict, selectedThana]);

  const deliveryCharge = shippingInfo.charge;
  const regularTotal = cartSubtotal + deliveryCharge;

  // 50 TK discount condition: applied ONLY for advance payment when customer is logged in or registers
  const isAdvanceSelected = paymentMethod === 'advance';
  const isEligibleForAdvanceDiscount = isAdvanceSelected && Boolean(currentUser);
  const advanceDiscount = isEligibleForAdvanceDiscount ? 50 : 0;
  const payableTotal = Math.max(0, regularTotal - advanceDiscount);

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

  // Select advance payment: if guest, prompt registration condition
  const handleSelectAdvancePayment = () => {
    setPaymentMethod('advance');
    if (!currentUser) {
      addToast(
        'Registration is required to claim the 50 TK advance payment discount. Please sign in or register, or select Cash on Delivery for instant guest checkout.',
        'info'
      );
    }
  };

  // Validation helper
  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      addToast('Please enter your full name.', 'warning');
      return false;
    }
    if (!phone.trim()) {
      addToast('Please enter your 11-digit mobile phone number.', 'warning');
      return false;
    }
    if (!isValidBDPhone(phone)) {
      addToast('Invalid phone number: Please provide an 11-digit Bangladeshi mobile number starting with 013-019 (e.g. 017XXXXXXXX).', 'error');
      return false;
    }
    if (!selectedDistrict) {
      addToast('Please select your delivery district.', 'warning');
      return false;
    }
    if (!selectedThana) {
      addToast('Please select your thana / upazila.', 'warning');
      return false;
    }
    if (!street.trim()) {
      addToast('Please enter your specific street address or area details.', 'warning');
      return false;
    }
    return true;
  };

  const handleProceedToAdvancePayment = () => {
    if (!validateForm()) return;

    if (!currentUser) {
      addToast(
        'Registration is required to claim the 50 TK advance payment discount. Please sign in or create an account, or select Cash on Delivery to checkout instantly as a Guest.',
        'warning'
      );
      openLoginModal();
      return;
    }

    setCheckoutStep('payment');
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    if (cart.length === 0) {
      addToast('Your cart is empty.', 'warning');
      return;
    }

    // Advance Payment Registration Condition Check
    if (paymentMethod === 'advance' && !currentUser) {
      addToast(
        'Registration is required to claim the 50 TK advance payment discount. Please log in or register before completing your order, or choose Cash on Delivery (COD) to checkout instantly as a Guest.',
        'warning'
      );
      openLoginModal();
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
      const shippingAddress: ShippingAddress = {
        fullName: fullName.trim(),
        street: street.trim(),
        city: selectedDistrict,
        state: selectedThana,
        district: selectedDistrict,
        thana: selectedThana,
        country: 'Bangladesh',
        phone: phone.trim(),
      };

      const paymentDetails =
        paymentMethod === 'advance'
          ? {
              gateway: advanceGateway,
              senderNumber: senderNumber.trim(),
              ...(advanceGateway === 'bkash' ? { bkashNumber: senderNumber.trim() } : {}),
              ...(advanceGateway === 'nagad' ? { nagadNumber: senderNumber.trim() } : {}),
              ...(advanceGateway === 'rocket' ? { rocketNumber: senderNumber.trim() } : {}),
              trxId: trxId.trim().toUpperCase(),
              advanceDiscount: 50,
            }
          : undefined;

      const order = await createOrder(
        shippingAddress,
        paymentMethod,
        email.trim() || undefined,
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

  const handleOrderViaWhatsApp = async () => {
    if (!validateForm() || isPlacingOrder) return;

    if (cart.length === 0) {
      addToast('Your cart is empty.', 'warning');
      return;
    }

    const cartItemsText = cart
      .map((item, idx) => {
        const variantParts = [
          item.selectedColor ? `Color: ${item.selectedColor}` : null,
          item.selectedSize ? `Size: ${item.selectedSize}` : null,
        ].filter(Boolean);
        const variantSuffix = variantParts.length > 0 ? ` [${variantParts.join(' | ')}]` : '';
        return `${idx + 1}. ${item.product.title}${variantSuffix} x ${item.quantity} = ${formatBDT(item.product.price * item.quantity)}`;
      })
      .join('\n');

    const gatewayName =
      advanceGateway === 'bkash' ? 'bKash' : advanceGateway === 'nagad' ? 'Nagad' : 'Rocket';

    const hasAdvanceCredentials =
      paymentMethod === 'advance' &&
      Boolean(currentUser) &&
      Boolean(senderNumber.trim()) &&
      Boolean(trxId.trim());

    const effectivePaymentMethod = hasAdvanceCredentials ? 'advance' : 'cod';
    const effectiveDiscount = hasAdvanceCredentials ? 50 : 0;
    const effectivePayableTotal = Math.max(0, regularTotal - effectiveDiscount);

    const paymentLabel = hasAdvanceCredentials
      ? `Full Advance Payment (${gatewayName}) [৳50 Discount Applied! Sender: ${senderNumber.trim()}, TrxID: ${trxId.trim().toUpperCase()}]`
      : 'Cash on Delivery (COD)';

    const discountLine =
      effectiveDiscount > 0
        ? `Advance Payment Discount: -${formatBDT(effectiveDiscount)} (Instant ৳50 Discount)\n`
        : '';

    const orderMsg = `Hello XEEROO! I would like to place an order:

📦 Ordered Products:
${cartItemsText}

Subtotal: ${formatBDT(cartSubtotal)}
Delivery Charge: ${formatBDT(deliveryCharge)} (${shippingInfo.label})
${discountLine}Total Payable: ${formatBDT(effectivePayableTotal)}

💳 Payment Method: ${paymentLabel}

📍 Customer Delivery Details:
Name: ${fullName.trim()}
Phone: ${phone.trim()}
${email.trim() ? `Email: ${email.trim()}\n` : ''}District: ${selectedDistrict}
Area / Thana: ${selectedThana}
Address: ${street.trim()}
Customer Type: ${currentUser ? 'Registered Member' : 'Guest Customer'}
Country: Bangladesh

Please confirm and dispatch my order. Thank you!`;

    setIsPlacingOrder(true);
    try {
      const shippingAddress: ShippingAddress = {
        fullName: fullName.trim(),
        street: street.trim(),
        city: selectedDistrict,
        state: selectedThana,
        district: selectedDistrict,
        thana: selectedThana,
        country: 'Bangladesh',
        phone: phone.trim(),
      };

      const paymentDetails = hasAdvanceCredentials
        ? {
            gateway: advanceGateway,
            senderNumber: senderNumber.trim(),
            ...(advanceGateway === 'bkash' ? { bkashNumber: senderNumber.trim() } : {}),
            ...(advanceGateway === 'nagad' ? { nagadNumber: senderNumber.trim() } : {}),
            ...(advanceGateway === 'rocket' ? { rocketNumber: senderNumber.trim() } : {}),
            trxId: trxId.trim().toUpperCase(),
            advanceDiscount: 50,
          }
        : undefined;

      const order = await createOrder(
        shippingAddress,
        effectivePaymentMethod,
        email.trim() || undefined,
        paymentDetails,
        effectiveDiscount
      );

      const waUrl = `https://wa.me/8801570243005?text=${encodeURIComponent(orderMsg)}`;
      window.open(waUrl, '_blank');

      if (order) {
        setOrderSuccess(order);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } catch (err: any) {
      addToast(err?.message || 'Failed to record WhatsApp order. Please try again.', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // SUCCESS RECEIPT VIEW
  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-6 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
              Order Confirmed & Saved to Database
            </span>
            {orderSuccess.isGuest && (
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
                Guest Checkout
              </span>
            )}
          </div>

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
                  {orderSuccess.paymentMethod === 'advance'
                    ? 'Advance Full Payment (50 TK Discount Applied)'
                    : orderSuccess.paymentMethod === 'cod'
                    ? 'Cash on Delivery (COD)'
                    : orderSuccess.paymentMethod}
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
                {orderSuccess.items.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between text-xs text-slate-300">
                    <span className="truncate max-w-[70%]">
                      • {item.productTitle}
                      {(item.selectedColor || item.selectedSize) && (
                        <span className="text-slate-400 text-[10px] ml-1">
                          ({[item.selectedColor && `Color: ${item.selectedColor}`, item.selectedSize && `Size: ${item.selectedSize}`].filter(Boolean).join(', ')})
                        </span>
                      )}
                      {' '}× {item.quantity}
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
            {currentUser && (
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
            )}

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
      {/* 1. TOP PROMINENT ADVANCE PAYMENT DISCOUNT BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden mb-6 border border-emerald-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight text-white drop-shadow-xs">
                  Get 50 TK discount for advance full payment (Registration Required)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-wide shadow-xs">
                  Save ৳50
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                অগ্রিম ফুল পেমেন্টে পাবেন ৫০ টাকা ডিসকাউন্ট (রেজিস্ট্রেশন বাধ্যতামূলক) • Cash on Delivery is 100% open for instant guest checkout!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {currentUser ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 text-white font-bold text-xs border border-white/30">
                <UserCheck className="w-4 h-4 text-emerald-300" />
                <span>Signed In ({currentUser.fullName.split(' ')[0]})</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-98"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>

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
              <span>Back to Checkout Form</span>
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
            {checkoutStep === 'payment' ? 'Advance Payment Gateway' : 'Guest & Express Checkout'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Guest Checkout badge */}
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg text-xs font-bold text-blue-700">
            <Truck className="w-3.5 h-3.5" />
            <span>{currentUser ? 'Member Checkout' : 'Guest Checkout (No Registration Required)'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Secure</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Steps */}
        <div className="lg:col-span-7 space-y-6">
          {checkoutStep === 'review' ? (
            /* STEP 1: GUEST CHECKOUT FORM + PAYMENT SELECTION */
            <>
              {/* SECTION 1: CUSTOMER SHIPPING DETAILS (Direct Form, No Mandatory Registration) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Delivery Information (ডেলিভারি তথ্য)
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        {currentUser ? 'Auto-filled from your profile' : 'Direct order without account registration'}
                      </p>
                    </div>
                  </div>

                  {!currentUser && (
                    <button
                      type="button"
                      onClick={openLoginModal}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Already have an account? Sign In
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Name and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Full Name (আপনার সম্পূর্ণ নাম) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Phone Number (মোবাইল নম্বর) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="017XXXXXXXX (11 digits)"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Email (Optional - not required) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-700">
                        Email Address (ইমেইল ঠিকানা)
                      </label>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Optional - not required (ঐচ্ছিক)
                      </span>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. customer@example.com (optional)"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  {/* District & Thana */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        District (জেলা) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedDistrict}
                          onChange={e => handleDistrictChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 appearance-none cursor-pointer"
                        >
                          {BANGLADESH_DISTRICTS.map(d => (
                            <option key={d.name} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Thana / Area (থানা / এলাকা) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedThana}
                          onChange={e => setSelectedThana(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 appearance-none cursor-pointer"
                        >
                          {availableThanas.map(th => (
                            <option key={th} value={th}>
                              {th}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Street / Detailed Address */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Full Delivery Address (বাসা/রোড/এলাকার বিস্তারিত ঠিকানা) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      placeholder="e.g. House #12, Road #4, Block #B, Sector #3"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 resize-none"
                    />
                  </div>

                  {/* Shipping Info Pill */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Delivery to <strong>{selectedDistrict}</strong> ({shippingInfo.label})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      Charge: {formatBDT(deliveryCharge)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PAYMENT METHOD & 50 TK ADVANCE DISCOUNT TOGGLE */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Payment Method (পেমেন্ট পদ্ধতি)
                      </h2>
                    </div>
                    {isEligibleForAdvanceDiscount && (
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
                  {/* Option 1: Cash on Delivery (COD) - 100% Guest Friendly */}
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
                        <span className="text-xs font-black text-gray-900">
                          Cash on Delivery (COD)
                        </span>
                      </div>
                      {paymentMethod === 'cod' && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>

                    <div className="mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                        Guest Checkout Friendly (No Sign Up)
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 leading-snug mb-1">
                      Pay with cash when the delivery agent hands over your package at your doorstep.
                    </p>

                    <span className="text-[10px] text-gray-500 font-medium block">
                      Total: {formatBDT(regularTotal)}
                    </span>
                  </button>

                  {/* Option 2: Advance Full Payment (Get 50 TK Discount) */}
                  <button
                    type="button"
                    id="btn-payment-advance"
                    onClick={handleSelectAdvancePayment}
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
                          Advance Full Payment
                        </span>
                      </div>
                      {paymentMethod === 'advance' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>

                    <div className="mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Registration Required for ৳50 Discount
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 leading-snug mb-2">
                      Pay in full in advance via bKash, Nagad, or Rocket and receive an instant <strong>৳50 discount</strong>.
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                      <span className="px-1.5 py-0.5 rounded bg-pink-100 text-[#D12053] font-bold">bKash</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-[#F7931E] font-bold">Nagad</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#8C3494] font-bold">Rocket</span>
                    </div>
                  </button>
                </div>

                {/* ADVANCE PAYMENT REGISTRATION CONDITION NOTICE (When Guest selects Advance) */}
                {paymentMethod === 'advance' && !currentUser && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-amber-900 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-amber-900">
                            Registration Required to Claim 50 TK Discount
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                            Notice
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          ৫০ টাকা অগ্রিম পেমেন্ট ডিসকাউন্ট পেতে <strong>রেজিস্ট্রেশন বাধ্যতামূলক</strong>। আপনি এক ক্লিকে সাইন ইন বা ফ্রি অ্যাকাউন্ট তৈরি করে ৫০ টাকা ছাড় নিতে পারেন, অথবা রেজিস্ট্রেশন ছাড়াই ক্যাশ অন ডেলিভারিতে সরাসরি অর্ডার সম্পন্ন করতে পারেন।
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={openLoginModal}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Sign In / Register to Get 50 TK Discount</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cod')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Switch to Cash on Delivery (Guest)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Method Summary Banner */}
                {paymentMethod === 'advance' && currentUser && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">Advance Payment Selected • ৳50 Discount Applied!</span>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        An instant ৳50 discount has been deducted from your total. Click <strong>&quot;Proceed to Payment Gateway&quot;</strong> to view our official bKash, Nagad, and Rocket numbers and submit your TrxID.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">Cash on Delivery Selected (Guest Friendly)</span>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        No advance payment needed. Pay <strong>{formatBDT(regularTotal)}</strong> in cash when the delivery person arrives at your doorstep with your authentic package.
                      </p>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-2 space-y-3">
                  {paymentMethod === 'advance' ? (
                    currentUser ? (
                      <button
                        id="btn-proceed-to-payment"
                        type="button"
                        onClick={handleProceedToAdvancePayment}
                        className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98"
                      >
                        <span>Proceed to Payment Gateway • {formatBDT(payableTotal)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openLoginModal}
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In / Register to Claim 50 TK Discount</span>
                      </button>
                    )
                  ) : (
                    <button
                      id="btn-confirm-order-cod"
                      type="button"
                      onClick={() => handlePlaceOrder()}
                      disabled={isPlacingOrder}
                      className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-98"
                    >
                      {isPlacingOrder ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving Order in Database...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Order (Cash on Delivery) • {formatBDT(regularTotal)}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOrderViaWhatsApp}
                    disabled={isPlacingOrder}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs transition-all cursor-pointer border border-[#25D366]/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Order via WhatsApp Desk ({formatBDT(payableTotal)})</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* STEP 2: DEDICATED PAYMENT GATEWAY FOR BKASH / NAGAD / ROCKET */
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
                    <span>Back to Checkout Form</span>
                  </button>
                  <h2 className="text-base font-black text-gray-900 tracking-tight">
                    Make Advance Payment (bKash / Nagad / Rocket)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Send money to complete your order with instant ৳50 discount
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block line-through">
                    Regular: {formatBDT(regularTotal)}
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
                    Open your <strong>{advanceGateway === 'bkash' ? 'bKash' : advanceGateway === 'nagad' ? 'Nagad' : 'Rocket'} App</strong> and choose <strong>Send Money</strong>.
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
                  onClick={() => handlePlaceOrder()}
                  disabled={isPlacingOrder}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-98"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying & Saving Order in Database...</span>
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
                  disabled={isPlacingOrder}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs transition-all cursor-pointer border border-[#25D366]/30 flex items-center justify-center gap-2 disabled:opacity-50"
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
              {cart.map((item, idx) => (
                <div key={`${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}-${idx}`} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.product.images[0] || ''}
                    alt={item.product.title}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                      }}
                      title={item.product.title}
                    >
                      {item.product.title}
                    </h4>
                    {(item.selectedColor || item.selectedSize) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.selectedColor && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                            Color: {item.selectedColor}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                            Size: {item.selectedSize}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-0.5">
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
                    {selectedDistrict} ({shippingInfo.label})
                  </span>
                </span>
                <span className="font-mono font-medium text-gray-900">{formatBDT(deliveryCharge)}</span>
              </div>

              {/* Advance Payment Discount Line */}
              {advanceDiscount > 0 && (
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
                  {advanceDiscount > 0 && (
                    <del className="text-xs text-gray-400 font-normal font-mono block">
                      {formatBDT(regularTotal)}
                    </del>
                  )}
                  <span className={`font-mono text-base ${advanceDiscount > 0 ? 'text-emerald-700' : 'text-blue-600'}`}>
                    {formatBDT(payableTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Guarantees */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Official Genuine Products Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Express Courier Dispatch across Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Cloud Synced Database Security & Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
