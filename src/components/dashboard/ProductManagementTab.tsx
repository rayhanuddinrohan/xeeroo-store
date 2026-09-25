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
} from 'lucide-react';

export const ProductManagementTab: React.FC = () => {
  const {
    products,
    categories,
    currentUser,
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
