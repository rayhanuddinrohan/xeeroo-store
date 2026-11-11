/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  Bot,
  RefreshCw,
} from 'lucide-react';
import { TelegramSettingsModal } from './TelegramSettingsModal';
import { getStoredTelegramConfig } from '../../utils/telegram';

export const OrderManagementTab: React.FC = () => {
  const { orders, updateOrderStatus, canUpdateOrderStatus, refreshOrdersFromFirestore, addToast } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'guest' | 'registered'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Telegram Order Alerts Modal State
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramConfig, setTelegramConfig] = useState(getStoredTelegramConfig());

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

      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Unexpected response received from server. Please try again.');
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || data.message || `HTTP ${res.status}: Failed to submit order to Business Koro.`);
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
        await updateOrderStatus(bkModalOrder.id, 'processing');
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
      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Unexpected response from server. Please try again.');
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || data.message || `Failed to fetch status for order #${statusOrderIdInput}`);
      }

      setCheckedStatusResult(data);
    } catch (err: any) {
      setCheckedStatusError(err.message || 'Failed to check order status.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Helper to accurately identify pending orders (case-insensitive, default fallback)
  const isPendingStatus = (status?: string | null): boolean => {
    if (!status) return true;
    const s = String(status).toLowerCase().trim();
    return s === 'pending';
  };

  // Status counts for admin oversight
  const pendingOrdersCount = orders.filter(o => isPendingStatus(o.status)).length;
  const processingOrdersCount = orders.filter(o => (o.status || '').toLowerCase().trim() === 'processing').length;
  const shippedOrdersCount = orders.filter(o => (o.status || '').toLowerCase().trim() === 'shipped').length;
  const deliveredOrdersCount = orders.filter(o => (o.status || '').toLowerCase().trim() === 'delivered').length;
  const cancelledOrdersCount = orders.filter(o => (o.status || '').toLowerCase().trim() === 'cancelled').length;

  // Track customer order history (1st, 2nd, 3rd order detection) across phone, email, and userId
  const customerOrderHistory = useMemo(() => {
    const counts = new Map<string, number>();
    const ordersByCustomer = new Map<string, Order[]>();

    // Sort chronologically ascending to compute correct order sequence
    const chronological = [...orders].sort(
      (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

    chronological.forEach(o => {
      const phone = (o.shippingAddress?.phone || '').replace(/[^0-9]/g, '');
      const email = (o.userEmail || '').trim().toLowerCase();
      const uid = o.userId && o.userId !== 'guest' ? o.userId : null;
      const key = phone || email || uid || o.id;

      counts.set(key, (counts.get(key) || 0) + 1);
      const list = ordersByCustomer.get(key) || [];
      list.push(o);
      ordersByCustomer.set(key, list);
    });

    return { counts, ordersByCustomer };
  }, [orders]);

  const getCustomerOrderInfo = (order: Order) => {
    const phone = (order.shippingAddress?.phone || '').replace(/[^0-9]/g, '');
    const email = (order.userEmail || '').trim().toLowerCase();
    const uid = order.userId && order.userId !== 'guest' ? order.userId : null;
    const key = phone || email || uid || order.id;

    const totalOrders = customerOrderHistory.counts.get(key) || 1;
    const orderList = customerOrderHistory.ordersByCustomer.get(key) || [];
    const orderIndex = orderList.findIndex(o => o.id === order.id) + 1;

    return {
      totalOrders,
      orderIndex: orderIndex > 0 ? orderIndex : totalOrders,
      isRepeatCustomer: totalOrders > 1,
    };
  };

  // Strictly enforce that ALL matching orders (1st, 2nd, 3rd repeat, guest, or registered) are included
  // and sorted chronologically (newest first) without filtering out unique users or repeat customers!
  const filteredOrders = [...orders]
    .filter(o => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesEmail = (o.userEmail || '').toLowerCase().includes(q);
        const matchesName = (o.shippingAddress?.fullName || '').toLowerCase().includes(q);
        const matchesPhone = (o.shippingAddress?.phone || '').includes(q);
        if (!matchesId && !matchesEmail && !matchesName && !matchesPhone) return false;
      }
      if (statusFilter === 'pending') {
        if (!isPendingStatus(o.status)) return false;
      } else if (statusFilter !== 'all') {
        if ((o.status || '').toLowerCase().trim() !== statusFilter.toLowerCase().trim()) return false;
      }
      if (customerTypeFilter === 'guest' && !(o.isGuest || o.userId === 'guest')) return false;
      if (customerTypeFilter === 'registered' && (o.isGuest || o.userId === 'guest')) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await refreshOrdersFromFirestore();
      addToast(`Cloud Firestore orders refreshed (${refreshed.length} total)`, 'success');
    } catch {
      addToast('Could not refresh orders from database.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!canUpdateOrderStatus) {
      addToast('RBAC Access Denied: You do not have permission to modify order statuses.', 'error');
      return;
    }
    await updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="space-y-4">
      {/* Quick Status Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-200">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-gray-700 hover:bg-white hover:text-gray-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Orders</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'
            }`}
          >
            {pendingOrdersCount}
          </span>
          {pendingOrdersCount > 0 && statusFilter !== 'pending' && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-700 hover:bg-white hover:text-gray-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>All Orders</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              statusFilter === 'all' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('processing')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            statusFilter === 'processing'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'text-gray-700 hover:bg-white hover:text-gray-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Processing</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              statusFilter === 'processing' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-800'
            }`}
          >
            {processingOrdersCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('shipped')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            statusFilter === 'shipped'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-gray-700 hover:bg-white hover:text-gray-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Shipped</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              statusFilter === 'shipped' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}
          >
            {shippedOrdersCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('delivered')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            statusFilter === 'delivered'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-gray-700 hover:bg-white hover:text-gray-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Delivered</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              statusFilter === 'delivered' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {deliveredOrdersCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            statusFilter === 'cancelled'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'text-gray-700 hover:bg-white hover:text-gray-900'
          }`}
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancelled</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              statusFilter === 'cancelled' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {cancelledOrdersCount}
          </span>
        </button>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, name, phone, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={customerTypeFilter}
            onChange={e => setCustomerTypeFilter(e.target.value as any)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Customer Types</option>
            <option value="guest">Guest Orders</option>
            <option value="registered">Registered Members</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Telegram Order Alerts Button */}
          <button
            type="button"
            onClick={() => setIsTelegramModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              telegramConfig.enabled && telegramConfig.botToken
                ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
            }`}
            title="Configure Telegram Bot to receive instant notifications on new orders"
          >
            <Bot className="w-3.5 h-3.5 text-sky-200" />
            <span>Telegram Bot Alerts</span>
            {telegramConfig.enabled && telegramConfig.botToken ? (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" title="Active"></span>
            ) : (
              <span className="px-1.5 py-0.2 bg-sky-200/60 rounded text-[10px] font-normal text-sky-900">Setup</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
            title="Fetch all live orders from Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live DB'}</span>
          </button>

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
                  const custInfo = getCustomerOrderInfo(order);

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50/60 transition-colors">
                        {/* Order ID */}
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          #{order.id}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-gray-900 block truncate max-w-[180px]">
                              {order.shippingAddress.fullName}
                            </span>
                            {order.isGuest || order.userId === 'guest' ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                Guest
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                Member
                              </span>
                            )}
                            {custInfo.isRepeatCustomer && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5"
                                title={`Returning customer with ${custInfo.totalOrders} total orders! This order is #${custInfo.orderIndex}.`}
                              >
                                <span>Repeat (#{custInfo.orderIndex})</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono mt-0.5">
                            <span>{order.shippingAddress.phone}</span>
                            {order.userEmail ? (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="truncate max-w-[120px] text-gray-400">{order.userEmail}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-400 italic">No email</span>
                              </>
                            )}
                          </div>
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
                            value={(order.status || 'pending').toLowerCase()}
                            onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md border focus:outline-none transition-colors cursor-pointer ${
                              (order.status || 'pending').toLowerCase() === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : (order.status || 'pending').toLowerCase() === 'shipped'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : (order.status || 'pending').toLowerCase() === 'processing'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : (order.status || 'pending').toLowerCase() === 'cancelled'
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
                                        {(item.selectedColor || item.selectedSize) && (
                                          <div className="flex flex-wrap items-center gap-1.5 my-0.5">
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
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[10px] font-bold uppercase text-gray-500">Account Type:</span>
                                    {order.isGuest || order.userId === 'guest' ? (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Guest Checkout (No registration required)</span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700">Registered Customer ({order.userId})</span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 leading-relaxed mb-2">
                                    <strong>Deliver to:</strong> {order.shippingAddress.fullName}
                                    <br />
                                    {order.shippingAddress.street}, {order.shippingAddress.thana || order.shippingAddress.state}, {order.shippingAddress.district || order.shippingAddress.city}
                                    <br />
                                    Phone: <span className="font-mono text-gray-900 font-semibold">{order.shippingAddress.phone}</span>
                                    {order.userEmail && (
                                      <>
                                        <br />
                                        Email: <span className="font-mono text-gray-900">{order.userEmail}</span>
                                      </>
                                    )}
                                  </p>
                                <p className="text-gray-600">
                                  Payment Method:{' '}
                                  {order.paymentMethod === 'advance' ? (
                                    <strong className="text-emerald-700 font-bold uppercase font-mono">
                                      Full Advance ({order.paymentDetails?.gateway === 'rocket' ? 'Rocket' : order.paymentDetails?.gateway === 'nagad' ? 'Nagad' : 'bKash'})
                                      {order.discountAmount ? ' [৳50 OFF]' : ''}
                                    </strong>
                                  ) : (
                                    <strong className={`uppercase font-mono ${order.paymentMethod === 'bkash' ? 'text-[#D12053]' : order.paymentMethod === 'nagad' ? 'text-[#F7931E]' : order.paymentMethod === 'rocket' ? 'text-[#8C3494]' : ''}`}>
                                      {order.paymentMethod === 'bkash' ? 'bKash (MFS)' : order.paymentMethod === 'nagad' ? 'Nagad (MFS)' : order.paymentMethod === 'rocket' ? 'Rocket (MFS)' : order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                                    </strong>
                                  )}
                                  {order.paymentDetails?.trxId && (
                                    <span className="block mt-1 text-[11px] font-mono text-gray-800 bg-slate-100 p-1.5 rounded border border-gray-300">
                                      Wallet:{' '}
                                      <strong className={order.paymentDetails.gateway === 'rocket' ? 'text-[#8C3494]' : order.paymentDetails.gateway === 'nagad' ? 'text-[#F7931E]' : 'text-[#D12053]'}>
                                        {order.paymentDetails.gateway === 'rocket' ? 'Rocket' : order.paymentDetails.gateway === 'nagad' ? 'Nagad' : 'bKash'}
                                      </strong>{' '}
                                      | TrxID: <strong>{order.paymentDetails.trxId}</strong>
                                      {(order.paymentDetails.senderNumber || order.paymentDetails.bkashNumber || order.paymentDetails.nagadNumber || order.paymentDetails.rocketNumber) &&
                                        ` | Sender: ${order.paymentDetails.senderNumber || order.paymentDetails.bkashNumber || order.paymentDetails.nagadNumber || order.paymentDetails.rocketNumber}`}
                                    </span>
                                  )}
                                </p>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                  <span className="text-[11px] text-gray-500 font-medium">
                                    Dropshipping Fulfillment:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenBkModal(order)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Forward to Business Koro</span>
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
                Submit Order to Business Koro
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
                    Original Product ID assigned in Business Koro catalog.
                  </p>
                </div>

                {/* Customer Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Customer Name *
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
                      Customer Phone *
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
                    Customer Full Address *
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
                    Selling Price (BDT ৳) *
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
                    Reseller selling price charged to customer.
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
                      Customer pays delivery charge (deliveryChargePaidByCustomer: {bkDeliveryPaidByCust ? 'true' : 'false'})
                    </span>
                  </label>
                  <p className="text-[11px] text-gray-500 pl-6">
                    When true, customer pays at delivery; when false, reseller absorbs the delivery charge.
                  </p>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={bkDeliveryUpfront}
                      onChange={e => setBkDeliveryUpfront(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">
                      Customer paid delivery charge upfront (CUSTOMER_PAID_RESELLER_UPFRONT)
                    </span>
                  </label>
                </div>

                {/* Note */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Customer Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={bkCustomerNote}
                    onChange={e => setBkCustomerNote(e.target.value)}
                    placeholder="Special instructions or size/color variant..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setBkModalOrder(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBk}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSubmittingBk ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting order...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Order (Send to BK)</span>
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
                <span>Check Business Koro Order Status</span>
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
                      placeholder="Enter Order ID (e.g. 64f1a2b...)"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-600 bg-white text-gray-900"
                    />
                    <button
                      type="submit"
                      disabled={isCheckingStatus}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {isCheckingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Check</span>
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
                    <span className="font-bold text-gray-800">Live Order Status:</span>
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

      {/* Telegram Order Alerts Settings Modal */}
      <TelegramSettingsModal
        isOpen={isTelegramModalOpen}
        onClose={() => {
          setIsTelegramModalOpen(false);
          setTelegramConfig(getStoredTelegramConfig());
        }}
      />
    </div>
  );
};
