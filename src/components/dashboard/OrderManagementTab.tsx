/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { formatBDT } from '../../utils/currency';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Send,
  ExternalLink,
  Loader2,
  ShoppingBag,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';

export const OrderManagementTab: React.FC = () => {
  const { orders, updateOrderStatus, canUpdateOrderStatus, addToast } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Business Koro Forward Order States
  const [bkModalOrder, setBkModalOrder] = useState<Order | null>(null);
  const [bkProductId, setBkProductId] = useState('');
  const [bkCustomerName, setBkCustomerName] = useState('');
  const [bkCustomerPhone, setBkCustomerPhone] = useState('');
  const [bkCustomerAddress, setBkCustomerAddress] = useState('');
  const [bkCustomerDivision, setBkCustomerDivision] = useState('Dhaka');
  const [bkCustomerDistrict, setBkCustomerDistrict] = useState('Dhaka');
  const [bkCustomerArea, setBkCustomerArea] = useState('Mirpur');
  const [bkSellingPrice, setBkSellingPrice] = useState<number>(0);
  const [bkDeliveryPaidByCust, setBkDeliveryPaidByCust] = useState(true);
  const [bkDeliveryUpfront, setBkDeliveryUpfront] = useState(false);
  const [bkCustomerNote, setBkCustomerNote] = useState('');
  const [isSubmittingBk, setIsSubmittingBk] = useState(false);
  const [bkSubmitResult, setBkSubmitResult] = useState<{ success: boolean; message: string; orderId?: string } | null>(null);

  // Business Koro Status Check States
  const [isCheckStatusModalOpen, setIsCheckStatusModalOpen] = useState(false);
  const [statusOrderIdInput, setStatusOrderIdInput] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [checkedStatusResult, setCheckedStatusResult] = useState<any | null>(null);
  const [checkedStatusError, setCheckedStatusError] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const handleOpenBkModal = (order: Order) => {
    const firstItem = order.items[0];
    setBkModalOrder(order);
    setBkProductId(firstItem?.productId || firstItem?.sku || '');
    setBkCustomerName(order.shippingAddress.fullName);
    setBkCustomerPhone(order.shippingAddress.phone || '');
    setBkCustomerAddress(
      `${order.shippingAddress.street ? order.shippingAddress.street + ', ' : ''}${order.shippingAddress.city}`
    );
    setBkCustomerDivision(order.shippingAddress.state || 'Dhaka');
    setBkCustomerDistrict(order.shippingAddress.city || 'Dhaka');
    setBkCustomerArea('Mirpur');
    setBkSellingPrice(firstItem ? firstItem.unitPrice : order.totalAmount);
    setBkDeliveryPaidByCust(true);
    setBkDeliveryUpfront(false);
    setBkCustomerNote(`XEEROO Order #${order.id}`);
    setBkSubmitResult(null);
  };

  const handleSubmitToBusinessKoro = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiKey = localStorage.getItem('bk_api_key') || '';
    const origin = localStorage.getItem('bk_origin') || '';

    if (!apiKey.trim()) {
      addToast('Business Koro API Key is missing. Please go to Product Importer tab and enter your x-api-key first.', 'error');
      return;
    }

    if (!bkProductId.trim()) {
      addToast('Product ID is required.', 'error');
      return;
    }

    setIsSubmittingBk(true);
    setBkSubmitResult(null);

    const payload = {
      apiKey: apiKey.trim(),
      origin: origin.trim(),
      productId: bkProductId.trim(),
      customerName: bkCustomerName.trim(),
      customerPhone: bkCustomerPhone.trim(),
      customerAddress: bkCustomerAddress.trim(),
      customerDivision: bkCustomerDivision.trim(),
      customerDistrict: bkCustomerDistrict.trim(),
      customerArea: bkCustomerArea.trim(),
      sellingPrice: Number(bkSellingPrice),
      deliveryChargePaidByCustomer: Boolean(bkDeliveryPaidByCust),
      customerNote: bkCustomerNote.trim(),
      ...(bkDeliveryUpfront ? { deliveryChargeCollectionMode: 'CUSTOMER_PAID_RESELLER_UPFRONT' } : {}),
    };

    try {
      const res = await fetch('/api/businesskoro/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to submit order to Business Koro.`);
      }

      const returnedOrderId = data.id || data.orderId || data.data?.id || `BK-ORD-${Date.now().toString().slice(-6)}`;
      setBkSubmitResult({
        success: true,
        message: 'Order successfully transmitted to Business Koro dropshipping fulfillment!',
        orderId: returnedOrderId,
      });

      addToast(`Order forwarded to Business Koro! BK Order ID: #${returnedOrderId}`, 'success');
      // Optionally mark local order as processing
      if (bkModalOrder) {
        updateOrderStatus(bkModalOrder.id, 'processing');
      }
    } catch (err: any) {
      setBkSubmitResult({
        success: false,
        message: err.message || 'Failed to send order to Business Koro.',
      });
      addToast(err.message || 'Business Koro dispatch error', 'error');
    } finally {
      setIsSubmittingBk(false);
    }
  };

  const handleCheckBkOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusOrderIdInput.trim()) {
      setCheckedStatusError('Please enter a valid Business Koro Order ID.');
      return;
    }

    const apiKey = localStorage.getItem('bk_api_key') || '';
    const origin = localStorage.getItem('bk_origin') || '';

    if (!apiKey) {
      setCheckedStatusError('Business Koro API key not found. Please set your API key in the Product Importer tab.');
      return;
    }

    setIsCheckingStatus(true);
    setCheckedStatusError(null);
    setCheckedStatusResult(null);

    try {
      const q = new URLSearchParams();
      q.set('apiKey', apiKey.trim());
      q.set('orderId', statusOrderIdInput.trim());
      if (origin.trim()) q.set('origin', origin.trim());

      const res = await fetch(`/api/businesskoro/order-status?${q.toString()}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to fetch status for order #${statusOrderIdInput}`);
      }

      setCheckedStatusResult(data);
    } catch (err: any) {
      setCheckedStatusError(err.message || 'Failed to check order status.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesId = o.id.toLowerCase().includes(q);
      const matchesEmail = o.userEmail.toLowerCase().includes(q);
      const matchesName = o.shippingAddress.fullName.toLowerCase().includes(q);
      if (!matchesId && !matchesEmail && !matchesName) return false;
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (!canUpdateOrderStatus) {
      addToast('RBAC Access Denied: You do not have permission to modify order statuses.', 'error');
      return;
    }
    updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsCheckStatusModalOpen(true);
              setCheckedStatusResult(null);
              setCheckedStatusError(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check BK Order Status</span>
          </button>
          <div className="text-xs text-gray-500">
            <span>Total Records: <strong className="text-gray-900">{filteredOrders.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Order</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Order Date</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Status Lifecycle</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No orders match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50/60 transition-colors">
                        {/* Order ID */}
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          #{order.id}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900 block truncate max-w-xs">
                            {order.shippingAddress.fullName}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {order.userEmail}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 font-extrabold text-gray-900 font-mono">
                          {formatBDT(order.totalAmount)}
                        </td>

                        {/* Status Dropdown (Moderator & Admin can change!) */}
                        <td className="py-3 px-4">
                          <select
                            id={`select-status-${order.id}`}
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md border focus:outline-none transition-colors cursor-pointer ${
                              order.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : order.status === 'shipped'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : order.status === 'processing'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : order.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Detail toggler */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Items */}
                              <div className="bg-white p-3.5 rounded-lg border border-gray-200">
                                <h5 className="font-bold text-gray-900 mb-2">Order Line Items</h5>
                                <div className="space-y-1.5">
                                  {order.items.map(item => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0"
                                    >
                                      <div>
                                        <span className="font-semibold text-gray-800 block">
                                          {item.productTitle}
                                        </span>
                                        <span className="text-[11px] text-gray-400 font-mono">
                                          Qty {item.quantity} × {formatBDT(item.unitPrice)}
                                        </span>
                                      </div>
                                      <span className="font-bold text-gray-900 font-mono">
                                        {formatBDT(item.quantity * item.unitPrice)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Shipping & Payment details */}
                              <div className="bg-white p-3.5 rounded-lg border border-gray-200">
                                <h5 className="font-bold text-gray-900 mb-2">Shipping & Payment Audit</h5>
                                <p className="text-gray-600 leading-relaxed mb-2">
                                  <strong>Deliver to:</strong> {order.shippingAddress.fullName}
                                  <br />
                                  {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                  <br />
                                  Phone: {order.shippingAddress.phone}
                                </p>
                                <p className="text-gray-600">
                                  Payment Method: <strong className="uppercase">{order.paymentMethod}</strong>
                                </p>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                  <span className="text-[11px] text-gray-500 font-medium">
                                    ডেলিভারি ও ড্রপশিপিং:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenBkModal(order)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Business Koro-তে অর্ডার পাঠান</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Forward Order to Business Koro */}
      {bkModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div
            className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-950 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setBkModalOrder(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                  BK STOREFRONT API
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Order #{bkModalOrder.id}
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                Business Koro-তে অর্ডার সাবমিট করুন
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                POST https://api.businesskoro.com/api/v1/storefront/orders
              </p>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {bkSubmitResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    bkSubmitResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {bkSubmitResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{bkSubmitResult.message}</span>
                  </div>
                  {bkSubmitResult.orderId && (
                    <p className="font-mono text-xs mt-1">
                      Business Koro Order ID: <strong>#{bkSubmitResult.orderId}</strong>
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmitToBusinessKoro} className="space-y-4">
                {/* Product ID */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Product ID (Business Koro Product ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bkProductId}
                    onChange={e => setBkProductId(e.target.value)}
                    placeholder="e.g. 64f1a2b3c4..."
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    অর্ডার লাইনে থাকা প্রোডাক্টের আইডি।
                  </p>
                </div>

                {/* Customer Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Customer Name (কাস্টমারের নাম) *
                    </label>
                    <input
                      type="text"
                      required
                      value={bkCustomerName}
                      onChange={e => setBkCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Customer Phone (কাস্টমার মোবাইল) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={bkCustomerPhone}
                      onChange={e => setBkCustomerPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Customer Address */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Customer Address (সম্পূর্ণ ঠিকানা) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={bkCustomerAddress}
                    onChange={e => setBkCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                  />
                </div>

                {/* Division, District, Area */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Division *
                    </label>
                    <select
                      value={bkCustomerDivision}
                      onChange={e => setBkCustomerDivision(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                    >
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Barishal">Barishal</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Rangpur">Rangpur</option>
                      <option value="Mymensingh">Mymensingh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      value={bkCustomerDistrict}
                      onChange={e => setBkCustomerDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={bkCustomerArea}
                      onChange={e => setBkCustomerArea(e.target.value)}
                      placeholder="e.g. Mirpur, Uttara"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Selling Price (বিক্রয় মূল্য ৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={bkSellingPrice}
                    onChange={e => setBkSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    আপনি যে দামে বিক্রি করেছেন সেটাই পাঠাবেন। ঠিক ওই দামেই অর্ডারটি Business Koro-তে বসবে। দাম প্রোডাক্ট কস্টের চেয়ে বেশি হতে হবে।
                  </p>
                </div>

                {/* Delivery Flags */}
                <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bkDeliveryPaidByCust}
                      onChange={e => setBkDeliveryPaidByCust(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">
                      কাস্টমার ডেলিভারি চার্জ দেবে (deliveryChargePaidByCustomer: {bkDeliveryPaidByCust ? 'true' : 'false'})
                    </span>
                  </label>
                  <p className="text-[11px] text-gray-500 pl-6">
                    true হলে ডেলিভারির সময় কাস্টমার দেবে, false হলে আপনি বহন করবেন।
                  </p>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={bkDeliveryUpfront}
                      onChange={e => setBkDeliveryUpfront(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">
                      কাস্টমার আগেই ডেলিভারি চার্জ দিয়ে দিয়েছে (CUSTOMER_PAID_RESELLER_UPFRONT)
                    </span>
                  </label>
                </div>

                {/* Note */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Customer Note (যদি থাকে)
                  </label>
                  <input
                    type="text"
                    value={bkCustomerNote}
                    onChange={e => setBkCustomerNote(e.target.value)}
                    placeholder="বিশেষ কোনো নির্দেশ বা সাইজ/কালার থাকলে..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setBkModalOrder(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBk}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSubmittingBk ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>অর্ডার পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>অর্ডার সাবমিট করুন (Send to BK)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Check Business Koro Order Status */}
      {isCheckStatusModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div
            className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-950 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setIsCheckStatusModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Business Koro অর্ডারের অবস্থা দেখুন</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                GET https://api.businesskoro.com/api/v1/storefront/orders/&#123;orderId&#125;
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <form onSubmit={handleCheckBkOrderStatus} className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Business Koro Order ID *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={statusOrderIdInput}
                      onChange={e => setStatusOrderIdInput(e.target.value)}
                      placeholder="অর্ডার আইডি দিন (e.g. 64f1a2b...)"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                    />
                    <button
                      type="submit"
                      disabled={isCheckingStatus}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {isCheckingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>চেক করুন</span>
                    </button>
                  </div>
                </div>
              </form>

              {checkedStatusError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{checkedStatusError}</span>
                </div>
              )}

              {checkedStatusResult && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="font-bold text-gray-800">অর্ডারের লাইভ তথ্য:</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                      {checkedStatusResult.status || checkedStatusResult.data?.status || 'Active'}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono bg-slate-950 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-48 border border-slate-800">
                    {JSON.stringify(checkedStatusResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
