/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Users,
  Package,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export const AnalyticsTab: React.FC = () => {
  const { orders, products, users, categories } = useStore();

  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, o) => (o.status !== 'cancelled' ? acc + o.totalAmount : acc), 0);
  }, [orders]);

  const totalOrdersCount = orders.length;

  const averageOrderValue = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    if (validOrders.length === 0) return 0;
    return totalRevenue / validOrders.length;
  }, [orders, totalRevenue]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stockQuantity <= 5);
  }, [products]);

  // Chart data: revenue aggregated by day or order sequence
  const revenueChartData = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let runningTotal = 0;
    return sorted.map((o, idx) => {
      runningTotal += o.totalAmount;
      return {
        date: new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        orderAmount: o.totalAmount,
        cumulativeRevenue: Math.round(runningTotal),
        orderId: `#${o.id}`,
      };
    });
  }, [orders]);

  // Category breakdown data
  const categoryChartData = useMemo(() => {
    return categories.map(cat => {
      const catProducts = products.filter(p => p.categoryId === cat.id);
      const totalInventory = catProducts.reduce((sum, p) => sum + p.stockQuantity, 0);
      const totalValue = catProducts.reduce((sum, p) => sum + p.price * p.stockQuantity, 0);
      return {
        name: cat.name.split(' ')[0], // short name
        fullName: cat.name,
        count: catProducts.length,
        stock: totalInventory,
        valuation: Math.round(totalValue),
      };
    });
  }, [categories, products]);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 font-mono">
            {formatBDT(totalRevenue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live verified orders
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{totalOrdersCount}</div>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Across {users.filter(u => u.role === 'customer').length} registered customers
          </span>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Order (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 font-mono">
            {formatBDT(averageOrderValue)}
          </div>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block">
            High-ticket electronics basket
          </span>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {lowStockProducts.length}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            {lowStockProducts.length === 0 ? 'All levels healthy' : 'Items with ≤ 5 units in stock'}
          </span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Revenue Growth Trend</h3>
              <p className="text-xs text-gray-500">Cumulative sales across checkout events</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              USD ($)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${v}`} />
                <Tooltip
                  formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cumulativeRevenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Inventory Breakdown (1 col) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Catalog Valuation by Category</h3>
            <p className="text-xs text-gray-500 mb-4">Total retail inventory value per department</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'Inventory Value']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="valuation" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Total Categories: {categories.length}</span>
            <span className="font-semibold text-gray-900">{products.length} Products</span>
          </div>
        </div>
      </div>

      {/* Critical Inventory Watch Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Low Inventory Watchlist</h3>
            <p className="text-xs text-gray-500">Stock thresholds requiring restocking attention</p>
          </div>
          <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
            Threshold: ≤ 5 units
          </span>
        </div>

        {lowStockProducts.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">All warehouse inventories are currently above minimum threshold.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Product Title</th>
                  <th className="py-2.5 px-3 font-semibold">SKU</th>
                  <th className="py-2.5 px-3 font-semibold">Unit Price</th>
                  <th className="py-2.5 px-3 font-semibold">Units Left</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStockProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{p.title}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-500">{p.sku}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900 font-mono">{formatBDT(p.price)}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">{p.stockQuantity}</td>
                    <td className="py-2.5 px-3">
                      {p.stockQuantity === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                          Critical Low
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
