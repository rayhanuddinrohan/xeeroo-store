/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import {
  X,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

// Preset high-resolution tech image URLs for quick selection
const TECH_IMAGE_PRESETS = [
  {
    name: 'Studio ANC Headphones (Front)',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Headphones Side Acoustic Detail',
    url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Minimal Titanium Smartwatch',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Smartwatch Sensor / Backplate',
    url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Mechanical Desk Keyboard',
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Custom Keycap Switch Close-up',
    url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Wireless Charger & Luminaire Desk',
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Precision Cinema Optics 35mm',
    url: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=1000&q=85',
  },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, addProduct, updateProduct, currentUser, addToast } = useStore();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(199);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [brand, setBrand] = useState('XEEROO Gear');
  const [featuresText, setFeaturesText] = useState('');

  // Primary Thumbnail Image URL
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Additional Gallery Image URLs
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkUrlsInput, setBulkUrlsInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title);
      setSlug(productToEdit.slug);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price);
      setStockQuantity(productToEdit.stockQuantity);
      setSku(productToEdit.sku);
      setCategoryId(productToEdit.categoryId);
      setIsPublished(productToEdit.isPublished);
      setBrand(productToEdit.brand || 'XEEROO Gear');
      setFeaturesText(productToEdit.features?.join('\n') || '');

      const productImgs = productToEdit.images || [];
      setThumbnailUrl(productImgs[0] || '');
      setGalleryUrls(productImgs.slice(1));
    } else {
      // Default new product values
      setTitle('');
      setSlug('');
      setDescription('');
      setPrice(149.0);
      setStockQuantity(15);
      setSku(`XRO-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategoryId(categories[0]?.id || 'cat-audio');
      setIsPublished(true);
      setBrand('XEEROO Gear');
      setFeaturesText(
        'Engineered with premium aerospace alloy\nUltra-low latency connectivity\nUSB-C Rapid Fast Charging\nOfficial XEEROO Warranty Coverage'
      );
      setThumbnailUrl(
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85'
      );
      setGalleryUrls([
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=85',
      ]);
    }
    setNewGalleryInput('');
    setBulkUrlsInput('');
    setShowBulkAdd(false);
    setShowPresets(false);
  }, [productToEdit, categories, isOpen]);

  // Auto-generate slug when title changes (if adding new product)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!productToEdit) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  // Add individual gallery URL
  const handleAddGalleryUrl = () => {
    const trimmed = newGalleryInput.trim();
    if (!trimmed) return;
    if (galleryUrls.includes(trimmed) || thumbnailUrl === trimmed) {
      addToast('This image URL is already in the product images list.', 'error');
      return;
    }
    setGalleryUrls(prev => [...prev, trimmed]);
    setNewGalleryInput('');
  };

  // Bulk add gallery URLs
  const handleBulkAddUrls = () => {
    if (!bulkUrlsInput.trim()) return;
    // Split by newlines or commas
    const parsedUrls = bulkUrlsInput
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(u => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));

    if (parsedUrls.length === 0) {
      addToast('No valid URLs found. Make sure URLs begin with http:// or https://', 'error');
      return;
    }

    const uniqueNewUrls = parsedUrls.filter(
      u => !galleryUrls.includes(u) && u !== thumbnailUrl
    );

    if (uniqueNewUrls.length === 0) {
      addToast('All provided URLs are already in the gallery.', 'info');
      return;
    }

    setGalleryUrls(prev => [...prev, ...uniqueNewUrls]);
    setBulkUrlsInput('');
    setShowBulkAdd(false);
    addToast(`Added ${uniqueNewUrls.length} images to gallery!`, 'success');
  };

  // Set gallery image as primary thumbnail
  const handlePromoteToThumbnail = (index: number) => {
    const targetUrl = galleryUrls[index];
    const previousThumbnail = thumbnailUrl;

    setThumbnailUrl(targetUrl);
    setGalleryUrls(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return previousThumbnail.trim() ? [previousThumbnail, ...filtered] : filtered;
    });
    addToast('Set as primary cover image!', 'success');
  };

  // Remove gallery image
  const handleRemoveGalleryUrl = (index: number) => {
    setGalleryUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Move gallery image position
  const handleMoveGalleryUrl = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryUrls.length) return;

    setGalleryUrls(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Add preset image
  const handleSelectPreset = (url: string) => {
    if (!thumbnailUrl.trim()) {
      setThumbnailUrl(url);
      addToast('Added as primary thumbnail', 'success');
    } else if (!galleryUrls.includes(url) && thumbnailUrl !== url) {
      setGalleryUrls(prev => [...prev, url]);
      addToast('Added preset to gallery', 'success');
    } else {
      addToast('Image already exists in list', 'info');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !sku.trim() || price <= 0) {
      addToast('Please provide valid title, SKU, and positive price.', 'error');
      return;
    }

    // Assemble all images: primary thumbnail + gallery images
    const allImages: string[] = [];
    if (thumbnailUrl.trim()) {
      allImages.push(thumbnailUrl.trim());
    }

    galleryUrls.forEach(url => {
      const trimmed = url.trim();
      if (trimmed && !allImages.includes(trimmed)) {
        allImages.push(trimmed);
      }
    });

    // Fallback if user cleared everything
    if (allImages.length === 0) {
      allImages.push(
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85'
      );
    }

    const features = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    if (productToEdit) {
      const ok = updateProduct(productToEdit.id, {
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description.trim(),
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        sku: sku.trim(),
        categoryId,
        images: allImages,
        isPublished,
        brand: brand.trim(),
        features,
      });
      if (ok) onClose();
    } else {
      const ok = addProduct({
        title: title.trim(),
        slug: slug.trim() || `prod-${Date.now()}`,
        description: description.trim(),
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        sku: sku.trim(),
        categoryId,
        images: allImages,
        isPublished,
        brand: brand.trim(),
        rating: 5.0,
        reviewsCount: 1,
        features,
        updatedBy: currentUser?.id || 'usr-admin-xeeroo',
      });
      if (ok) onClose();
    }
  };

  const totalImageCount = (thumbnailUrl.trim() ? 1 : 0) + galleryUrls.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {productToEdit ? `Edit Product: ${productToEdit.title}` : 'Add New Inventory Product'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure specs, pricing, and all thumbnail & gallery image URLs
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. XEEROO Pulse Studio ANC Wireless Headphones"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="e.g. XEEROO Acoustics"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Unit Price (৳ BDT) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Stock Quantity (Units) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={e => setStockQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* IMAGE URL MANAGEMENT (THUMBNAIL + GALLERY) */}
          {/* ========================================================= */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Product Images & Gallery URLs
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {totalImageCount} {totalImageCount === 1 ? 'Image' : 'Images'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Preset Suggestions</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkAdd(!showBulkAdd)}
                  className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Bulk Paste URLs</span>
                </button>
              </div>
            </div>

            {/* Presets Tray */}
            {showPresets && (
              <div className="bg-white border border-amber-200 rounded-xl p-3 animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Click to add high-resolution photo preset:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPresets(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TECH_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className="group flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition-all cursor-pointer"
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-8 h-8 rounded object-cover shrink-0 border"
                      />
                      <span className="text-[10px] font-medium text-slate-700 group-hover:text-blue-700 leading-tight line-clamp-2">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk Add Drawer */}
            {showBulkAdd && (
              <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900">
                    Paste Multiple Image URLs (One per line or comma separated):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBulkAdd(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={bulkUrlsInput}
                  onChange={e => setBulkUrlsInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1&#10;https://images.unsplash.com/photo-2&#10;https://images.unsplash.com/photo-3"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleBulkAddUrls}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Add All to Gallery
                  </button>
                </div>
              </div>
            )}

            {/* 1. PRIMARY THUMBNAIL SECTION */}
            <div className="bg-white border-2 border-blue-200 rounded-xl p-3 sm:p-4 relative">
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-slate-900">
                  Primary Thumbnail Image URL (Main Storefront Display) *
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Thumbnail Preview Box */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 shrink-0 shadow-xs flex items-center justify-center">
                  {thumbnailUrl.trim() ? (
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-slate-400 text-center p-2">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span className="text-[9px] block">No URL</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 right-1 bg-black/75 text-[9px] font-bold text-white text-center py-0.5 rounded backdrop-blur-xs">
                    THUMBNAIL
                  </span>
                </div>

                {/* Thumbnail URL Input */}
                <div className="flex-1 w-full space-y-1.5">
                  <input
                    type="url"
                    required
                    value={thumbnailUrl}
                    onChange={e => setThumbnailUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>This is the first image shown on catalog cards, cart, and product page header.</span>
                    {thumbnailUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl('')}
                        className="text-red-500 hover:text-red-700 font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. GALLERY IMAGES SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Additional Gallery Images (Angle Views, Details, Lifestyle)
                </span>
                <span className="text-[11px] text-slate-500">
                  {galleryUrls.length} {galleryUrls.length === 1 ? 'gallery photo' : 'gallery photos'}
                </span>
              </div>

              {/* Gallery Image Rows */}
              {galleryUrls.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {galleryUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs hover:border-slate-300 transition-all"
                    >
                      {/* Mini Preview */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={url}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* URL input */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            Gallery #{idx + 1}
                          </span>
                        </div>
                        <input
                          type="url"
                          value={url}
                          onChange={e => {
                            const updated = [...galleryUrls];
                            updated[idx] = e.target.value;
                            setGalleryUrls(updated);
                          }}
                          className="w-full px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePromoteToThumbnail(idx)}
                          className="p-1.5 rounded-md hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                          title="Set as Primary Thumbnail"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveGalleryUrl(idx, 'up')}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === galleryUrls.length - 1}
                          onClick={() => handleMoveGalleryUrl(idx, 'down')}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryUrl(idx)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/60 border border-dashed border-slate-300 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500">
                    No extra gallery images added yet. Add photos below so customers can view different angles!
                  </p>
                </div>
              )}

              {/* Add New Gallery Image Row */}
              <div className="flex gap-2 items-center pt-1">
                <input
                  type="url"
                  value={newGalleryInput}
                  onChange={e => setNewGalleryInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGalleryUrl();
                    }
                  }}
                  placeholder="Enter additional image URL (e.g. https://...)"
                  className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  disabled={!newGalleryInput.trim()}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add URL</span>
                </button>
              </div>
            </div>

            {/* Visual Gallery Preview Strip */}
            {totalImageCount > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Customer Storefront Gallery Order:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {thumbnailUrl.trim() && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-blue-600 shrink-0">
                      <img
                        src={thumbnailUrl}
                        alt="Primary Cover"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-0 right-0 bg-blue-600 text-[8px] font-bold text-white px-1 rounded-bl">
                        #1
                      </span>
                    </div>
                  )}
                  {galleryUrls.map((gUrl, idx) => (
                    <div
                      key={idx}
                      className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shrink-0"
                    >
                      <img
                        src={gUrl}
                        alt={`Preview ${idx + 2}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-0 right-0 bg-slate-800 text-[8px] font-bold text-white px-1 rounded-bl">
                        #{idx + 2}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description & Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe product craftsmanship, materials, compatibility, acoustics, etc."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Features (one per line) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Key Features (one per line)
              </label>
              <textarea
                rows={3}
                value={featuresText}
                onChange={e => setFeaturesText(e.target.value)}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              ></textarea>
            </div>

            {/* Published State Checkbox */}
            <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Publish to Storefront Catalog
                </span>
                <span className="text-[11px] text-gray-500">
                  When enabled, customers can view and purchase this item. If draft, only staff & admin can see it.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-product"
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{productToEdit ? 'Save Product Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
