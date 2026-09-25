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
  Key,
  TrendingUp,
  Percent,
  ShieldCheck,
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

  const [activeImportMode, setActiveImportMode] = useState<'businesskoro' | 'url-scraper' | 'api-feed' | 'json'>('businesskoro');

  // Business Koro API States
  const [bkApiKey, setBkApiKey] = useState(() => {
    try {
      return localStorage.getItem('bk_api_key') || '';
    } catch {
      return '';
    }
  });
  const [bkOrigin, setBkOrigin] = useState(() => {
    try {
      return localStorage.getItem('bk_origin') || '';
    } catch {
      return '';
    }
  });
  const [bkShowKey, setBkShowKey] = useState(false);
  const [isLoadingBk, setIsLoadingBk] = useState(false);
  const [bkError, setBkError] = useState<string | null>(null);
  const [bkProducts, setBkProducts] = useState<Array<{
    id: string;
    name: string;
    description: string;
    images: string[];
    suggestedPrice: number;
    sellingPrice: number;
    inStock: boolean;
    selected: boolean;
  }>>([]);
  const [bkTargetCategory, setBkTargetCategory] = useState<string>(categories[0]?.id || 'cat-audio');
  const [bkAdjustmentType, setBkAdjustmentType] = useState<'percent' | 'fixed'>('percent');
  const [bkAdjustmentValue, setBkAdjustmentValue] = useState<number>(20); // +20%
  const [bkAdjustmentDir, setBkAdjustmentDir] = useState<'increase' | 'decrease'>('increase');
  const [isImportingBk, setIsImportingBk] = useState(false);

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
  // 0. Business Koro API Handlers (Bangladesh Dropshipping)
  // ==============================================================
  const handleFetchBkProducts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bkApiKey.trim()) {
      setBkError('Business Koro API key is required. Please paste your x-api-key.');
      return;
    }

    setIsLoadingBk(true);
    setBkError(null);

    // Save to localStorage for convenience
    try {
      localStorage.setItem('bk_api_key', bkApiKey.trim());
      if (bkOrigin.trim()) {
        localStorage.setItem('bk_origin', bkOrigin.trim());
      } else {
        localStorage.removeItem('bk_origin');
      }
    } catch {
      // ignore
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('apiKey', bkApiKey.trim());
      if (bkOrigin.trim()) queryParams.set('origin', bkOrigin.trim());

      const res = await fetch(`/api/businesskoro/products?${queryParams.toString()}`);
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}: Failed to fetch products from Business Koro.`);
      }

      const rawList = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      if (rawList.length === 0) {
        addToast('Connected to Business Koro, but no products were returned in your account feed.', 'warning');
      }

      const formatted = rawList.map((item: any, idx: number) => {
        const suggested = Number(item.suggestedPrice) || 1200;
        // Default margin +20%
        const delta = (suggested * bkAdjustmentValue) / 100;
        const initialSellingPrice = Math.round(
          bkAdjustmentDir === 'increase' ? suggested + delta : Math.max(1, suggested - delta)
        );

        const images = Array.isArray(item.images) && item.images.length > 0
          ? item.images
          : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'];

        return {
          id: String(item.id || `bk-${idx}`),
          name: String(item.name || `Business Koro Product #${idx + 1}`),
          description: String(item.description || 'Verified dropshipping product supplied by Business Koro.'),
          images,
          suggestedPrice: suggested,
          sellingPrice: initialSellingPrice,
          inStock: item.inStock !== false,
          selected: true,
        };
      });

      setBkProducts(formatted);
      addToast(`Fetched ${formatted.length} products from Business Koro API!`, 'success');
    } catch (err: any) {
      setBkError(err.message || 'Failed to connect to Business Koro.');
      addToast(err.message || 'Failed to connect to Business Koro', 'error');
    } finally {
      setIsLoadingBk(false);
    }
  };

  const handleApplyBkGlobalPriceAdjustment = () => {
    if (bkProducts.length === 0) return;
    setBkProducts(prev =>
      prev.map(p => {
        let delta = 0;
        if (bkAdjustmentType === 'percent') {
          delta = (p.suggestedPrice * bkAdjustmentValue) / 100;
        } else {
          delta = bkAdjustmentValue;
        }
        const newPrice = Math.round(
          bkAdjustmentDir === 'increase'
            ? p.suggestedPrice + delta
            : Math.max(1, p.suggestedPrice - delta)
        );
        return { ...p, sellingPrice: newPrice };
      })
    );
    addToast(
      `Updated selling prices for all products (${bkAdjustmentDir === 'increase' ? '+' : '-'}${bkAdjustmentValue}${bkAdjustmentType === 'percent' ? '%' : '৳'})`,
      'success'
    );
  };

  const handleUpdateSingleBkPrice = (id: string, price: number) => {
    setBkProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, sellingPrice: Math.max(1, price) } : p))
    );
  };

  const handleToggleBkSelect = (id: string) => {
    setBkProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleToggleBkSelectAll = (select: boolean) => {
    setBkProducts(prev => prev.map(p => ({ ...p, selected: select })));
  };

  const handleImportBkProductsToDatabase = () => {
    const selected = bkProducts.filter(p => p.selected);
    if (selected.length === 0) {
      addToast('Please select at least one product to import.', 'error');
      return;
    }

    setIsImportingBk(true);
    let successCount = 0;

    selected.forEach((p, idx) => {
      const slug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}-${idx}`;
      const sku = `BK-${p.id.slice(-6).toUpperCase()}`;

      const newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        title: p.name,
        slug,
        description: p.description,
        price: p.sellingPrice,
        stockQuantity: p.inStock ? 45 : 0,
        sku,
        categoryId: bkTargetCategory,
        images: p.images,
        isPublished: true,
        rating: 4.9,
        reviewsCount: Math.floor(15 + Math.random() * 30),
        brand: 'Business Koro',
        features: [
          'Supplied via Business Koro API',
          `Base suggested price: ${formatBDT(p.suggestedPrice)}`,
          `Reseller markup profit: ${formatBDT(p.sellingPrice - p.suggestedPrice)}`,
        ],
      };

      const ok = addProduct(newProduct);
      if (ok) successCount++;
    });

    setIsImportingBk(false);
    addToast(
      `Successfully imported ${successCount} products from Business Koro into Firestore Database and Storefront!`,
      'success'
    );
  };

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
      <div className="flex border-b border-gray-200 gap-4 text-xs font-semibold overflow-x-auto pb-px">
        <button
          onClick={() => setActiveImportMode('businesskoro')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeImportMode === 'businesskoro'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <span>Business Koro API (বিজনেস করো)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
            API v1
          </span>
        </button>

        <button
          onClick={() => setActiveImportMode('url-scraper')}
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap ${
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
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap ${
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
          className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeImportMode === 'json'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Raw JSON Feed</span>
        </button>
      </div>

      {/* MODE 0: Business Koro API (বাংলাদেশ ড্রপশিপিং) */}
      {activeImportMode === 'businesskoro' && (
        <div className="space-y-6">
          {/* Business Koro API Connect Card */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                  BK
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span>Business Koro Storefront API Integration</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
                      https://api.businesskoro.com/api/v1/storefront
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    আপনার বিজনেস করো অ্যাকাউন্ট থেকে সরাসরি প্রোডাক্ট ডাটাবেজে ইমপোর্ট করুন, দাম বাড়িয়ে বা কমিয়ে নিজের বিক্রয় মূল্য নির্ধারণ করুন।
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleFetchBkProducts} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API Key */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Business Koro API Key (x-api-key) *
                  </label>
                  <div className="relative">
                    <input
                      type={bkShowKey ? 'text' : 'password'}
                      required
                      value={bkApiKey}
                      onChange={e => setBkApiKey(e.target.value)}
                      placeholder="আপনার Business Koro API Key পেস্ট করুন..."
                      className="w-full pr-16 pl-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-gray-900 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setBkShowKey(!bkShowKey)}
                      className="absolute right-2 top-2 px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                    >
                      {bkShowKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    প্রতিটি রিকোয়েস্টে <code className="text-emerald-700 font-mono">x-api-key</code> হেডার হিসেবে প্রেরিত হবে।
                  </p>
                </div>

                {/* Optional Origin / Domain */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Domain / Origin Header (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={bkOrigin}
                    onChange={e => setBkOrigin(e.target.value)}
                    placeholder="e.g. https://your-domain.com (খালি রাখতে পারেন)"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-gray-900 bg-white font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    ড্যাশবোর্ডে ডোমেইন সেট করা থাকলে দিন, ঝামেলা এড়াতে খালিও রাখতে পারেন।
                  </p>
                </div>
              </div>

              {bkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{bkError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-500">
                  {bkProducts.length > 0
                    ? `মোট লোডকৃত প্রোডাক্ট: ${bkProducts.length} টি`
                    : 'প্রোডাক্ট দেখতে API Key দিয়ে লোড করুন'}
                </span>
                <button
                  type="submit"
                  disabled={isLoadingBk}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoadingBk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>লোডিং হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>প্রোডাক্ট লোড করুন (Fetch Products)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Price Adjustment & Margin Controls (Directly answers: ami jeno eta price barate komate pari seta thik korba) */}
          {bkProducts.length > 0 && (
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>প্রাইস ও প্রফিট মার্জিন কন্ট্রোল (Markup / Price Adjustment)</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    বিজনেস করো এর suggestedPrice হলো তাদের প্রত্যাশিত পাইকারি/বেজ প্রাইস। আপনি পছন্দমতো বাড়াতে বা কমাতে পারেন।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">টার্গেট ক্যাটাগরি:</span>
                  <select
                    value={bkTargetCategory}
                    onChange={e => setBkTargetCategory(e.target.value)}
                    className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Modifier Rules */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                {/* Direction: Increase / Decrease */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    প্রাইস পরিবর্তন:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBkAdjustmentDir('increase')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        bkAdjustmentDir === 'increase'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      + বাড়ান (Markup)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBkAdjustmentDir('decrease')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        bkAdjustmentDir === 'decrease'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      - কমান (Discount)
                    </button>
                  </div>
                </div>

                {/* Type: Percent or Fixed */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    হিসাব পদ্ধতি:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBkAdjustmentType('percent')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        bkAdjustmentType === 'percent'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      % শতকরা
                    </button>
                    <button
                      type="button"
                      onClick={() => setBkAdjustmentType('fixed')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        bkAdjustmentType === 'fixed'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ৳ নির্দিষ্ট টাকা
                    </button>
                  </div>
                </div>

                {/* Amount / Value */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    পরিমাণ ({bkAdjustmentType === 'percent' ? '%' : '৳'}):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bkAdjustmentValue}
                    onChange={e => setBkAdjustmentValue(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 text-white border border-slate-700 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Apply Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleApplyBkGlobalPriceAdjustment}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-all"
                  >
                    সবগুলোতে প্রয়োগ করুন
                  </button>
                </div>
              </div>

              {/* Selection Summary and Database Bulk Push */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleBkSelectAll(true)}
                    className="text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => handleToggleBkSelectAll(false)}
                    className="text-xs text-slate-400 hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-300 font-medium">
                    নির্বাচিত: <strong className="text-emerald-400 font-mono">{bkProducts.filter(p => p.selected).length}</strong> / {bkProducts.length} টি
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isImportingBk || bkProducts.filter(p => p.selected).length === 0}
                  onClick={handleImportBkProductsToDatabase}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-all disabled:opacity-50"
                >
                  {isImportingBk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ডাটাবেজে সেভ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>নির্বাচিত প্রোডাক্ট ডাটাবেজে ইমপোর্ট করুন ({bkProducts.filter(p => p.selected).length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Products Grid with Individual Selling Price Adjuster */}
          {bkProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  প্রোডাক্ট তালিকা ও কাস্টম বিক্রয় মূল্য নির্ধারণ
                </h4>
                <span className="text-[11px] text-gray-500">
                  নিচের ইনপুট বক্সে সরাসরি যেকোনো দাম পরিবর্তন করতে পারেন
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bkProducts.map(p => {
                  const profit = p.sellingPrice - p.suggestedPrice;
                  const profitPercent = ((profit / p.suggestedPrice) * 100).toFixed(1);

                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                        p.selected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs'
                          : 'border-gray-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={p.selected}
                          onChange={() => handleToggleBkSelect(p.id)}
                          className="mt-1.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />

                        {/* Image */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold truncate max-w-[140px]">
                              ID: {p.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                p.inStock
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {p.inStock ? 'স্টকে আছে' : 'স্টক শেষ'}
                            </span>
                          </div>

                          <h5 className="font-bold text-gray-900 text-xs mt-1 line-clamp-1">
                            {p.name}
                          </h5>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      {/* Pricing Row: Suggested vs Selling Price vs Profit */}
                      <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50/70 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">
                            প্রস্তাবিত পাইকারি মূল্য
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-600">
                            {formatBDT(p.suggestedPrice)}
                          </span>
                        </div>

                        {/* Reseller Selling Price Input */}
                        <div className="flex items-center gap-1.5">
                          <div>
                            <span className="text-[10px] text-gray-600 block font-bold">
                              আপনার বিক্রয় মূল্য (৳) *
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={p.sellingPrice}
                              onChange={e => handleUpdateSingleBkPrice(p.id, Number(e.target.value))}
                              className="w-28 px-2 py-1 text-xs font-mono font-bold bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>

                        {/* Profit Tag */}
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block">
                            সম্ভাব্য লাভ
                          </span>
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                              profit >= 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {profit >= 0 ? `+${formatBDT(profit)}` : `-${formatBDT(Math.abs(profit))}`} ({profitPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
