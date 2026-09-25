/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatBDT } from '../../utils/currency';
import {
  DownloadCloud,
  UploadCloud,
  Globe,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sliders,
  DollarSign,
  Package,
  Image as ImageIcon,
  Check,
  ShoppingBag,
  ExternalLink,
  Code,
  Tag,
  Eye,
} from 'lucide-react';

interface ExternalProductPreview {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  calculatedPrice: number;
  stock: number;
  brand: string;
  imageUrl: string;
  images: string[];
  selected: boolean;
}

const PRESET_APIS = [
  {
    name: 'DummyJSON Smartphones & Mobiles',
    url: 'https://dummyjson.com/products/category/smartphones',
    suggestedCategory: 'cat-phones',
    defaultMultiplier: 120,
    description: 'High-end smartphones with full image galleries, specs, and stock.',
  },
  {
    name: 'DummyJSON Laptops & PC Hardware',
    url: 'https://dummyjson.com/products/category/laptops',
    suggestedCategory: 'cat-laptops',
    defaultMultiplier: 120,
    description: 'Laptops, notebooks, and ultrabooks catalog feed.',
  },
  {
    name: 'DummyJSON Mobile & Tech Accessories',
    url: 'https://dummyjson.com/products/category/mobile-accessories',
    suggestedCategory: 'cat-audio',
    defaultMultiplier: 120,
    description: 'Earbuds, power banks, cases, and premium tech gear.',
  },
  {
    name: 'FakeStoreAPI Electronics & Audio',
    url: 'https://fakestoreapi.com/products/category/electronics',
    suggestedCategory: 'cat-audio',
    defaultMultiplier: 120,
    description: 'Monitors, solid-state drives, external storage, and headsets.',
  },
  {
    name: 'Platzi Global Tech Products API',
    url: 'https://api.escuelajs.co/api/v1/products?offset=0&limit=15',
    suggestedCategory: 'cat-audio',
    defaultMultiplier: 120,
    description: 'Modern consumer hardware and electronic devices.',
  },
];

