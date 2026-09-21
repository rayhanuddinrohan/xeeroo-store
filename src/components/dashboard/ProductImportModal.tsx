/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Category, Product } from '../../types';
import { formatBDT } from '../../utils/currency';
import {
  X,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sliders,
} from 'lucide-react';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExternalProductPreview {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  calculatedPrice: number;
  stock: number;
  brand: string;
  imageUrl: string;
  selected: boolean;
}

const PRESET_APIS = [
  {
    name: 'DummyJSON Smartphones',
    url: 'https://dummyjson.com/products/category/smartphones',
    suggestedCategory: 'cat-phones',
    defaultMultiplier: 120, // USD to BDT
  },
  {
    name: 'DummyJSON Laptops & PC',
    url: 'https://dummyjson.com/products/category/laptops',
    suggestedCategory: 'cat-laptops',
    defaultMultiplier: 120,
  },
  {
    name: 'DummyJSON Audio & Accessories',
    url: 'https://dummyjson.com/products/category/mobile-accessories',
    suggestedCategory: 'cat-audio',
    defaultMultiplier: 120,
  },
  {
    name: 'FakeStoreAPI Electronics',
    url: 'https://fakestoreapi.com/products/category/electronics',
    suggestedCategory: 'cat-audio',
    defaultMultiplier: 120,
  },
];

