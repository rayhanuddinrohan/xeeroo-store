/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatBDT } from '../../utils/currency';
import { ProductFormModal } from './ProductFormModal';
import { ProductImportModal } from './ProductImportModal';
import { SyncProductsModal } from './SyncProductsModal';
import { scrapeProductFromAnyUrl } from '../../utils/productScraper';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Layers,
  ArrowUpDown,
  DownloadCloud,
  RefreshCw,
  Globe,
  Link,
  Sparkles,
  Check,
  CheckCircle2,
  Loader2,
  X,
  ExternalLink,
  Clipboard,
  Package,
  Share2,
} from 'lucide-react';

const InlinePriorityEditor: React.FC<{
  product: Product;
  onUpdate: (id: string, priority: number | undefined) => void;
}> = ({ product, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState<string>(product.priority ? String(product.priority) : '');

  const handleSave = () => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      onUpdate(product.id, num);
    } else {
      onUpdate(product.id, undefined);
      setVal('');
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setVal(product.priority ? String(product.priority) : '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        <input
          type="number"
          min="1"
          step="1"
          autoFocus
          placeholder="Rank #"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-16 px-1.5 py-0.5 text-xs font-bold font-mono border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 bg-white"
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
          title="Save rank"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setVal(product.priority ? String(product.priority) : '');
            setIsEditing(false);
          }}
          className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setVal(product.priority ? String(product.priority) : '');
        setIsEditing(true);
      }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer group ${
        typeof product.priority === 'number' && product.priority > 0
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
          : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title="Click to set or change priority rank at any time"
    >
      {typeof product.priority === 'number' && product.priority > 0 ? (
        <>
          <span className="text-amber-500">⭐</span>
          <span>Rank #{product.priority}</span>
        </>
      ) : (
        <>
          <span className="text-gray-400 group-hover:text-gray-600">+</span>
          <span>Unranked</span>
        </>
      )}
      <Edit className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-gray-400 ml-0.5" />
    </button>
  );
};

