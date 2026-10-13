/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { AppNotification } from '../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  Truck,
  Star,
  Info,
  ExternalLink,
  X,
  Check,
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    setSelectedProductId,
    setViewMode,
    setDashboardTab,
    currentUser,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead;
    return true;
  });

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 45) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    // Direct action based on notification type
    if (notification.type === 'review_request' && notification.productId) {
      setSelectedProductId(notification.productId);
      setViewMode('product-detail');
      setIsOpen(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }

    if (notification.type === 'order_placed') {
      const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
      if (isStaff) {
        setDashboardTab('orders');
        setViewMode('dashboard');
      } else {
        setViewMode('orders');
      }
      setIsOpen(false);
      return;
    }

    if (notification.type === 'order_status') {
      setViewMode('orders');
      setIsOpen(false);
      return;
    }

    if (notification.productId) {
      setSelectedProductId(notification.productId);
      setViewMode('product-detail');
      setIsOpen(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'order_placed':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
        );
      case 'order_status':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        );
      case 'review_request':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 animate-pulse">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
          isOpen
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
        }`}
        title={`Notifications (${unreadNotificationsCount} unread)`}
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />

        {/* Unread Badge Counter */}
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in duration-200">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-gray-900 tracking-tight">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {unreadNotificationsCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsAsRead()}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] hidden sm:inline">Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllNotifications()}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer sm:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 bg-gray-50/70 border-b border-gray-100 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-blue-600 shadow-2xs border border-gray-200'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'unread'
                  ? 'bg-white text-blue-600 shadow-2xs border border-gray-200'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Unread ({unreadNotificationsCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-84 sm:max-h-96 overflow-y-auto divide-y divide-gray-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2.5">
                  <Bell className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-xs font-bold text-gray-700">No notifications</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {activeFilter === 'unread'
                    ? "You've read all your notifications!"
                    : "You're all caught up! Order updates and review alerts appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3.5 transition-colors flex items-start gap-3 cursor-pointer group hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  {getIconForType(notification.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4
                        className={`text-xs font-bold line-clamp-1 leading-snug ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Quick Action Button for Review Request */}
                    {notification.type === 'review_request' && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg group-hover:bg-amber-100 transition-colors">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Rate & Review Now →</span>
                        </span>
                      </div>
                    )}

                    {notification.type === 'order_status' && notification.orderId && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 group-hover:underline">
                          <span>View Order Details</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    )}

                    {notification.type === 'order_placed' && notification.orderId && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 group-hover:underline">
                          <span>Review & Process Order</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Mark read / Delete individual */}
                  <div className="flex flex-col items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationAsRead(notification.id);
                        }}
                        className="p-1 rounded-md text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