export const ProductImportModal: React.FC<ProductImportModalProps> = ({ isOpen, onClose }) => {
  const { categories, addProduct, addToast } = useStore();

  const [mode, setMode] = useState<'preset' | 'custom' | 'json'>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [rawJsonText, setRawJsonText] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(120);
  const [targetCategory, setTargetCategory] = useState<string>(categories[0]?.id || 'cat-audio');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedPreviews, setImportedPreviews] = useState<ExternalProductPreview[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleFetchFromApi = async (urlToFetch: string) => {
    setIsLoading(true);
    setError(null);
    setImportedPreviews([]);

    try {
      const response = await fetch(urlToFetch);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      let items: any[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (Array.isArray(data.products)) {
        items = data.products;
      } else if (Array.isArray(data.items)) {
        items = data.items;
      } else if (Array.isArray(data.data)) {
        items = data.data;
      } else {
        throw new Error('Could not find product array in API response. Expected array or { products: [...] }');
      }

      if (items.length === 0) {
        throw new Error('API returned 0 products.');
      }

      const previews: ExternalProductPreview[] = items.map((item, idx) => {
        const rawPrice = Number(item.price) || 99;
        const calcPrice = Math.round(rawPrice * exchangeRate);
        const img =
          (Array.isArray(item.images) && item.images[0]) ||
          item.image ||
          item.thumbnail ||
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

        return {
          id: `ext-${item.id || idx}`,
          title: item.title || item.name || `Imported Tech Product #${idx + 1}`,
          description: item.description || item.title || 'High quality tech hardware imported directly to XEEROO.',
          originalPrice: rawPrice,
          calculatedPrice: calcPrice > 0 ? calcPrice : 1500,
          stock: Number(item.stock || item.stockQuantity || 20),
          brand: item.brand || 'XEEROO Global',
          imageUrl: img,
          selected: true,
        };
      });

      setImportedPreviews(previews);
    } catch (err: any) {
      console.error('Failed to fetch from API:', err);
      setError(err.message || 'Failed to connect to external API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseJson = () => {
    setError(null);
    try {
      const parsed = JSON.parse(rawJsonText);
      let items: any[] = [];
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (Array.isArray(parsed.products)) {
        items = parsed.products;
      } else {
        throw new Error('JSON must be an array of products or an object containing a "products" array.');
      }

      const previews: ExternalProductPreview[] = items.map((item, idx) => {
        const rawPrice = Number(item.price) || 99;
        const calcPrice = Math.round(rawPrice * exchangeRate);
        const img =
          (Array.isArray(item.images) && item.images[0]) ||
          item.image ||
          item.thumbnail ||
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

        return {
          id: `ext-${item.id || idx}`,
          title: item.title || item.name || `Imported Tech Product #${idx + 1}`,
          description: item.description || 'Imported product for XEEROO.',
          originalPrice: rawPrice,
          calculatedPrice: calcPrice > 0 ? calcPrice : 1500,
          stock: Number(item.stock || 20),
          brand: item.brand || 'XEEROO Global',
          imageUrl: img,
          selected: true,
        };
      });

      setImportedPreviews(previews);
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const toggleSelectAll = (select: boolean) => {
    setImportedPreviews(prev => prev.map(p => ({ ...p, selected: select })));
  };

  const toggleItemSelect = (id: string) => {
    setImportedPreviews(prev =>
      prev.map(p => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleCommitImport = () => {
    const selected = importedPreviews.filter(p => p.selected);
    if (selected.length === 0) {
      setError('Please select at least one product to import.');
      return;
    }

    setIsImporting(true);
    let successCount = 0;

    selected.forEach((p, idx) => {
      const slug = `${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}-${idx}`;
      const sku = `IMP-${Date.now().toString().slice(-4)}-${idx + 1}`;

      const newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        title: p.title,
        slug,
        description: p.description,
        price: p.calculatedPrice,
        stockQuantity: p.stock,
        sku,
        categoryId: targetCategory,
        images: [p.imageUrl],
        isPublished: true,
        rating: 4.8,
        reviewsCount: 12,
        brand: p.brand,
        features: ['Authentic Global Tech', 'Full Warranty Coverage', 'Direct API Import'],
      };

      if (addProduct(newProduct)) {
        successCount++;
      }
    });

    setIsImporting(false);
    addToast(`Successfully imported ${successCount} products into XEEROO inventory!`, 'success');
    onClose();
  };

  const selectedCount = importedPreviews.filter(p => p.selected).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Import Products via External API</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bulk import tech gear from external websites, JSON REST endpoints, or marketplaces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Modes: Preset vs Custom URL vs Paste JSON */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setMode('preset');
                setExchangeRate(PRESET_APIS[selectedPresetIndex].defaultMultiplier);
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'preset'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Preset Market APIs</span>
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'custom'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5 text-cyan-600" />
              <span>Custom API URL</span>
            </button>
            <button
              onClick={() => setMode('json')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'json'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-600" />
              <span>Paste Raw JSON</span>
            </button>
          </div>

          {/* Mode 1: Preset */}
          {mode === 'preset' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                Select Tested E-Commerce Catalog Endpoint:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_APIS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPresetIndex(idx);
                      setExchangeRate(preset.defaultMultiplier);
                      if (categories.some(c => c.id === preset.suggestedCategory)) {
                        setTargetCategory(preset.suggestedCategory);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetIndex === idx
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-900 block">{preset.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono block truncate mt-0.5">
                      {preset.url}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode 2: Custom URL */}
          {mode === 'custom' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                External Website / Service REST API Endpoint:
              </label>
              <input
                type="url"
                placeholder="https://example.com/api/products"
                value={customApiUrl}
                onChange={e => setCustomApiUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono"
              />
              <p className="text-[11px] text-gray-500">
                The endpoint should return JSON array or an object with a <code className="bg-gray-100 px-1 rounded">products</code> key.
              </p>
            </div>
          )}

          {/* Mode 3: Raw JSON */}
          {mode === 'json' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                Paste JSON Products Payload:
              </label>
              <textarea
                rows={4}
                placeholder='[{"title":"Tech Product","price":49,"stock":15,"image":"https://..."}]'
                value={rawJsonText}
                onChange={e => setRawJsonText(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono"
              />
            </div>
          )}

          {/* Import Settings: Exchange rate / multiplier & Category mapping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Price Multiplier / Currency Rate (BDT)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={exchangeRate}
                  onChange={e => {
                    const rate = Number(e.target.value) || 1;
                    setExchangeRate(rate);
                    // update calculated prices in preview
                    setImportedPreviews(prev =>
                      prev.map(p => ({
                        ...p,
                        calculatedPrice: Math.round(p.originalPrice * rate),
                      }))
                    );
                  }}
                  className="w-24 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-mono font-bold"
                />
                <span className="text-[11px] text-gray-500">
                  (120 = USD $1 to ৳120 BDT, or 1 if already in BDT)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Assign to XEEROO Department</span>
              </label>
              <select
                value={targetCategory}
                onChange={e => setTargetCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action to Fetch / Parse */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                if (mode === 'preset') {
                  handleFetchFromApi(PRESET_APIS[selectedPresetIndex].url);
                } else if (mode === 'custom') {
                  if (!customApiUrl.trim()) {
                    setError('Please enter a valid API URL.');
                    return;
                  }
                  handleFetchFromApi(customApiUrl.trim());
                } else {
                  handleParseJson();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to API...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Fetch Products from API</span>
                </>
              )}
            </button>

            {importedPreviews.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleSelectAll(true)}
                  className="text-blue-600 hover:underline cursor-pointer font-semibold"
                >
                  Select All ({importedPreviews.length})
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => toggleSelectAll(false)}
                  className="text-gray-500 hover:underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Previews Table */}
          {importedPreviews.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                {importedPreviews.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelect(item.id)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      item.selected ? 'bg-blue-50/40' : 'bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => {}} // Handled by div click
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-xs text-gray-900 block truncate max-w-sm">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          <span>Brand: {item.brand}</span>
                          <span>•</span>
                          <span>Stock: {item.stock}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs font-mono text-gray-900 block">
                        {formatBDT(item.calculatedPrice)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        (orig: ${item.originalPrice})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={selectedCount === 0 || isImporting}
            onClick={handleCommitImport}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isImporting ? 'Importing...' : `Import ${selectedCount} Selected Products`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
