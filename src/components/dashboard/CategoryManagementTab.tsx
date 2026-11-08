/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';
import {
  Plus,
  Trash2,
  Lock,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  X,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';

export const CategoryManagementTab: React.FC = () => {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    canManageCategories,
  } = useStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('');

  // Editing state for category
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSortOrder, setEditSortOrder] = useState('');

  if (!canManageCategories) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 p-8 text-center max-w-lg mx-auto shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          Staff & Administrator Access Required
        </h3>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Product department category configuration is restricted to Admin & Staff members.
        </p>
      </div>
    );
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const orderNum = sortOrder.trim() !== '' ? parseInt(sortOrder.trim(), 10) : undefined;
    const ok = addCategory(name.trim(), description.trim(), orderNum);
    if (ok) {
      setName('');
      setDescription('');
      setSortOrder('');
    }
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
    setEditSortOrder(cat.sortOrder !== undefined ? String(cat.sortOrder) : '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditSortOrder('');
  };

  const handleSaveEdit = (catId: string) => {
    if (!editName.trim()) return;
    const orderNum = editSortOrder.trim() !== '' ? parseInt(editSortOrder.trim(), 10) : undefined;
    updateCategory(catId, {
      name: editName.trim(),
      description: editDescription.trim(),
      sortOrder: orderNum,
    });
    setEditingId(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrderedIds = [...categories.map(c => c.id)];
    const temp = newOrderedIds[index - 1];
    newOrderedIds[index - 1] = newOrderedIds[index];
    newOrderedIds[index] = temp;
    reorderCategories(newOrderedIds);
  };

  const handleMoveDown = (index: number) => {
    if (index >= categories.length - 1) return;
    const newOrderedIds = [...categories.map(c => c.id)];
    const temp = newOrderedIds[index + 1];
    newOrderedIds[index + 1] = newOrderedIds[index];
    newOrderedIds[index] = temp;
    reorderCategories(newOrderedIds);
  };

  return (
    <div className="space-y-6">
      {/* Informational Guidance Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/70 border border-blue-200/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <span>Category Display Order & Homepage Priority</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                Dynamic Sorting
              </span>
            </h4>
            <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
              Categories are ordered by their <strong>Rank (#1, #2, #3...)</strong> in the top navigation bar. When visitors land on the homepage, products from the <strong>#1 Top Priority Category</strong> are automatically filtered and displayed by default.
            </p>
          </div>
        </div>
      </div>

      {/* Add Category Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Add Product Category</h3>
        <p className="text-xs text-gray-500 mb-4">
          Create categories and assign display rank to prioritize them across the storefront and homepage.
        </p>

        <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Audio & Acoustics"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span>Order Rank</span>
              <span className="text-[10px] text-gray-400 font-mono">(Optional: 1, 2, 3)</span>
            </label>
            <input
              type="number"
              min="1"
              max="999"
              placeholder={`e.g. ${categories.length + 1}`}
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          <div className="sm:col-span-5 flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Brief summary of items in this department"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Category Sequence & Priorities ({categories.length})
            </h4>
            <p className="text-[11px] text-gray-500">
              Items at the top appear first on the category bar. #1 is the default storefront landing view.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold w-24">Order / Rank</th>
                <th className="py-3 px-4 font-semibold">Category Name</th>
                <th className="py-3 px-4 font-semibold">URL Slug</th>
                <th className="py-3 px-4 font-semibold">Assigned Products</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold text-right">Quick Order & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat, index) => {
                const isCoreCategory = cat.id === 'all';
                const count = isCoreCategory
                  ? products.length
                  : products.filter(p => p.categoryId === cat.id).length;
                const isEditing = editingId === cat.id;
                const isTopPriority = index === 0;

                return (
                  <tr
                    key={cat.id}
                    className={`transition-colors ${
                      isTopPriority
                        ? 'bg-blue-50/30 hover:bg-blue-50/50'
                        : isCoreCategory
                        ? 'bg-indigo-50/20 hover:bg-indigo-50/40'
                        : 'hover:bg-gray-50/60'
                    }`}
                  >
                    {/* Rank / Order Column */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={editSortOrder}
                          onChange={e => setEditSortOrder(e.target.value)}
                          className="w-16 px-2 py-1 text-xs border border-blue-400 rounded-lg focus:outline-none font-mono"
                          placeholder="Rank"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                              isTopPriority
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : cat.sortOrder !== undefined
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            #{cat.sortOrder ?? index + 1}
                          </span>
                          {isTopPriority && (
                            <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              Default Home
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Category Name Column */}
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-blue-400 rounded-lg focus:outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-bold">{cat.name}</span>
                          {isCoreCategory && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Storewide Catalog
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">{cat.slug}</td>

                    {/* Products Assigned */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                          isCoreCategory
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {count} items {isCoreCategory ? '(All Store)' : ''}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-gray-600 max-w-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-blue-400 rounded-lg focus:outline-none"
                        />
                      ) : (
                        <span className="truncate block">{cat.description || '—'}</span>
                      )}
                    </td>

                    {/* Actions & Reordering */}
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
                            title="Save Changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                            title="Cancel Edit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {/* Reorder Up / Down */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveUp(index)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              index === 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title="Move Category Up in Sequence"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === categories.length - 1}
                            onClick={() => handleMoveDown(index)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              index === categories.length - 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title="Move Category Down in Sequence"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => startEditing(cat)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Category Details & Rank"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button or Lock icon for Core Storewide category */}
                          {isCoreCategory ? (
                            <span
                              className="p-1.5 rounded-lg text-gray-400 cursor-not-allowed"
                              title="Core System Department - Protected from deletion"
                            >
                              <Lock className="w-3.5 h-3.5 text-gray-400" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => deleteCategory(cat.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
