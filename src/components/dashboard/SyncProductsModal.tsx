/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  X,
  RefreshCw,
  Key,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { formatBDT } from '../../utils/currency';

interface SyncProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncProductsModal: React.FC<SyncProductsModalProps> = ({ isOpen, onClose }) => {
  const { categories, syncBusinessKoroProducts, setDashboardTab, addToast } = useStore();

  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('bk_api_key') || 'bkr_aad2d61b33846e51b56d3c413c8b3c1d94f7e6602ee5fd0c';
    } catch {
      return 'bkr_aad2d61b33846e51b56d3c413c8b3c1d94f7e6602ee5fd0c';
    }
  });
  const [showKey, setShowKey] = useState(false);
  const [targetCategory, setTargetCategory] = useState<string>(categories[0]?.id || 'cat-audio');
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<{ synced: number; total: number } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    count: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      addToast('BusinessKoro API Key (x-api-key) is required.', 'error');
      return;
    }

    try {
      localStorage.setItem('bk_api_key', cleanKey);
    } catch {
      // ignore
    }

    setIsSyncing(true);
    setProgress(null);
    setSyncResult(null);

    try {
      const res = await syncBusinessKoroProducts(cleanKey, targetCategory, (synced, total) => {
        setProgress({ synced, total });
      });

      setSyncResult(res);
    } catch (err: any) {
      setSyncResult({
        success: false,
        count: 0,
        message: err.message || 'Sync failed. Please check your API key and connection.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Sync / Import Products via API</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono font-bold">
                  BusinessKoro
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Automated catalog sync to Firestore database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* API Info Callout */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>ENDPOINT SPECIFICATION</span>
              <span className="text-emerald-700 font-bold">LIVE API</span>
            </div>
            <div className="text-slate-800 font-semibold break-all">
              <span className="text-blue-600 font-bold">GET</span> https://api.businesskoro.com/api/v1/storefront/products
            </div>
            <div className="text-[11px] text-slate-500">
              Header: <span className="text-purple-700 font-bold">x-api-key: YOUR_API_KEY</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              Maps: <span className="text-slate-700">name, description, images, suggestedPrice (as price), inStock, variants</span>
            </div>
          </div>

          <form onSubmit={handleStartSync} className="space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>BusinessKoro API Key (x-api-key) *</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showKey ? 'Hide' : 'Show'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Paste your BusinessKoro x-api-key here..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-gray-900"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Your key is securely saved in your local browser session for future 1-click syncs.
              </p>
            </div>

            {/* Target Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Assign to Department / Category:</span>
              </label>
              <select
                value={targetCategory}
                onChange={e => setTargetCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress indicator */}
            {progress && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>Saving products to Firestore...</span>
                  <span>{progress.synced} / {progress.total}</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 transition-all duration-200"
                    style={{ width: `${(progress.synced / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Result banner */}
            {syncResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  syncResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {syncResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {syncResult.success ? 'Sync Completed Successfully!' : 'Sync Notice'}
                  </div>
                  <div className="text-[11px] mt-0.5">{syncResult.message}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setDashboardTab('importer');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Advanced Importer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSyncing}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {syncResult?.success ? 'Done' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSyncing || !apiKey.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing Products...' : 'Sync/Import Products'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
