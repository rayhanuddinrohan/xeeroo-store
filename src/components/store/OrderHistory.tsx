/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { OrderStatus } from '../../types';
import { formatBDT } from '../../utils/currency';
import {
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  Shield,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const OrderHistory: React.FC = () => {
  const { userOrders, currentUser, setViewMode, setDashboardTab, canUpdateOrderStatus, openLoginModal } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Please Sign In</h2>
          <p className="text-xs text-gray-500 mb-6">
            Sign in to your XEEROO customer account to view your past orders and tracking.
          </p>
          <button
            onClick={openLoginModal}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Truck className="w-3.5 h-3.5" />
            <span>Shipped</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Processing</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Order History & Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Displaying orders for <strong className="text-gray-900">{currentUser.fullName}</strong> ({currentUser.email})
          </p>
        </div>

        {canUpdateOrderStatus && (
          <button
            onClick={() => {
              setDashboardTab('orders');
              setViewMode('dashboard');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>XEEROO Admin Order Fulfillment</span>
          </button>
        )}
      </div>

      {userOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No orders placed yet</h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Browse the XEEROO catalog to test the checkout and dispatch flow.
          </p>
          <button
            onClick={() => setViewMode('store')}
            className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map(order => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:border-gray-300 transition-all"
              >
                {/* Summary Row */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900">
                          #{order.id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{order.items.reduce((acc, i) => acc + i.quantity, 0)} items</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[11px] text-gray-400 block font-medium uppercase">
                        Total Amount
                      </span>
                      <span className="text-base font-extrabold text-gray-900 font-mono">
                        {formatBDT(order.totalAmount)}
                      </span>
                    </div>

                    <div className="text-gray-400 hover:text-gray-600 p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Order Details */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 border-t border-gray-100 bg-white space-y-6">
                    {/* Status Progress Timeline */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Fulfillment Progress
                      </h4>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div
                          className={`p-2 rounded-lg border ${
                            ['pending', 'processing', 'shipped', 'delivered'].includes(order.status)
                              ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}
                        >
                          1. Pending
                        </div>
                        <div
                          className={`p-2 rounded-lg border ${
                            ['processing', 'shipped', 'delivered'].includes(order.status)
                              ? 'bg-purple-50 border-purple-200 text-purple-900 font-semibold'
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}
                        >
                          2. Processing
                        </div>
                        <div
                          className={`p-2 rounded-lg border ${
                            ['shipped', 'delivered'].includes(order.status)
                              ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}
                        >
                          3. Shipped
                        </div>
                        <div
                          className={`p-2 rounded-lg border ${
                            order.status === 'delivered'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}
                        >
                          4. Delivered
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Items in this Order
                      </h4>
                      <div className="space-y-2">
                        {order.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                          >
                            <div className="flex items-center gap-3">
                              {item.productImage && (
                                <img
                                  src={item.productImage}
                                  alt={item.productTitle}
                                  className="w-12 h-12 rounded object-cover bg-gray-200"
                                />
                              )}
                              <div>
                                <span className="text-xs font-bold text-gray-900 block">
                                  {item.productTitle}
                                </span>
                                <span className="text-[11px] text-gray-500 font-mono">
                                  Qty: {item.quantity} × {formatBDT(item.unitPrice)}
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-bold text-gray-900 font-mono">
                              {formatBDT(item.quantity * item.unitPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping & Payment summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div>
                        <span className="font-semibold text-gray-900 block mb-1">
                          Delivery Destination
                        </span>
                        <p className="text-gray-600 leading-relaxed">
                          {order.shippingAddress.fullName}
                          <br />
                          {order.shippingAddress.street}
                          <br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                          <br />
                          {order.shippingAddress.country}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-900 block mb-1">
                          Payment & Billing
                        </span>
                        <p className="text-gray-600 leading-relaxed">
                          Method: <strong className="uppercase">{order.paymentMethod}</strong>
                          <br />
                          Status: <span className="text-emerald-600 font-medium">Authorized & Verified</span>
                          <br />
                          Recipient Phone: {order.shippingAddress.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
