/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Server,
  Users,
  Package,
  FolderTree,
  ShoppingBag,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Zap,
  Key,
  Shield,
  Copy,
  Check,
  Eye,
  EyeOff,
  Download,
  Terminal,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const DatabaseManagementTab: React.FC = () => {
  const {
    products,
    categories,
    users,
    orders,
    dbStatus,
    testDbConnection,
    syncCatalogToDatabase,
    pullCatalogFromDatabase,
    setDashboardTab,
    createAdminAccountInDatabase,
    addToast,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'assets' | 'customers' | 'products' | 'admin-setup' | 'mongodb' | 'sql'>('overview');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // Admin Account Creation States
  const [adminName, setAdminName] = useState('Master Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('+880 1700-000000');
  const [adminPassword, setAdminPassword] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [createdAdminResult, setCreatedAdminResult] = useState<{ email: string; pass: string } | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // MongoDB Atlas Integration States
  const [mongoUri, setMongoUri] = useState(() => localStorage.getItem('xeeroo_mongodb_uri') || '');
  const [showMongoUri, setShowMongoUri] = useState(false);
  const [isMongoTesting, setIsMongoTesting] = useState(false);
  const [isMongoSyncing, setIsMongoSyncing] = useState(false);
  const [isMongoPulling, setIsMongoPulling] = useState(false);
  const [mongoTestResult, setMongoTestResult] = useState<{
    success: boolean;
    message: string;
    database?: string;
    collections?: string[];
  } | null>(null);
  const [activeMongoSchema, setActiveMongoSchema] = useState<'product' | 'order' | 'user' | 'server'>('product');

  const handleSaveMongoUri = (uri: string) => {
    setMongoUri(uri);
    localStorage.setItem('xeeroo_mongodb_uri', uri.trim());
  };

  const handleTestMongo = async () => {
    if (!mongoUri.trim()) {
      addToast('অনুগ্রহ করে আগে আপনার MongoDB Connection URI পেস্ট করুন!', 'error');
      return;
    }
    setIsMongoTesting(true);
    setMongoTestResult(null);
    try {
      const res = await fetch('/api/mongodb/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionUri: mongoUri.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMongoTestResult({
          success: true,
          message: data.message,
          database: data.database,
          collections: data.collections,
        });
        addToast(data.message, 'success');
        localStorage.setItem('xeeroo_mongodb_uri', mongoUri.trim());
      } else {
        setMongoTestResult({
          success: false,
          message: data.error || 'MongoDB Atlas-এর সাথে সংযোগ স্থাপন সম্ভব হয়নি।',
        });
        addToast(data.error || 'MongoDB সংযোগ ব্যর্থ হয়েছে!', 'error');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setMongoTestResult({
        success: false,
        message: error.message || 'নেটওয়ার্ক এরর। ব্যাকএন্ড রেসপন্স করেনি।',
      });
      addToast('MongoDB টেস্ট এরর!', 'error');
    } finally {
      setIsMongoTesting(false);
    }
  };

  const handleSyncToMongo = async () => {
    if (!mongoUri.trim()) {
      addToast('অনুগ্রহ করে আগে আপনার MongoDB Connection URI পেস্ট করুন!', 'error');
      return;
    }
    setIsMongoSyncing(true);
    try {
      const res = await fetch('/api/mongodb/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionUri: mongoUri.trim(),
          data: { products, categories, orders, users },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message, 'success');
      } else {
        addToast(data.error || 'MongoDB তে সিঙ্ক ব্যর্থ হয়েছে!', 'error');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      addToast(error.message || 'সিঙ্ক রিকোয়েস্ট ব্যর্থ হয়েছে!', 'error');
    } finally {
      setIsMongoSyncing(false);
    }
  };

  const handlePullFromMongo = async () => {
    if (!mongoUri.trim()) {
      addToast('অনুগ্রহ করে আগে আপনার MongoDB Connection URI পেস্ট করুন!', 'error');
      return;
    }
    setIsMongoPulling(true);
    try {
      const res = await fetch('/api/mongodb/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionUri: mongoUri.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(`সফলভাবে ডেটা আনা হয়েছে! (প্রোডাক্ট: ${data.products?.length || 0}, অর্ডার: ${data.orders?.length || 0})`, 'success');
      } else {
        addToast(data.error || 'MongoDB থেকে ডেটা ফেচ ব্যর্থ হয়েছে!', 'error');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      addToast(error.message || 'MongoDB ফেচ ব্যর্থ হয়েছে!', 'error');
    } finally {
      setIsMongoPulling(false);
    }
  };

  const handleExportJson = (filename: string, data: any) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast(`${filename} ডাউনলোড শুরু হয়েছে!`, 'success');
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    const res = await testDbConnection();
    setTestResult(res);
    setIsTesting(false);
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      addToast('Please enter both email and password for the admin account.', 'error');
      return;
    }
    if (adminPassword.length < 6) {
      addToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    setIsCreatingAdmin(true);
    const res = await createAdminAccountInDatabase({
      fullName: adminName.trim(),
      email: adminEmail.trim(),
      phone: adminPhone.trim(),
      password: adminPassword,
    });
    setIsCreatingAdmin(false);

    if (res.success) {
      setCreatedAdminResult({ email: adminEmail.trim(), pass: adminPassword });
    }
  };

  const handleCopyCredentials = () => {
    if (!createdAdminResult) return;
    navigator.clipboard.writeText(`Email: ${createdAdminResult.email}\nPassword: ${createdAdminResult.pass}`);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const customerList = users.filter(u => u.role === 'customer');
  const adminList = users.filter(u => u.role === 'admin' || u.role === 'moderator');

  return (
    <div className="space-y-6">
      {/* Top Banner: Database Health & Status */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Cloud Database & Collections</h2>
                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Firebase / Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Connected Project: <strong className="text-slate-200 font-mono">xeeroo-store</strong>. Real-time synchronization active for products, customer accounts with shipping addresses, categories, and orders.
              </p>
              {dbStatus.lastSyncedAt && (
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Last Synced: {dbStatus.lastSyncedAt}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestPing}
              disabled={isTesting || dbStatus.isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={() => syncCatalogToDatabase()}
              disabled={dbStatus.isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${dbStatus.isSyncing ? 'animate-bounce' : ''}`} />
              <span>{dbStatus.isSyncing ? 'Pushing Data...' : 'Sync All Data to DB'}</span>
            </button>

            <button
              onClick={() => pullCatalogFromDatabase()}
              disabled={dbStatus.isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pull from DB</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
            testResult.success
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
              : 'bg-rose-950/40 text-rose-300 border-rose-800'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'overview'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Database Overview & Tables
        </button>
        <button
          onClick={() => setActiveSubTab('customers')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'customers'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Customer Table & Addresses</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-mono">
            {customerList.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('products')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'products'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Products Table</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-mono">
            {products.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('admin-setup')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'admin-setup'
              ? 'border-purple-600 text-purple-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-purple-600" />
          <span>অ্যাডমিন অ্যাকাউন্ট তৈরি ও গাইড (Admin Setup)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-mono font-bold">
            {adminList.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('mongodb')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'mongodb'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>MongoDB Atlas (ফ্রি ডাটাবেজ গাইড ও কানেকশন)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
            Free M0
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('assets')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'assets'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>লোগো ও বাটন এসেটস গাইড (PNG & Logo Assets)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-mono font-bold">
            Live Assets
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('sql')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'sql'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          PostgreSQL / Supabase Schema
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Collection Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">products table</p>
                <h3 className="text-xl font-black text-gray-900 mt-1">{products.length} Items</h3>
                <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto-sync enabled
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">customers table</p>
                <h3 className="text-xl font-black text-gray-900 mt-1">{customerList.length} Accounts</h3>
                <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Address sync active
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">categories table</p>
                <h3 className="text-xl font-black text-gray-900 mt-1">{categories.length} Categories</h3>
                <p className="text-[11px] text-gray-500 mt-1">Catalog taxonomy</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FolderTree className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">orders table</p>
                <h3 className="text-xl font-black text-gray-900 mt-1">{orders.length} Records</h3>
                <p className="text-[11px] text-gray-500 mt-1">Live fulfillment</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Database Setup & Persistence Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-xs text-blue-900 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-sm text-blue-950">How XEEROO Persists Your Data to Cloud Database</h3>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-blue-800 leading-relaxed">
              <li>
                <strong>Customer Accounts & Address:</strong> Whenever a customer registers (with OTP verification) or updates their profile in Customer Settings, their details—including full name, email, phone, and complete shipping address (street, city, district, postal code)—are immediately saved to the <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">customers</code> and <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">users</code> collections in Firestore.
              </li>
              <li>
                <strong>Product Catalog & Stock:</strong> Adding, editing, deleting, or adjusting stock of any product writes directly to the <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">products</code> collection in Firestore.
              </li>
              <li>
                <strong>API Product Importer:</strong> Products imported from external websites or APIs are immediately written to the database with all their images and details.
              </li>
              <li>
                <strong>One-Click Sync:</strong> Click the <strong>"Sync All Data to DB"</strong> button above anytime to push all demo and existing catalog data into Firestore in a single batch.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab Content: Customer Table & Addresses */}
      {activeSubTab === 'customers' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Registered Customer Table (`customers`)</h3>
              <p className="text-xs text-gray-500">Live view of customer accounts with verified shipping addresses stored in database.</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
              {customerList.length} Registered Customers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold">Shipping Address in DB</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customerList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No customer accounts registered yet. Register a new account via the storefront to test!
                    </td>
                  </tr>
                ) : (
                  customerList.map(cust => (
                    <tr key={cust.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={cust.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                            alt={cust.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <p className="font-bold text-gray-900">{cust.fullName}</p>
                            <p className="text-[10px] font-mono text-gray-400">{cust.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900 font-medium">{cust.email}</p>
                        <p className="text-gray-500">{cust.phone || 'No phone'}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {cust.address ? (
                          <div className="flex items-start gap-1.5 text-gray-700">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-gray-900">{cust.address.street || 'Address Street'}</p>
                              <p className="text-[11px] text-gray-500">
                                {cust.address.city}, {cust.address.state} - {cust.address.postalCode} ({cust.address.country})
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No address submitted</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          cust.approvalStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {cust.approvalStatus || 'approved'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(cust.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Assets & Button Logos Guide */}
      {activeSubTab === 'assets' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Info Card */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-6 rounded-2xl border border-indigo-800 shadow-lg space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">লোগো ও বাটন এসেটস গাইড (Button Logos & Brand Assets)</h3>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  ওয়েবসাইটে যেকোনো বাটন লোগো, সোশ্যাল আইকন বা ব্র্যান্ড ছবি যুক্ত করতে সেগুলো সরাসরি প্রজেক্টের <strong className="text-amber-300 font-mono">public/</strong> ফোল্ডারে রাখতে হয়।
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-xs text-slate-200 space-y-2">
              <p className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>আপনার আপলোড করা ৬টি ফাইল সফলভাবে <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-white">public/</code> ফোল্ডারে যুক্ত করা হয়েছে!</span>
              </p>
              <p className="text-slate-300">
                ভবিষ্যতে যেকোনো নতুন আইকন বা লোগো পরিবর্তন করতে চাইলে ফাইলের একই নাম দিয়ে <code className="font-mono text-amber-300">public/</code> ফোল্ডারে প্রতিস্থাপন করলেই ওয়েবসাইটে স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে।
              </p>
            </div>
          </div>

          {/* Active Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* WhatsApp */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">File: public/whatsapp.png</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-2">
                  <img src="/whatsapp.png" alt="WhatsApp Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">হোয়াটসঅ্যাপ বাটন লোগো</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">সব প্রোডাক্ট পেজ ও অর্ডারের বাটনে ব্যবহৃত হচ্ছে</p>
                </div>
              </div>
            </div>

            {/* Facebook */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">File: public/facebook.png</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-2">
                  <img src="/facebook.png" alt="Facebook Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">ফেসবুক বাটন লোগো</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">ফুটার ও কন্ট্যাক্ট প্যানেলে প্রদর্শিত হচ্ছে</p>
                </div>
              </div>
            </div>

            {/* Instagram */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">File: public/instagram.png</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-100 text-pink-800 font-mono">Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-2">
                  <img src="/instagram.png" alt="Instagram Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">ইনস্টাগ্রাম বাটন লোগো</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">অফিশিয়াল ইনস্টাগ্রাম পেজ লিঙ্ক</p>
                </div>
              </div>
            </div>

            {/* Messenger */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">File: public/messenger.png</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-2">
                  <img src="/messenger.png" alt="Messenger Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">মেসেঞ্জার বাটন লোগো</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">ডাইরেক্ট কাস্টমার চ্যাটের জন্য ব্যবহৃত হচ্ছে</p>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">File: public/favicon.png</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-2">
                  <img src="/favicon.png" alt="Favicon" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">ওয়েবসাইট ফেভিকন (Tab Icon)</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">ব্রাউজারের ট্যাবে লোগো হিসেবে দেখাচ্ছে</p>
                </div>
              </div>
            </div>

            {/* Brand Logo */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">File: public/xeeroo.jpg</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-2">
                  <img src="/xeeroo.jpg" alt="Brand Logo" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">XEEROO ব্র্যান্ড লোগো</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">হেডার এবং ব্র্যান্ডিং আইকনে ব্যবহৃত হচ্ছে</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Products Table */}
      {activeSubTab === 'products' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Database Products Table (`products`)</h3>
              <p className="text-xs text-gray-500">List of products synchronized with Cloud Firestore.</p>
            </div>
            <button
              onClick={() => setDashboardTab('products')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Go to Product Manager</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">SKU</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Stock</th>
                  <th className="py-3 px-4 font-semibold">Images</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.slice(0, 10).map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80'}
                          alt={p.title}
                          className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{p.title}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">{p.sku}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{formatBDT(p.price)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                        p.stockQuantity > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {p.stockQuantity} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono">{p.images.length} URLs</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        p.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {p.isPublished ? 'Active' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Admin Setup & First-Time Database Admin Creation */}
      {activeSubTab === 'admin-setup' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl border border-purple-800 shadow-md">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  প্রথমবার ডাটাবেজ থেকে অ্যাডমিন অ্যাকাউন্ট তৈরির নির্দেশিকা ও টুল
                </h3>
                <p className="text-xs text-purple-200 mt-1 max-w-2xl leading-relaxed">
                  ফায়ারবেস/ফায়ারস্টোর ডাটাবেজে <code className="bg-purple-950 px-1.5 py-0.5 rounded font-mono text-purple-300 font-bold">role: 'admin'</code> থাকা যেকোনো অ্যাকাউন্ট সম্পূর্ণ অ্যাডমিন অধিকার পায়। আপনি এখান থেকে সরাসরি ১-ক্লিকে ডাটাবেজে নতুন অ্যাডমিন তৈরি করতে পারেন অথবা ফায়ারবেস কনসোল থেকে ম্যানুয়ালি যুক্ত করতে পারেন।
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form: One-Click Admin Account Creator */}
            <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-xs space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  পদ্ধতি ১: ডিরেক্ট ডাটাবেজ ক্রিয়েটর
                </span>
                <h4 className="text-sm font-bold text-gray-900 mt-2">
                  ডাটাবেজে নতুন অ্যাডমিন অ্যাকাউন্ট ইনসার্ট করুন
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  নিচের ফর্মে তথ্য পূরণ করে সাবমিট করলেই ফায়ারবেস ফায়ারস্টোর ডাটাবেজের <code className="text-gray-700 font-mono">users</code> কালেকশনে পার্মানেন্টলি অ্যাডমিন তৈরি হবে।
                </p>
              </div>

              {createdAdminResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>অ্যাডমিন অ্যাকাউন্ট ডাটাবেজে সফলভাবে তৈরি হয়েছে!</span>
                  </div>
                  <p className="text-xs text-emerald-700 font-mono bg-emerald-100/60 p-2.5 rounded-lg">
                    ইমেইল: <strong>{createdAdminResult.email}</strong><br />
                    পাসওয়ার্ড: <strong>{createdAdminResult.pass}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Copied!' : 'Copy Login Details'}</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateAdminSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    অ্যাডমিনের পুরো নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="e.g. Master Administrator"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-purple-600 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    অ্যাডমিন ইমেইল ঠিকানা *
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@yourdomain.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-purple-600 bg-white text-gray-900 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      মোবাইল নম্বর (ঐচ্ছিক)
                    </label>
                    <input
                      type="tel"
                      value={adminPhone}
                      onChange={e => setAdminPhone(e.target.value)}
                      placeholder="+880 17XXXXXXXX"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-purple-600 bg-white text-gray-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      লগইন পাসওয়ার্ড (মিনিমাম ৬ ডিজিট) *
                    </label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="মজবুত পাসওয়ার্ড দিন..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-purple-600 bg-white text-gray-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isCreatingAdmin ? (
                    <span>ডাটাবেজে সেভ হচ্ছে...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>ডাটাবেজে সরাসরি অ্যাডমিন তৈরি করুন</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Guide: Step-by-Step Manual Guide for Firebase Console */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  পদ্ধতি ২: Firebase Console থেকে ম্যানুয়াল তৈরি
                </span>
                <h4 className="text-sm font-bold text-gray-900 mt-2">
                  ফায়ারবেস কনসোল থেকে সরাসরি অ্যাডমিন সেটআপ
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  আপনি যদি সরাসরি Google Firebase ওয়েবসাইটে গিয়ে অ্যাডমিন ডকুমেন্ট তৈরি করতে চান, তবে এই ধাপগুলো অনুসরণ করুন:
                </p>
              </div>

              <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <strong className="text-gray-900 block mb-1">ধাপ ১: ফায়ারবেস কনসোলে যান</strong>
                  <span><a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">console.firebase.google.com</a> ওপেন করে আপনার প্রজেক্ট সিলেক্ট করুন এবং বামপাশের মেনু থেকে <strong>Firestore Database</strong>-এ ক্লিক করুন।</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <strong className="text-gray-900 block mb-1">ধাপ ২: users কালেকশনে ডকুমেন্ট যোগ করুন</strong>
                  <span><strong>Start collection</strong> বা বিদ্যমান <code className="bg-white px-1.5 py-0.5 border rounded font-mono font-bold text-blue-600">users</code> কালেকশনে ক্লিক করে <strong>Add document</strong> বাটনে চাপ দিন (Document ID ফাঁকা রাখতে পারেন বা <code className="font-mono text-purple-700">admin-master</code> দিন)।</span>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                  <p className="text-amber-400 font-bold mb-1">// এই ফিল্ডগুলো হুবহু টাইপ করুন:</p>
                  <p><span className="text-blue-400">role:</span> <span className="text-emerald-400">"admin"</span> (string) <span className="text-amber-300 font-sans text-[10px]">← সবচেয়ে গুরুত্বপূর্ণ!</span></p>
                  <p><span className="text-blue-400">email:</span> <span className="text-emerald-400">"admin@yourstore.com"</span> (string)</p>
                  <p><span className="text-blue-400">fullName:</span> <span className="text-emerald-400">"Master Administrator"</span> (string)</p>
                  <p><span className="text-blue-400">password:</span> <span className="text-emerald-400">"আপনার_পাসওয়ার্ড"</span> (string)</p>
                  <p><span className="text-blue-400">approvalStatus:</span> <span className="text-emerald-400">"approved"</span> (string)</p>
                  <p><span className="text-blue-400">isVerified:</span> <span className="text-cyan-400">true</span> (boolean)</p>
                  <p><span className="text-blue-400">isBanned:</span> <span className="text-rose-400">false</span> (boolean)</p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
                  <strong className="block mb-0.5 font-bold">ধাপ ৩: সাইন-ইন করুন</strong>
                  <span>ডকুমেন্ট সেভ করার পর এই ওয়েবসাইটের <strong>Sign In</strong> উইন্ডোতে গিয়ে ওই ইমেইল ও পাসওয়ার্ড দিলে আপনি সাথে সাথে <strong>Master Admin</strong> হিসেবে লগইন হয়ে যাবেন!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Admins List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  বর্তমান অ্যাডমিনিস্ট্রেটর ও মডারেটরদের তালিকা
                </h4>
                <p className="text-xs text-gray-500">
                  ডাটাবেজে নিবন্ধিত সকল অ্যাডমিন অ্যাকাউন্ট
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg">
                মোট স্টাফ: {adminList.length} জন
              </span>
            </div>

            {adminList.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">
                এখনো কোনো অ্যাডমিন অ্যাকাউন্ট তৈরি করা হয়নি। উপরের ফর্ম থেকে প্রথম অ্যাডমিন তৈরি করুন।
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">User</th>
                      <th className="py-2.5 px-3 font-semibold">Email</th>
                      <th className="py-2.5 px-3 font-semibold">Role</th>
                      <th className="py-2.5 px-3 font-semibold">Phone</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {adminList.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-bold text-gray-900">{u.fullName}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-600">{u.email}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-500">{u.phone || '—'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: MongoDB Atlas (Free Cloud Database) */}
      {activeSubTab === 'mongodb' && (
        <div className="space-y-6">
          {/* Welcome & Clarification Hero Banner */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 rounded-2xl p-6 border border-emerald-800/40 text-white shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>MongoDB Atlas ক্লাউড ডাটাবেজ গাইড ও লাইভ কানেকশন</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider">
                      100% Free M0
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Firebase কনসোল জটিল মনে হলে MongoDB হলো সবচেয়ে জনপ্রিয়, নির্ভরযোগ্য ও সহজে ব্যবহারযোগ্য NoSQL ডাটাবেজ।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://www.mongodb.com/cloud/atlas/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>MongoDB Atlas-এ ফ্রি অ্যাকাউন্ট খুলুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-900/30 border border-emerald-700/40 text-xs text-emerald-200 leading-relaxed">
              💡 <strong>চিন্তার কিছু নেই:</strong> Firebase না বুঝলেও আপনার এই স্টোর বন্ধ হবে না! স্টোরে অলরেডি একটি ব্রাউজার ডাটাবেজ (LocalStorage & Memory) সক্রিয় আছে, ফলে পণ্য যোগ করা, অর্ডার নেওয়া, গ্রাহক রেজিস্ট্রেশন সবই কাজ করছে। আর আপনি যদি পার্মানেন্ট ক্লাউড ডাটাবেজ হিসেবে MongoDB ব্যবহার করতে চান, নিচের ৪টি সহজ ধাপ অনুসরণ করুন:
            </div>
          </div>

          {/* Interactive Live MongoDB Connection Box */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>MongoDB Atlas কানেকশন স্ট্রিং (URI) কনফিগারেশন</span>
                </h4>
                <p className="text-xs text-gray-500">
                  আপনার ক্লাস্টারের Connection String এখানে দিন এবং সাথে সাথে কানেকশন ও ডাটা সিঙ্ক পরীক্ষা করুন
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Driver: Node.js (v4.0+)
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                MongoDB Connection URI (mongodb+srv://...):
              </label>
              <div className="relative">
                <input
                  type={showMongoUri ? 'text' : 'password'}
                  value={mongoUri}
                  onChange={(e) => handleSaveMongoUri(e.target.value)}
                  placeholder="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/xeeroo_store?retryWrites=true&w=majority"
                  className="w-full text-xs font-mono px-3.5 py-2.5 pr-20 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowMongoUri(!showMongoUri)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 text-xs cursor-pointer flex items-center gap-1"
                >
                  {showMongoUri ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{showMongoUri ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                পাসওয়ার্ডে বিশেষ অক্ষর (যেমন @, #, %) থাকলে URL encode করতে হয়। সহজ পাসওয়ার্ড (যেমন: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-800">XeerooPass2026</code>) ব্যবহার করা সবচেয়ে নিরাপদ।
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleTestMongo}
                disabled={isMongoTesting || !mongoUri.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-400 ${isMongoTesting ? 'animate-spin' : ''}`} />
                <span>{isMongoTesting ? 'পরীক্ষা করা হচ্ছে...' : 'কানেকশন টেস্ট করুন (Test Ping)'}</span>
              </button>

              <button
                onClick={handleSyncToMongo}
                disabled={isMongoSyncing || !mongoUri.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isMongoSyncing ? 'animate-bounce' : ''}`} />
                <span>{isMongoSyncing ? 'সিঙ্ক হচ্ছে...' : 'বর্তমান সব ডাটা MongoDB তে আপলোড করুন'}</span>
              </button>

              <button
                onClick={handlePullFromMongo}
                disabled={isMongoPulling || !mongoUri.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-blue-600" />
                <span>MongoDB থেকে ডাটা আনুন (Pull)</span>
              </button>
            </div>

            {/* Test Result Box */}
            {mongoTestResult && (
              <div
                className={`p-4 rounded-xl text-xs space-y-2 border ${
                  mongoTestResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {mongoTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{mongoTestResult.message}</span>
                </div>

                {mongoTestResult.success && mongoTestResult.collections && (
                  <div className="text-[11px] pt-1">
                    ডাটাবেজ নাম: <strong className="font-mono text-emerald-800">{mongoTestResult.database}</strong> | 
                    পাওয়া কালেকশনসমূহ: <span className="font-mono">{mongoTestResult.collections.length > 0 ? mongoTestResult.collections.join(', ') : 'এখনো কোনো কালেকশন নেই (সিঙ্ক বাটনে চাপ দিলে তৈরি হবে)'}</span>
                  </div>
                )}

                {!mongoTestResult.success && (
                  <ul className="list-disc list-inside text-[11px] space-y-1 text-rose-800 pt-1">
                    <li>MongoDB Atlas-এর <strong>Network Access</strong> এ গিয়ে <strong>0.0.0.0/0</strong> আইপি এলাউ করেছেন কি না চেক করুন।</li>
                    <li>ইউজারনেম এবং পাসওয়ার্ডে কোনো ভুল বানান বা অতিরিক্ত স্পেস আছে কি না দেখুন।</li>
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 4-Step Visual Beginner Guide (Bengali) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
            <div>
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>MongoDB Atlas ফ্রি ক্লাউড ক্লাস্টার খোলার ৪টি সহজ ধাপ</span>
              </h4>
              <p className="text-xs text-gray-500">
                কোনো ক্রেডিট কার্ড লাগবে না। এই ডাটাবেজ সারাজীবন ১০০% ফ্রিতে ব্যবহার করা যায়।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">১</span>
                  <span>MongoDB Atlas-এ সাইন-আপ করুন</span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline">
                    mongodb.com/cloud/atlas
                  </a> ওয়েবসাইটে যান। আপনার Google অ্যাকাউন্ট দিয়ে মাত্র ১ ক্লিকে ফ্রি অ্যাকাউন্ট খুলে ফেলুন।
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">২</span>
                  <span>M0 Free ক্লাস্টার সিলেক্ট করুন</span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Create a Deployment</strong> স্ক্রিনে এসে <strong className="text-emerald-700">M0 (Free)</strong> অপশনটি পছন্দ করুন। ক্লাউড হিসেবে AWS এবং রিজিয়ন হিসেবে <strong>Singapore</strong> বা <strong>Mumbai</strong> নির্বাচন করে <strong>Create Deployment</strong> বাটনে চাপ দিন।
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">৩</span>
                  <span>ইউজার ও আইপি পারমিশন দিন</span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Database Access</strong> এ গিয়ে একটি ইউজারনেম (যেমন: <code className="bg-white px-1 py-0.5 border rounded">xeeroo_admin</code>) ও পাসওয়ার্ড দিন। এরপর <strong>Network Access</strong> মেন্যুতে গিয়ে <code className="bg-white px-1 py-0.5 border rounded font-bold text-emerald-700">0.0.0.0/0</code> (Allow Access from Anywhere) দিন।
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">৪</span>
                  <span>Connection URI কপি করে পেস্ট করুন</span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Database</strong> ট্যাবে গিয়ে <strong>Connect</strong> এ চাপ দিয়ে <strong>Drivers (Node.js)</strong> নির্বাচন করুন। যে <code className="bg-white px-1 py-0.5 border rounded text-[11px]">mongodb+srv://...</code> লিংকটি পাবেন, সেখানে আপনার পাসওয়ার্ড বসিয়ে উপরের ঘরে পেস্ট করে দিন!
                </p>
              </div>
            </div>
          </div>

          {/* 1-Click JSON Export for MongoDB Compass or MongoImport */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>১-ক্লিকে MongoDB JSON এক্সপোর্ট (Direct Compass Import)</span>
                </h4>
                <p className="text-xs text-gray-500">
                  আপনি চাইলে যেকোনো সময় আপনার স্টোরের ডাটা JSON ফাইল হিসেবে ডাউনলোড করে MongoDB Compass এ সরাসরি ইমপোর্ট করতে পারবেন
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <button
                onClick={() => handleExportJson('products.json', products)}
                className="p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-800">Products</span>
                  <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600" />
                </div>
                <span className="text-[11px] text-gray-500 block">{products.length} টি পণ্য (.json)</span>
              </button>

              <button
                onClick={() => handleExportJson('orders.json', orders)}
                className="p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-800">Orders</span>
                  <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600" />
                </div>
                <span className="text-[11px] text-gray-500 block">{orders.length} টি অর্ডার (.json)</span>
              </button>

              <button
                onClick={() => handleExportJson('users.json', users)}
                className="p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-800">Users</span>
                  <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600" />
                </div>
                <span className="text-[11px] text-gray-500 block">{users.length} জন গ্রাহক (.json)</span>
              </button>

              <button
                onClick={() => handleExportJson('categories.json', categories)}
                className="p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-800">Categories</span>
                  <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600" />
                </div>
                <span className="text-[11px] text-gray-500 block">{categories.length} টি ক্যাটাগরি (.json)</span>
              </button>
            </div>
          </div>

          {/* Copyable Mongoose Schemas & Standalone Express Code */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  <span>রেডিমেড Mongoose Schemas ও Node.js কোড</span>
                </h4>
                <p className="text-xs text-gray-500">
                  ভবিষ্যতে নিজস্ব কাস্টম Node.js / Express ব্যাকএন্ড সার্ভার চালাতে চাইলে এই স্কিমা কোডগুলো কপি করে সরাসরি ব্যবহার করতে পারবেন
                </p>
              </div>

              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                {(['product', 'order', 'user', 'server'] as const).map((schemaTab) => (
                  <button
                    key={schemaTab}
                    onClick={() => setActiveMongoSchema(schemaTab)}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition-colors capitalize ${
                      activeMongoSchema === schemaTab
                        ? 'bg-white text-emerald-800 font-bold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {schemaTab === 'server' ? 'server.js' : `${schemaTab}.model`}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
              {activeMongoSchema === 'product' && (
                <pre>{`// models/Product.js (Mongoose Schema)
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  rating: { type: Number, default: 5 },
  reviewsCount: { type: Number, default: 0 },
  images: [{ type: String }],
  category: { type: String, required: true },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 50 },
  suggestedPrice: { type: Number },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);`}</pre>
              )}

              {activeMongoSchema === 'order' && (
                <pre>{`// models/Order.js (Mongoose Schema)
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    title: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    division: { type: String },
    district: { type: String },
    area: { type: String },
    postalCode: { type: String }
  },
  paymentMethod: { type: String, default: 'cod' },
  businessKoroOrderId: { type: String }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);`}</pre>
              )}

              {activeMongoSchema === 'user' && (
                <pre>{`// models/User.js (Mongoose Schema)
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['customer', 'moderator', 'admin'], 
    default: 'customer' 
  },
  password: { type: String }, // Hashed password
  approvalStatus: { type: String, default: 'approved' },
  isVerified: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);`}</pre>
              )}

              {activeMongoSchema === 'server' && (
                <pre>{`// server.js (Express + Mongoose Minimal Server)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://...';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🍃 MongoDB Atlas Connected!'))
  .catch(err => console.error('Connection Error:', err));

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'MongoDB' }));

app.listen(5000, () => console.log('Server running on port 5000'));`}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: PostgreSQL / Supabase Schema */}
      {activeSubTab === 'sql' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">PostgreSQL / Supabase Schema (Optional)</h3>
              <p className="text-xs text-gray-500">
                If you also prefer using Supabase or a relational PostgreSQL database, run this DDL script in Supabase SQL editor.
              </p>
            </div>
            <button
              onClick={() => setDashboardTab('docs')}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg cursor-pointer"
            >
              Open Full Schema & RLS Matrix
            </button>
          </div>
          <div className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-64 border border-slate-800">
            <pre>{`-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'customer',
    full_name TEXT,
    phone TEXT,
    address JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sku VARCHAR(64) UNIQUE,
    images TEXT[] NOT NULL DEFAULT '{}'
);`}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
