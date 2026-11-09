/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { scrapeProductFromAnyUrl } from '../../utils/productScraper';
import { calculateDiscount } from '../../utils/pricing';
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
  Globe,
  Link,
  Loader2,
  Clipboard,
  Percent,
  Palette,
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

const POPULAR_COLORS = [
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Space Gray', hex: '#4B5563' },
  { name: 'Silver', hex: '#E5E7EB' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Gold', hex: '#D97706' },
  { name: 'Rose Gold', hex: '#FB7185' },
  { name: 'Midnight', hex: '#0F172A' },
];

const POPULAR_SIZES = ['Free Size', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Standard', 'One Size'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, addProduct, updateProduct, currentUser, addToast, addCategory, facebookConfig, postProductToFacebook } = useStore();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  // Dual Price Fields: Selling Price (MRP/Regular) & Current Price (Active/Discounted)
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [postToFacebook, setPostToFacebook] = useState(true);
  const [brand, setBrand] = useState('');
  const [priority, setPriority] = useState<number | ''>('');
  const [featuresText, setFeaturesText] = useState('');

  // Multi-Color State
  const [colors, setColors] = useState<{ name: string; hex?: string }[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#111827');

  // Multi-Size State
  const [sizes, setSizes] = useState<string[]>([]);
  const [newSizeName, setNewSizeName] = useState('');

  // Auto-calculated percentage discount based on formula: Math.round(((Selling - Current) / Selling) * 100)
  const discountInfo = useMemo(() => {
    return calculateDiscount(
      typeof sellingPrice === 'number' ? sellingPrice : undefined,
      typeof currentPrice === 'number' ? currentPrice : price
    );
  }, [sellingPrice, currentPrice, price]);

  // Primary Thumbnail Image URL
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Additional Gallery Image URLs
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkUrlsInput, setBulkUrlsInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  // Quick Add Category State
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Auto-fill from external URL state
  const [urlScrapeInput, setUrlScrapeInput] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);

  // Paste from clipboard handler
  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrlScrapeInput(text.trim());
        addToast('Link pasted successfully!', 'success');
      } else {
        addToast('No text or link found on clipboard.', 'warning');
      }
    } catch {
      addToast('Clipboard permission denied. Please paste using Ctrl+V.', 'info');
    }
  };

  const handleExtractFromUrl = async () => {
    if (!urlScrapeInput.trim()) {
      addToast('Please provide a valid product URL!', 'error');
      return;
    }
    setIsScrapingUrl(true);
    try {
      const p = await scrapeProductFromAnyUrl(urlScrapeInput.trim());
      if (p.title) {
        setTitle(p.title);
        setSlug(p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `prod-${Date.now()}`);
      }
      if (p.price) {
        setPrice(p.price);
        setCurrentPrice(p.price);
      }
      if ((p as any).originalPrice || (p as any).sellingPrice) {
        setSellingPrice(Number((p as any).originalPrice || (p as any).sellingPrice));
      }
      if (p.brand) setBrand(p.brand);
      if (p.sku) setSku(p.sku);
      if (Array.isArray(p.images) && p.images.length > 0) {
        setThumbnailUrl(p.images[0]);
        setGalleryUrls(p.images.slice(1));
      }
      addToast('Product details and images auto-filled from link!', 'success');
      setUrlScrapeInput('');
    } catch (err: unknown) {
      const error = err as { message?: string };
      addToast(error.message || 'Could not fetch data from link.', 'error');
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleQuickCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newCatName.trim();
    if (!catName) {
      addToast('Please enter a category name!', 'error');
      return;
    }
    const ok = addCategory(catName, newCatDesc.trim() || undefined);
    if (ok) {
      const generatedSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const created = categories.find(c => c.name.toLowerCase() === catName.toLowerCase() || c.slug === generatedSlug);
      if (created) {
        setCategoryId(created.id);
      }
      setNewCatName('');
      setNewCatDesc('');
      setShowQuickAddCategory(false);
    }
  };

  useEffect(() => {
    const validCats = categories.filter(c => c.id !== 'all');
    const defaultCatId = validCats[0]?.id || 'cat-audio';

    if (productToEdit) {
      setTitle(productToEdit.title);
      setSlug(productToEdit.slug);
      setDescription(productToEdit.description);

      const regPrice = (productToEdit.sellingPrice !== undefined && productToEdit.sellingPrice !== null)
        ? Number(productToEdit.sellingPrice)
        : ((productToEdit.originalPrice !== undefined && productToEdit.originalPrice !== null) ? Number(productToEdit.originalPrice) : '');
      const activePrice = (productToEdit.currentPrice !== undefined && productToEdit.currentPrice !== null)
        ? Number(productToEdit.currentPrice)
        : Number(productToEdit.price);

      setSellingPrice(regPrice);
      setCurrentPrice(activePrice);
      setPrice(activePrice);

      setStockQuantity(productToEdit.stockQuantity);
      setSku(productToEdit.sku || '');
      setCategoryId(productToEdit.categoryId && productToEdit.categoryId !== 'all' ? productToEdit.categoryId : defaultCatId);
      setIsPublished(productToEdit.isPublished);
      setBrand(productToEdit.brand || '');
      setPriority(
        productToEdit.priority !== undefined && productToEdit.priority !== null && Number(productToEdit.priority) > 0
          ? Number(productToEdit.priority)
          : ''
      );
      setFeaturesText(productToEdit.features?.join('\n') || '');

      const productImgs = productToEdit.images || [];
      setThumbnailUrl(productImgs[0] || '');
      setGalleryUrls(productImgs.slice(1));

      // Parse colors
      if (productToEdit.colors && Array.isArray(productToEdit.colors)) {
        const parsedColors = productToEdit.colors.map(c =>
          typeof c === 'string' ? { name: c, hex: '#111827' } : { name: c.name, hex: c.hex || '#111827' }
        );
        setColors(parsedColors);
      } else {
        setColors([]);
      }

      // Parse sizes
      if (productToEdit.sizes && Array.isArray(productToEdit.sizes)) {
        setSizes([...productToEdit.sizes]);
      } else {
        setSizes([]);
      }
    } else {
      // Clean, empty default values for new product
      setTitle('');
      setSlug('');
      setDescription('');
      setSellingPrice('');
      setCurrentPrice(0);
      setPrice(0);
      setStockQuantity(10);
      setPriority('');
      setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategoryId(defaultCatId);
      setIsPublished(true);
      setBrand('');
      setFeaturesText('');
      setThumbnailUrl('');
      setGalleryUrls([]);
      setColors([]);
      setSizes([]);
    }
    setNewGalleryInput('');
    setBulkUrlsInput('');
    setShowBulkAdd(false);
    setShowPresets(false);
    setShowQuickAddCategory(false);
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

  // Color handlers
  const handleAddColor = (name?: string, hex?: string) => {
    const colorName = (name !== undefined ? name : newColorName).trim();
    const colorHex = hex || newColorHex || '#111827';
    if (!colorName) {
      addToast('Please enter a color name', 'error');
      return;
    }
    if (colors.some(c => c.name.toLowerCase() === colorName.toLowerCase())) {
      addToast(`Color "${colorName}" is already added`, 'info');
      return;
    }
    setColors(prev => [...prev, { name: colorName, hex: colorHex }]);
    setNewColorName('');
  };

  const handleToggleColorPreset = (preset: { name: string; hex: string }) => {
    if (colors.some(c => c.name.toLowerCase() === preset.name.toLowerCase())) {
      setColors(prev => prev.filter(c => c.name.toLowerCase() !== preset.name.toLowerCase()));
    } else {
      setColors(prev => [...prev, preset]);
    }
  };

  const handleRemoveColor = (index: number) => {
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  // Size handlers
  const handleAddSize = (sizeVal?: string) => {
    const sizeName = (sizeVal !== undefined ? sizeVal : newSizeName).trim();
    if (!sizeName) {
      addToast('Please enter a size (e.g. M, L, XL)', 'error');
      return;
    }
    if (sizes.some(s => s.toLowerCase() === sizeName.toLowerCase())) {
      addToast(`Size "${sizeName}" is already added`, 'info');
      return;
    }
    setSizes(prev => [...prev, sizeName]);
    setNewSizeName('');
  };

  const handleToggleSizePreset = (presetSize: string) => {
    if (sizes.some(s => s.toLowerCase() === presetSize.toLowerCase())) {
      setSizes(prev => prev.filter(s => s.toLowerCase() !== presetSize.toLowerCase()));
    } else {
      setSizes(prev => [...prev, presetSize]);
    }
  };

  const handleRemoveSize = (index: number) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const activeCurrentPrice = Number(currentPrice) > 0 ? Number(currentPrice) : Number(price);
    const regSellingPrice = (sellingPrice !== '' && Number(sellingPrice) > 0) ? Number(sellingPrice) : undefined;

    if (!title.trim() || activeCurrentPrice <= 0) {
      addToast('Please provide a valid product title and active selling price.', 'error');
      return;
    }

    const finalSku = sku.trim() || `PROD-${Date.now().toString(36).toUpperCase()}`;

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

    const features = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const priorityNum =
      priority === '' || isNaN(Number(priority)) || Number(priority) <= 0
        ? undefined
        : Math.floor(Number(priority));

    const finalCategoryId = categoryId && categoryId !== 'all'
      ? categoryId
      : (categories.find(c => c.id !== 'all')?.id || 'cat-audio');

    if (productToEdit) {
      const ok = updateProduct(productToEdit.id, {
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description.trim(),
        price: activeCurrentPrice,
        sellingPrice: regSellingPrice,
        currentPrice: activeCurrentPrice,
        originalPrice: regSellingPrice,
        stockQuantity: Number(stockQuantity),
        sku: finalSku,
        categoryId: finalCategoryId,
        images: allImages,
        colors: colors.length > 0 ? colors : [],
        sizes: sizes.length > 0 ? sizes : [],
        isPublished,
        brand: brand.trim(),
        features,
        priority: priorityNum,
      });
      if (ok) {
        if (postToFacebook && facebookConfig.pageId && facebookConfig.accessToken) {
          postProductToFacebook(productToEdit.id);
        }
        onClose();
      }
    } else {
      const ok = addProduct({
        title: title.trim(),
        slug: slug.trim() || `prod-${Date.now()}`,
        description: description.trim(),
        price: activeCurrentPrice,
        sellingPrice: regSellingPrice,
        currentPrice: activeCurrentPrice,
        originalPrice: regSellingPrice,
        stockQuantity: Number(stockQuantity),
        sku: finalSku,
        categoryId: finalCategoryId,
        images: allImages,
        colors: colors.length > 0 ? colors : [],
        sizes: sizes.length > 0 ? sizes : [],
        isPublished,
        brand: brand.trim(),
        priority: priorityNum,
        rating: 0,
        reviewsCount: 0,
        reviews: [],
        soldCount: 0,
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
          {/* Quick Auto-Fill from Product URL */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Auto-Fill Information & Images from Product URL</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={urlScrapeInput}
                  onChange={(e) => setUrlScrapeInput(e.target.value)}
                  placeholder="Paste any product URL (e.g. Amazon, Daraz, etc.)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Paste Button right on the left side of Auto-Fill */}
              <button
                type="button"
                onClick={handlePasteUrl}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                title="Paste link from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                <span>Paste</span>
              </button>

              {/* Auto-Fill Button */}
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={isScrapingUrl || !urlScrapeInput.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                {isScrapingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Auto-Fill</span>
                  </>
                )}
              </button>
            </div>
          </div>

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


            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCategory(prev => !prev)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Category</span>
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  {categories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCategory(prev => !prev)}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  title="Create new category"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              {/* Inline Quick Add Category Form */}
              {showQuickAddCategory && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 mt-2 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span>Create New Category</span>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCategory(false)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Category name (e.g. Smart Watches, Wearables)..."
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleQuickCreateCategory}
                      disabled={!newCatName.trim()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
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

            {/* Dual Price Fields: Selling Price (Regular/MRP) & Current Price (Discounted) */}
            <div className="sm:col-span-2 p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>Pricing & Auto-Calculated Percentage Discount</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                      Dual Price Fields
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Original Selling Price (MRP) + Active Current Price. Percentage discount auto-calculates.
                  </p>
                </div>
                {discountInfo.hasDiscount && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black shadow-2xs">
                    <Percent className="w-3.5 h-3.5" />
                    <span>-{discountInfo.discountPercent}% OFF</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Selling Price / Regular Price (Original/MRP) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Selling Price / Regular Price (MRP ৳)
                    </label>
                    <span className="text-[10px] text-gray-400 font-mono">Original / MRP</span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 1500 (Regular/Original MRP)"
                    value={sellingPrice}
                    onChange={e => {
                      const val = e.target.value;
                      setSellingPrice(val === '' ? '' : Math.max(0, Number(val)));
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-gray-700 bg-white"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Displayed strikethrough on product cards & details page
                  </span>
                </div>

                {/* 2. Current Price / Discounted Price (Active selling price) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-900">
                      Current Price / Discounted Price (৳) *
                    </label>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                      Customer Pays
                    </span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 1200 (Active price)"
                    value={currentPrice}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setCurrentPrice(val);
                      setPrice(val);
                    }}
                    className="w-full px-3 py-2 text-xs border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-black text-blue-900 bg-blue-50/20"
                  />
                  <span className="text-[10px] text-blue-600 mt-1 block font-medium">
                    Active price used in cart, direct checkout, and invoicing
                  </span>
                </div>
              </div>

              {/* Dynamic Auto-Calculated Discount Breakdown Banner */}
              {discountInfo.hasDiscount ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[11px]">
                      -{discountInfo.discountPercent}%
                    </span>
                    <span>
                      Customer saves <strong>৳{discountInfo.savingsAmount}</strong> ({discountInfo.discountPercent}% off regular price)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                    Formula: Math.round((({discountInfo.sellingPrice} - {discountInfo.currentPrice}) / {discountInfo.sellingPrice}) * 100) = {discountInfo.discountPercent}%
                  </span>
                </div>
              ) : sellingPrice && currentPrice && Number(currentPrice) >= Number(sellingPrice) ? (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  Note: Current Price is not less than Selling Price. No discount badge will be displayed to customers.
                </div>
              ) : null}
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

            {/* Priority / Rank (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Priority / Rank (Optional)
                </label>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  Top Pin
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 1, 2, 3... (blank = unranked)"
                value={priority}
                onChange={e => {
                  const val = e.target.value;
                  setPriority(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                }}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-amber-900 bg-amber-50/30"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Rank 1, 2, 3... stays strictly at the top. Unranked products shuffle below.
              </p>
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

          {/* ========================================================= */}
          {/* PRODUCT VARIANTS: MULTI-COLOR & MULTI-SIZE OPTIONS */}
          {/* ========================================================= */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Product Variants (Colors & Sizes)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  {colors.length} {colors.length === 1 ? 'Color' : 'Colors'} • {sizes.length} {sizes.length === 1 ? 'Size' : 'Sizes'}
                </span>
              </div>
              <span className="text-[11px] text-gray-500">
                1st color and size are auto-selected on product page
              </span>
            </div>

            {/* Colors Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-2">
                  <span>Color Options</span>
                  {colors.length > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Default: {colors[0].name}
                    </span>
                  )}
                </label>
                <span className="text-[10px] text-gray-400">Click presets below or add custom</span>
              </div>

              {/* Popular Color Quick Presets */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-semibold text-gray-500 mr-1">Presets:</span>
                {POPULAR_COLORS.map(preset => {
                  const isSelected = colors.some(c => c.name.toLowerCase() === preset.name.toLowerCase());
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleToggleColorPreset(preset)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.name}</span>
                      {isSelected ? (
                        <Check className="w-3 h-3 ml-0.5" />
                      ) : (
                        <Plus className="w-3 h-3 text-gray-400 ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={e => setNewColorHex(e.target.value)}
                      className="w-9 h-9 p-0.5 rounded-lg border border-gray-300 cursor-pointer bg-white"
                      title="Select Hex Color"
                    />
                  </div>
                  <input
                    type="text"
                    value={newColorName}
                    onChange={e => setNewColorName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddColor();
                      }
                    }}
                    placeholder="Custom color name (e.g. Lavender, Rose Gold)"
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddColor()}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Color</span>
                </button>
              </div>

              {/* Added Colors List */}
              {colors.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                  <div className="text-[11px] font-semibold text-gray-500">
                    Configured Colors ({colors.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c, index) => (
                      <div
                        key={`${c.name}-${index}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: c.hex || '#111827' }}
                        />
                        <span>{c.name}</span>
                        {index === 0 && (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                          title="Remove color"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <hr className="border-slate-200" />

            {/* Sizes Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-2">
                  <span>Size Options</span>
                  {sizes.length > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Default: {sizes[0]}
                    </span>
                  )}
                </label>
                <span className="text-[10px] text-gray-400">Click presets below or add custom</span>
              </div>

              {/* Popular Size Quick Presets */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-semibold text-gray-500 mr-1">Presets:</span>
                {POPULAR_SIZES.map(presetSize => {
                  const isSelected = sizes.some(s => s.toLowerCase() === presetSize.toLowerCase());
                  return (
                    <button
                      type="button"
                      key={presetSize}
                      onClick={() => handleToggleSizePreset(presetSize)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span>{presetSize}</span>
                      {isSelected ? (
                        <Check className="w-3 h-3 ml-0.5" />
                      ) : (
                        <Plus className="w-3 h-3 text-gray-400 ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Size Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSizeName}
                  onChange={e => setNewSizeName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSize();
                    }
                  }}
                  placeholder="Custom size (e.g. 42mm, 128GB, 40, XL, Free Size)"
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddSize()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Size</span>
                </button>
              </div>

              {/* Added Sizes List */}
              {sizes.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                  <div className="text-[11px] font-semibold text-gray-500">
                    Configured Sizes ({sizes.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s, index) => (
                      <div
                        key={`${s}-${index}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800"
                      >
                        <span>{s}</span>
                        {index === 0 && (
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                          title="Remove size"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200 text-[11px] text-purple-900 flex items-center gap-2">
              <span className="font-bold">✨ Storefront & Telegram Sync:</span>
              <span>Customer selected color and size will be recorded in the order and sent via Telegram Bot notification.</span>
            </div>
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

            {/* Facebook Auto-Post Checkbox */}
            <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  f
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Publish to Facebook Page ({facebookConfig?.pageName || 'X E E R O O'})
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {postToFacebook
                      ? 'Enabled: Product photo, price, details, and order link will be posted to Facebook Page.'
                      : 'Disabled: Product will not be posted to Facebook.'}
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={postToFacebook}
                  onChange={e => setPostToFacebook(e.target.checked)}
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
