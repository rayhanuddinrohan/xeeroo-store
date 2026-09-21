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
} from 'lucide-react';

export const OrderManagementTab: React.FC = () => {
  const { orders, updateOrderStatus, canUpdateOrderStatus, addToast } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
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

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>Total Records: <strong className="text-gray-900">{filteredOrders.length}</strong></span>
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
    </div>
  );
};