export const ProductManagementTab: React.FC = () => {
  const {
    products,
    categories,
    currentUser,
    addProduct,
    updateProductStock,
    updateProductPriority,
    toggleProductPublish,
    deleteProduct,
    canDeleteProduct,
    setDashboardTab,
    addToast,
    facebookConfig,
    postProductToFacebook,
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [postingProdId, setPostingProdId] = useState<string | null>(null);

  // Quick URL Scraper state
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedProduct, setScrapedProduct] = useState<{
    title: string;
    description: string;
    price: number;
    currency: string;
    brand: string;
    sku: string;
    images: string[];
    categoryId: string;
  } | null>(null);

  const handleScrapeUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scrapeUrl.trim()) {
      addToast('Please provide a valid product URL!', 'error');
      return;
    }
    setIsScraping(true);
    setScrapedProduct(null);
    try {
      const prod = await scrapeProductFromAnyUrl(scrapeUrl.trim());
      setScrapedProduct({
        title: prod.title || '',
        description: prod.description || '',
        price: prod.price || 990,
        currency: prod.currency || 'BDT',
        brand: prod.brand || 'Imported Brand',
        sku: prod.sku || `PROD-${Date.now().toString().slice(-5)}`,
        images: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : [],
        categoryId: categories[0]?.id || 'cat-general',
      });
      addToast('Product details and images extracted successfully!', 'success');
    } catch (err: unknown) {
      const error = err as { message?: string };
      addToast(error.message || 'Could not fetch data from this URL. Please verify the link.', 'error');
    } finally {
      setIsScraping(false);
    }
  };

  const handlePasteScrapeUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setScrapeUrl(text.trim());
        addToast('Link pasted successfully!', 'success');
      } else {
        addToast('No text or link found on clipboard.', 'warning');
      }
    } catch {
      addToast('Clipboard permission denied. Press Ctrl+V to paste.', 'info');
    }
  };

  const handleSaveScrapedProduct = () => {
    if (!scrapedProduct) return;
    if (!scrapedProduct.title.trim()) {
      addToast('Product title is required!', 'error');
      return;
    }

    const newSlug = scrapedProduct.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `prod-${Date.now()}`;

    const success = addProduct({
      title: scrapedProduct.title.trim(),
      slug: newSlug,
      description: scrapedProduct.description.trim() || 'High quality tech gear.',
      price: scrapedProduct.price || 990,
      stockQuantity: 50,
      sku: scrapedProduct.sku || `SKU-${Date.now().toString().slice(-4)}`,
      categoryId: scrapedProduct.categoryId || (categories[0]?.id || 'cat-general'),
      images: scrapedProduct.images && scrapedProduct.images.length > 0 ? scrapedProduct.images : [],
      isPublished: true,
      brand: scrapedProduct.brand || 'Store Item',
      rating: 5,
      reviewsCount: 1,
    });

    if (success) {
      addToast(`"${scrapedProduct.title}" added to store catalog successfully!`, 'success');
      setScrapedProduct(null);
      setScrapeUrl('');
    } else {
      addToast('Failed to save product.', 'error');
    }
  };

  // Filtered products list with priority ranks 1, 2, 3... strictly at the top
  const filteredProducts = products
    .filter(p => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesSku) return false;
      }
      if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;
      if (statusFilter === 'published' && !p.isPublished) return false;
      if (statusFilter === 'draft' && p.isPublished) return false;
      return true;
    })
    .sort((a, b) => {
      const aPriority = typeof a.priority === 'number' && a.priority > 0 ? a.priority : null;
      const bPriority = typeof b.priority === 'number' && b.priority > 0 ? b.priority : null;
      if (aPriority !== null && bPriority !== null) return aPriority - bPriority;
      if (aPriority !== null) return -1;
      if (bPriority !== null) return 1;
      return 0;
    });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    if (!canDeleteProduct) {
      addToast(
        'RBAC Permission Denied: Moderators are strictly restricted from deleting products. Admin authority required.',
        'error'
      );
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete "${product.title}"?`)) {
      deleteProduct(product.id);
    }
  };

  const handlePostToFacebook = async (p: Product) => {
    setPostingProdId(p.id);
    try {
      await postProductToFacebook(p);
    } finally {
      setPostingProdId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Instant URL Scraper Card (Auto-Extract from Product Link) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-2xl border border-slate-700/80 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Add Product Directly from Product URL (Auto Extractor)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold uppercase tracking-wider">
                  Auto-Fill
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Paste any product link (Daraz, Amazon, Shopify, etc.) to automatically extract title, images, and description
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleScrapeUrl} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Link className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="Paste product URL (e.g. https://www.daraz.com.bd/products/...)"
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handlePasteScrapeUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
            title="Paste link from clipboard"
          >
            <Clipboard className="w-4 h-4 text-slate-400" />
            <span>Paste</span>
          </button>
          <button
            type="submit"
            disabled={isScraping || !scrapeUrl.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching Details...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Extract Product Details</span>
              </>
            )}
          </button>
        </form>

        {/* Live Extracted Preview Card */}
        {scrapedProduct && (
          <div className="bg-white text-gray-900 p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Product details extracted successfully! Verify and save to store:</span>
              </span>
              <button
                type="button"
                onClick={() => setScrapedProduct(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Product Thumbnail & Gallery */}
              <div className="space-y-2 md:col-span-1">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative flex items-center justify-center">
                  {scrapedProduct.images && scrapedProduct.images[0] ? (
                    <img
                      src={scrapedProduct.images[0]}
                      alt="Extracted Product"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 p-4">
                      <Package className="w-8 h-8 text-gray-300 mb-1" />
                      <span className="text-[11px] font-medium text-gray-400">No Image Extracted</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                    {scrapedProduct.images.length} images found
                  </span>
                </div>
                {/* Thumbnails list */}
                {scrapedProduct.images.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto py-1">
                    {scrapedProduct.images.slice(0, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Thumb ${idx}`}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Editable Fields */}
              <div className="space-y-3 md:col-span-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Product Title:
                  </label>
                  <input
                    type="text"
                    value={scrapedProduct.title}
                    onChange={(e) => setScrapedProduct({ ...scrapedProduct, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Selling Price (BDT ৳):
                    </label>
                    <input
                      type="number"
                      value={scrapedProduct.price}
                      onChange={(e) => setScrapedProduct({ ...scrapedProduct, price: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Category:
                    </label>
                    <select
                      value={scrapedProduct.categoryId}
                      onChange={(e) => setScrapedProduct({ ...scrapedProduct, categoryId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Brand / Source:
                    </label>
                    <input
                      type="text"
                      value={scrapedProduct.brand}
                      onChange={(e) => setScrapedProduct({ ...scrapedProduct, brand: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Description:
                  </label>
                  <textarea
                    rows={3}
                    value={scrapedProduct.description}
                    onChange={(e) => setScrapedProduct({ ...scrapedProduct, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Confirm Add Button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setScrapedProduct(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveScrapedProduct}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Add to Store Catalog</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Controls: Search, Filters, and Action Buttons (Responsive & Wrap Cleanly) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Search & Department Filters */}
        <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-2 max-w-full xl:max-w-xl">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none shrink-0"
          >
            <option value="all">All Departments</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none shrink-0"
          >
            <option value="all">All States</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>

        {/* Action Buttons: Responsive Flex-Wrap, No Overflow */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="btn-add-product"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs shrink-0 active:scale-95"
            title="Create and publish a new product"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Product</span>
          </button>

          <button
            id="btn-sync-api-products"
            onClick={() => setIsSyncModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs shrink-0 active:scale-95"
            title="Fetch and sync products automatically from BusinessKoro API into Firestore"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
            <span>Sync Import</span>
          </button>

          <button
            id="btn-fb-autopost"
            onClick={() => setDashboardTab('facebook')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0 active:scale-95"
            title="Facebook Page Auto-Post Settings & Live Preview"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Auto FB Post</span>
            {facebookConfig?.enabled && facebookConfig?.autoPostOnAdd && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Auto-Post Enabled"></span>
            )}
          </button>

          <button
            id="btn-import-api-products"
            onClick={() => setDashboardTab('importer')}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0 border border-slate-700 active:scale-95"
            title="Import Products via External API & Web Scraper"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>API Importer</span>
          </button>

          <button
            onClick={() => setDashboardTab('categories')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer border border-gray-200 shadow-xs shrink-0 active:scale-95"
            title="Create and manage product categories"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Categories</span>
          </button>
        </div>
      </div>

      {/* Product Management Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Priority / Rank</th>
                <th className="py-3 px-4 font-semibold">Unit Price</th>
                <th className="py-3 px-4 font-semibold">Stock Quantity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No products found matching active filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const cat = categories.find(c => c.id === product.categoryId);
                  const isLow = product.stockQuantity <= 5;
                  const thumbSrc =
                    (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) ||
                    (product as any).imageUrl ||
                    (product as any).image ||
                    (typeof product.images === 'string' ? product.images : '') ||
                    '';

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Product Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {thumbSrc ? (
                            <img
                              src={thumbSrc}
                              alt={product.title}
                              className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                if (target.nextElementSibling) {
                                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          {(!thumbSrc || !product.images || product.images.length === 0) && !(product as any).imageUrl && !(product as any).image && (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900 block truncate max-w-xs">
                              {product.title}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              {product.soldCount || 0} pcs sold
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-gray-600">
                        {cat?.name || 'Unassigned'}
                      </td>

                      {/* Priority / Rank */}
                      <td className="py-3 px-4">
                        <InlinePriorityEditor
                          product={product}
                          onUpdate={updateProductPriority}
                        />
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                        {formatBDT(product.price)}
                      </td>

                      {/* Stock Level with inline quick adjustments */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-gray-200 rounded bg-white">
                            <button
                              onClick={() => updateProductStock(product.id, product.stockQuantity - 1)}
                              disabled={product.stockQuantity <= 0}
                              className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                              title="Decrease stock"
                            >
                              -
                            </button>
                            <span
                              className={`px-2.5 py-0.5 text-xs font-bold min-w-7 text-center ${
                                product.stockQuantity === 0
                                  ? 'text-rose-600'
                                  : isLow
                                  ? 'text-amber-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {product.stockQuantity}
                            </span>
                            <button
                              onClick={() => updateProductStock(product.id, product.stockQuantity + 1)}
                              className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                              title="Increase stock"
                            >
                              +
                            </button>
                          </div>

                          {isLow && (
                            <span
                              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                              title="Low stock alert"
                            >
                              Low
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleProductPublish(product.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                            product.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {product.isPublished ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Post to Facebook Page Button */}
                          <button
                            type="button"
                            disabled={postingProdId === product.id}
                            onClick={() => handlePostToFacebook(product)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              product.facebookPostId
                                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title={
                              product.facebookPostId
                                ? `Posted to Facebook on ${product.facebookPostedAt ? new Date(product.facebookPostedAt).toLocaleDateString() : 'earlier'}. Click to repost.`
                                : 'Post this product with photo & caption to Facebook Page'
                            }
                          >
                            {postingProdId === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            id={`btn-edit-prod-${product.id}`}
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit product details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete button: Active for Admin, Warning tooltip for Moderator */}
                          <button
                            id={`btn-delete-prod-${product.id}`}
                            onClick={() => handleDeleteClick(product)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              canDeleteProduct
                                ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-gray-300 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title={
                              canDeleteProduct
                                ? 'Delete Product (Admin Only)'
                                : 'RBAC Protected: Moderators cannot delete products.'
                            }
                          >
                            {canDeleteProduct ? (
                              <Trash2 className="w-4 h-4" />
                            ) : (
                              <div className="relative">
                                <Trash2 className="w-4 h-4 opacity-40" />
                                <Lock className="w-2.5 h-2.5 text-amber-600 absolute -bottom-1 -right-1" />
                              </div>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
      />

      {/* Modal for Import via API */}
      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Modal for Automated BusinessKoro Sync */}
      <SyncProductsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
};