export const ProductImportTab: React.FC = () => {
  const { categories, addProduct, addToast, setDashboardTab } = useStore();

  const [activeImportMode, setActiveImportMode] = useState<'url-scraper' | 'api-feed' | 'json'>('url-scraper');

  // Single URL Scraper States
  const [singleUrl, setSingleUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapedProduct, setScrapedProduct] = useState<{
    title: string;
    description: string;
    price: number;
    currency: string;
    brand: string;
    sku: string;
    stockQuantity: number;
    images: string[];
  } | null>(null);
  const [singleCategory, setSingleCategory] = useState(categories[0]?.id || 'cat-audio');
  const [singlePriceBDT, setSinglePriceBDT] = useState<number>(0);
  const [singleStock, setSingleStock] = useState<number>(20);

  // Bulk API Feed States
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(120);
  const [markupPercent, setMarkupPercent] = useState<number>(10); // +10%
  const [targetCategory, setTargetCategory] = useState<string>(categories[0]?.id || 'cat-audio');
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [importedPreviews, setImportedPreviews] = useState<ExternalProductPreview[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);

  // Raw JSON States
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // ==============================================================
  // 1. Single Website URL Scraper Handler
  // ==============================================================
  const handleScrapeUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!singleUrl.trim()) {
      setScrapeError('Please enter a valid website product URL.');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    setScrapedProduct(null);

    try {
      const response = await fetch(`/api/scrape-product?url=${encodeURIComponent(singleUrl.trim())}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract product data from this website.');
      }

      const prod = data.product;
      setScrapedProduct(prod);

      // Auto-calculate BDT price
      let calculatedBDT = prod.price;
      if (prod.currency === 'USD') {
        calculatedBDT = Math.round(prod.price * 120);
      } else if (prod.currency === 'EUR') {
        calculatedBDT = Math.round(prod.price * 130);
      } else if (prod.currency === 'GBP') {
        calculatedBDT = Math.round(prod.price * 155);
      }
      setSinglePriceBDT(calculatedBDT > 0 ? calculatedBDT : 2500);
      setSingleStock(prod.stockQuantity || 25);

      addToast(`Successfully extracted product details from website!`, 'success');
    } catch (err: any) {
      console.warn('Scraping error:', err);
      setScrapeError(err.message || 'Could not scrape product. The website might be blocking automated requests or behind Cloudflare.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveScrapedProduct = () => {
    if (!scrapedProduct) return;

    const slug = `${scrapedProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const sku = scrapedProduct.sku || `IMP-${Date.now().toString().slice(-4)}`;

    const newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      title: scrapedProduct.title,
      slug,
      description: scrapedProduct.description,
      price: Number(singlePriceBDT),
      stockQuantity: Number(singleStock),
      sku,
      categoryId: singleCategory,
      images: scrapedProduct.images && scrapedProduct.images.length > 0
        ? scrapedProduct.images
        : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
      isPublished: true,
      rating: 4.9,
      reviewsCount: 16,
      brand: scrapedProduct.brand || 'XEEROO Global',
      features: ['Imported Web Catalog', 'Official Hardware Specs', 'XEEROO Warranty Covered'],
    };

    if (addProduct(newProduct)) {
      addToast(`Product "${scrapedProduct.title}" imported and saved to Database!`, 'success');
      setScrapedProduct(null);
      setSingleUrl('');
    }
  };

  // ==============================================================
  // 2. Bulk E-Commerce REST API Handler
  // ==============================================================
  const handleFetchApiFeed = async (apiUrlToUse?: string) => {
    const url = apiUrlToUse || customApiUrl || PRESET_APIS[selectedPresetIndex]?.url;
    if (!url) {
      setApiError('Please specify an API endpoint URL.');
      return;
    }

    setIsLoadingApi(true);
    setApiError(null);
    setImportedPreviews([]);

    try {
      // Use proxy endpoint to bypass CORS
      const proxyUrl = `/api/proxy-fetch?url=${encodeURIComponent(url.trim())}`;
      const response = await fetch(proxyUrl);
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
        throw new Error('Could not find product list in API JSON response. Expected array or { products: [...] }');
      }

      if (items.length === 0) {
        throw new Error('API returned 0 products.');
      }

      const previews: ExternalProductPreview[] = items.map((item, idx) => {
        const rawPrice = Number(item.price) || 49;
        const multiplier = exchangeRate > 0 ? exchangeRate : 120;
        const basePrice = Math.round(rawPrice * multiplier);
        const calcPrice = Math.round(basePrice * (1 + markupPercent / 100));

        const mainImg =
          (Array.isArray(item.images) && item.images[0]) ||
          item.image ||
          item.thumbnail ||
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

        const rawImages = Array.isArray(item.images) && item.images.length > 0
          ? item.images
          : [mainImg];

        return {
          id: `ext-${item.id || idx}-${Date.now().toString(36)}`,
          title: item.title || item.name || `Imported Tech Product #${idx + 1}`,
          description: item.description || 'Imported high-spec hardware for XEEROO.',
          originalPrice: rawPrice,
          calculatedPrice: calcPrice > 0 ? calcPrice : 1500,
          stock: Number(item.stock || item.stockQuantity || 25),
          brand: item.brand || 'XEEROO Global',
          imageUrl: mainImg,
          images: rawImages,
          selected: true,
        };
      });

      setImportedPreviews(previews);
      addToast(`Fetched ${previews.length} products from API feed!`, 'success');
    } catch (err: any) {
      console.error('API fetch error:', err);
      setApiError(err.message || 'Failed to fetch from API.');
    } finally {
      setIsLoadingApi(false);
    }
  };

  // ==============================================================
  // 3. Raw JSON Parser
  // ==============================================================
  const handleParseRawJson = () => {
    setJsonError(null);
    if (!rawJsonText.trim()) {
      setJsonError('Please paste raw JSON text.');
      return;
    }

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
        const calcPrice = Math.round(rawPrice * (exchangeRate > 0 ? exchangeRate : 120));
        const img =
          (Array.isArray(item.images) && item.images[0]) ||
          item.image ||
          item.thumbnail ||
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

        const rawImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [img];

        return {
          id: `json-${item.id || idx}`,
          title: item.title || item.name || `Imported Hardware #${idx + 1}`,
          description: item.description || 'Raw JSON imported product for XEEROO catalog.',
          originalPrice: rawPrice,
          calculatedPrice: calcPrice > 0 ? calcPrice : 1800,
          stock: Number(item.stock || 20),
          brand: item.brand || 'XEEROO Global',
          imageUrl: img,
          images: rawImages,
          selected: true,
        };
      });

      setImportedPreviews(previews);
      addToast(`Parsed ${previews.length} products from JSON!`, 'success');
    } catch (err: any) {
      setJsonError(`Invalid JSON format: ${err.message}`);
    }
  };

  // ==============================================================
  // 4. Batch Commit to Database & Catalog
  // ==============================================================
  const toggleSelectAll = (select: boolean) => {
    setImportedPreviews(prev => prev.map(p => ({ ...p, selected: select })));
  };

  const toggleItemSelect = (id: string) => {
    setImportedPreviews(prev =>
      prev.map(p => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleCommitBulkImport = () => {
    const selected = importedPreviews.filter(p => p.selected);
    if (selected.length === 0) {
      setApiError('Please select at least one product to import.');
      return;
    }

    setIsCommitting(true);
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
        images: p.images && p.images.length > 0 ? p.images : [p.imageUrl],
        isPublished: true,
        rating: 4.8,
        reviewsCount: 14,
        brand: p.brand || 'XEEROO Global',
        features: ['Global Hardware Spec', 'Authentic Warranty', 'API Catalog Ingested'],
      };

      if (addProduct(newProduct)) {
        successCount++;
      }
    });

    setIsCommitting(false);
    addToast(`Successfully imported ${successCount} products directly into Cloud Database and storefront!`, 'success');
    setImportedPreviews([]);
  };

  const selectedCount = importedPreviews.filter(p => p.selected).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">External Website & API Product Importer</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold uppercase">
                  v3.0 Multi-Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Import products from external e-commerce websites (Amazon, Daraz, StarTech, Ryans, Apple, etc.), Shopify/WooCommerce stores, or public REST API catalogs directly into your XEEROO database with all images and specs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDashboardTab('products')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-700"
            >
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>View Product Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-gray-200 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveImportMode('url-scraper')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeImportMode === 'url-scraper'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Single Website URL Scraper</span>
        </button>

        <button
          onClick={() => setActiveImportMode('api-feed')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeImportMode === 'api-feed'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>E-Commerce Stores & REST APIs</span>
        </button>

        <button
          onClick={() => setActiveImportMode('json')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeImportMode === 'json'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Raw JSON Feed</span>
        </button>
      </div>

      {/* MODE 1: Single Website URL Scraper */}
      {activeImportMode === 'url-scraper' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Import Product by Website URL</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Paste the URL of any product page from an e-commerce website (e.g. Daraz, Amazon, StarTech, Ryans, Apple, or any Shopify store). Our backend scraper extracts metadata, images, and prices.
              </p>
            </div>

            <form onSubmit={handleScrapeUrl} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="url"
                  placeholder="https://www.apple.com/iphone-16-pro/ or https://www.startech.com.bd/product..."
                  value={singleUrl}
                  onChange={e => setSingleUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isScraping}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isScraping ? 'Extracting Page...' : 'Extract & Preview'}</span>
              </button>
            </form>

            {/* Quick Demo URLs */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11px] font-semibold text-gray-400">Quick Test URLs:</span>
              <button
                type="button"
                onClick={() => {
                  setSingleUrl('https://dummyjson.com/products/1');
                  handleScrapeUrl();
                }}
                className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-mono cursor-pointer"
              >
                DummyJSON iPhone 9
              </button>
              <button
                type="button"
                onClick={() => {
                  setSingleUrl('https://fakestoreapi.com/products/1');
                  handleScrapeUrl();
                }}
                className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-mono cursor-pointer"
              >
                FakeStore Laptop Backpack
              </button>
            </div>

            {scrapeError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{scrapeError}</span>
              </div>
            )}
          </div>

          {/* Scraped Result Card */}
          {scrapedProduct && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-900">Extracted Product Data Ready for Import</h3>
                </div>
                <span className="text-xs font-mono font-bold text-gray-500">
                  {scrapedProduct.images.length} Images Found
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Images Preview Column */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-700 block">Extracted Images</label>
                  <div className="aspect-square bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={scrapedProduct.images[0]}
                      alt={scrapedProduct.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {scrapedProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {scrapedProduct.images.slice(1, 5).map((img, i) => (
                        <div key={i} className="aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50 p-1">
                          <img src={img} alt="" className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details & Configuration Column */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Product Title</label>
                    <input
                      type="text"
                      value={scrapedProduct.title}
                      onChange={e => setScrapedProduct({ ...scrapedProduct, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={scrapedProduct.description}
                      onChange={e => setScrapedProduct({ ...scrapedProduct, description: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Selling Price (BDT)</label>
                      <input
                        type="number"
                        value={singlePriceBDT}
                        onChange={e => setSinglePriceBDT(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-blue-600 font-mono"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">Original: {scrapedProduct.price} {scrapedProduct.currency}</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        value={singleStock}
                        onChange={e => setSingleStock(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Department</label>
                      <select
                        value={singleCategory}
                        onChange={e => setSingleCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setScrapedProduct(null)}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveScrapedProduct}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Save & Import to Database ({formatBDT(singlePriceBDT)})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: Bulk E-Commerce REST API */}
      {activeImportMode === 'api-feed' && (
        <div className="space-y-6">
          {/* Preset Selector Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Import Products from E-Commerce API Feed</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose a pre-configured verified electronics API feed, or connect to any custom Shopify, WooCommerce, or REST API endpoint.
              </p>
            </div>

            {/* Presets List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRESET_APIS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPresetIndex(idx);
                    setCustomApiUrl(preset.url);
                    setTargetCategory(preset.suggestedCategory);
                    setExchangeRate(preset.defaultMultiplier);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedPresetIndex === idx
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">{preset.name}</h4>
                    {selectedPresetIndex === idx && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{preset.description}</p>
                </div>
              ))}
            </div>

            {/* Custom URL Endpoint Input */}
            <div className="pt-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">Target API URL (Shopify / WooCommerce / REST API)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://dummyjson.com/products/category/smartphones or https://mystore.myshopify.com/products.json"
                  value={customApiUrl || PRESET_APIS[selectedPresetIndex]?.url}
                  onChange={e => setCustomApiUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
                <button
                  onClick={() => handleFetchApiFeed()}
                  disabled={isLoadingApi}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isLoadingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>{isLoadingApi ? 'Fetching Products...' : 'Fetch Feed'}</span>
                </button>
              </div>
            </div>

            {/* Global Conversion & Category Mapping Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Currency Rate (1 USD to BDT)</label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Profit Markup Margin (%)</label>
                <input
                  type="number"
                  value={markupPercent}
                  onChange={e => setMarkupPercent(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Destination Department</label>
                <select
                  value={targetCategory}
                  onChange={e => setTargetCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {apiError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}
          </div>

          {/* Bulk Import Preview Grid */}
          {importedPreviews.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    Fetched Products ({selectedCount} of {importedPreviews.length} selected)
                  </h3>
                  <button
                    onClick={() => toggleSelectAll(selectedCount < importedPreviews.length)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    {selectedCount === importedPreviews.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <button
                  onClick={handleCommitBulkImport}
                  disabled={isCommitting || selectedCount === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  <span>Import {selectedCount} Products to Database</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {importedPreviews.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelect(item.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex gap-3 ${
                      item.selected
                        ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                        : 'border-gray-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="w-5 pt-1">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => {}}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-contain bg-white border border-gray-200 p-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.title}</h4>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-black text-blue-600 font-mono">
                          {formatBDT(item.calculatedPrice)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          Stock: {item.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Raw JSON Feed */}
      {activeImportMode === 'json' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Import Products from Raw JSON</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Paste a JSON array of products or an object with a <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">products</code> key.
            </p>
          </div>

          <textarea
            rows={8}
            placeholder={`[\n  {\n    "title": "Sony WH-1000XM5 Wireless Headphones",\n    "price": 349,\n    "stock": 15,\n    "brand": "Sony",\n    "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"]\n  }\n]`}
            value={rawJsonText}
            onChange={e => setRawJsonText(e.target.value)}
            className="w-full p-3 text-xs bg-slate-950 text-slate-200 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
          />

          <div className="flex justify-end">
            <button
              onClick={handleParseRawJson}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Code className="w-4 h-4" />
              <span>Parse & Preview JSON</span>
            </button>
          </div>

          {jsonError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
