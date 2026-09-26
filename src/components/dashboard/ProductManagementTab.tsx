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
  Globe,
  Link,
  Sparkles,
  Check,
  CheckCircle2,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';

export const ProductManagementTab: React.FC = () => {
  const {
    products,
    categories,
    currentUser,
    addProduct,
    updateProductStock,
    toggleProductPublish,
    deleteProduct,
    canDeleteProduct,
    setDashboardTab,
    addToast,
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
      addToast('অনুগ্রহ করে একটি প্রোডাক্টের URL দিন!', 'error');
      return;
    }
    setIsScraping(true);
    setScrapedProduct(null);
    try {
      const res = await fetch(`/api/scrape-product?url=${encodeURIComponent(scrapeUrl.trim())}`);
      const data = await res.json();
      if (res.ok && data.success && data.product) {
        setScrapedProduct({
          title: data.product.title || '',
          description: data.product.description || '',
          price: data.product.price || 990,
          currency: data.product.currency || 'BDT',
          brand: data.product.brand || 'Imported Brand',
          sku: data.product.sku || `PROD-${Date.now().toString().slice(-5)}`,
          images: Array.isArray(data.product.images) && data.product.images.length > 0 
            ? data.product.images 
            : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
          categoryId: categories[0]?.id || 'cat-general',
        });
        addToast('প্রোডাক্টের ছবি ও তথ্য সফলভাবে এক্সট্রাক্ট করা হয়েছে!', 'success');
      } else {
        addToast(data.error || 'এই URL থেকে তথ্য সংগ্রহ করা যায়নি। লিংকটি সঠিক কিনা দেখুন।', 'error');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      addToast(error.message || 'স্ক্র্যাপার রিকোয়েস্ট ব্যর্থ হয়েছে!', 'error');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveScrapedProduct = () => {
    if (!scrapedProduct) return;
    if (!scrapedProduct.title.trim()) {
      addToast('প্রোডাক্টের নাম থাকা আবশ্যক!', 'error');
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
      images: scrapedProduct.images.length > 0 ? scrapedProduct.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
      isPublished: true,
      brand: scrapedProduct.brand || 'Store Item',
      rating: 5,
      reviewsCount: 1,
    });

    if (success) {
      addToast(`"${scrapedProduct.title}" সফলভাবে স্টোরে যুক্ত হয়েছে!`, 'success');
      setScrapedProduct(null);
      setScrapeUrl('');
    } else {
      addToast('প্রোডাক্ট সেভ করতে সমস্যা হয়েছে।', 'error');
    }
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesTitle = p.title.toLowerCase().includes(q);
      const matchesSku = p.sku.toLowerCase().includes(q);
      if (!matchesTitle && !matchesSku) return false;
    }
    if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;
    if (statusFilter === 'published' && !p.isPublished) return false;
    if (statusFilter === 'draft' && p.isPublished) return false;
    return true;
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
                <span>প্রোডাক্ট URL থেকে সরাসরি প্রোডাক্ট যোগ করুন (Auto Extractor)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold uppercase tracking-wider">
                  Auto-Fill
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                যেকোনো ওয়েবসাইটের (যেমন Daraz, Amazon, Shopify, ইত্যাদি) পণ্যের লিংক পেস্ট করলে ছবি, টাইটেল ও বিবরণ স্বয়ংক্রিয়ভাবে এক্সট্রাক্ট হয়ে যাবে
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
              placeholder="https://www.daraz.com.bd/products/... বা যেকোনো প্রোডাক্টের URL পেস্ট করুন"
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isScraping || !scrapeUrl.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>তথ্য আনা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>লিংক থেকে তথ্য আনুন</span>
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
                <span>সফলভাবে তথ্য এক্সট্রাক্ট করা হয়েছে! নিচের তথ্যগুলো চেক করে স্টোরে সেভ করুন:</span>
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
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative">
                  <img
                    src={scrapedProduct.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'}
                    alt="Extracted Product"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                    {scrapedProduct.images.length} টি ছবি পাওয়া গেছে
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
                    প্রোডাক্টের নাম (Title):
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
                      বিক্রয় মূল্য (Price BDT):
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
                      ক্যাটাগরি (Category):
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
                      ব্র্যান্ড / উৎস:
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
                    বিবরণ (Description):
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
                    বাতিল করুন
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveScrapedProduct}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>স্টোরে প্রোডাক্টটি যুক্ত করুন (Add to Store Catalog)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Controls: Search, Filters, and Add Product */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
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
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
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
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All States</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-import-api-products"
            onClick={() => setDashboardTab('importer')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer shadow-xs shrink-0 border border-slate-800"
            title="Import Products via External API & Web Scraper"
          >
            <DownloadCloud className="w-4 h-4 text-cyan-400" />
            <span>API & Web Importer</span>
          </button>

          <button
            id="btn-add-product"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
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
                <th className="py-3 px-4 font-semibold">Unit Price</th>
                <th className="py-3 px-4 font-semibold">Stock Quantity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No products found matching active filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const cat = categories.find(c => c.id === product.categoryId);
                  const isLow = product.stockQuantity <= 5;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Product Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.images[0] ||
                              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&q=80'
                            }
                            alt={product.title}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900 block truncate max-w-xs">
                              {product.title}
                            </span>
                            <span className="font-mono text-[11px] text-gray-400">
                              SKU: {product.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-gray-600">
                        {cat?.name || 'Unassigned'}
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
    </div>
  );
};
