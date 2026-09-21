/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { X, Save, Image, Check, Plus, Trash2 } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

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
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [brand, setBrand] = useState('OmniTech');
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title);
      setSlug(productToEdit.slug);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price);
      setStockQuantity(productToEdit.stockQuantity);
      setSku(productToEdit.sku);
      setCategoryId(productToEdit.categoryId);
      setImageUrl(productToEdit.images[0] || '');
      setIsPublished(productToEdit.isPublished);
      setBrand(productToEdit.brand || 'OmniTech');
      setFeaturesText(productToEdit.features?.join('\n') || '');
    } else {
      // Default new product values
      setTitle('');
      setSlug('');
      setDescription('');
      setPrice(99.00);
      setStockQuantity(15);
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategoryId(categories[0]?.id || 'cat-audio');
      setImageUrl('https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80');
      setIsPublished(true);
      setBrand('OmniTech');
      setFeaturesText('Aircraft-grade materials\nHigh-speed wireless connectivity\nUSB-C Fast Charging');
    }
  }, [productToEdit, categories, isOpen]);

  // Auto-generate slug when title changes (if adding new product)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!productToEdit) {
      const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !sku.trim() || price <= 0) {
      addToast('Please provide valid title, SKU, and positive price.', 'error');
      return;
    }

    const images = imageUrl.trim()
      ? [imageUrl.trim()]
      : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'];

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
        images,
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
        images,
        isPublished,
        brand: brand.trim(),
        rating: 5.0,
        reviewsCount: 1,
        features,
        updatedBy: currentUser?.id || 'usr-admin-1',
      });
      if (ok) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
          <h3 className="text-sm font-bold tracking-tight">
            {productToEdit ? `Edit Product: ${productToEdit.title}` : 'Add New Inventory Product'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Precision Studio Monitor Headphones"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
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
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

            {/* Image URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {imageUrl && (
                <div className="mt-2 flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded object-cover border"
                  />
                  <span className="text-[11px] text-gray-500 truncate">{imageUrl}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe product craftsmanship, materials, compatibility, etc."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Features (one per line) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Key Features (one per line)
              </label>
              <textarea
                rows={2}
                value={featuresText}
                onChange={e => setFeaturesText(e.target.value)}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              ></textarea>
            </div>

            {/* Published State Checkbox */}
            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Publish to Storefront Catalog
                </span>
                <span className="text-[11px] text-gray-500">
                  When enabled, customers can view and purchase this item. If draft, only staff can see it.
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
