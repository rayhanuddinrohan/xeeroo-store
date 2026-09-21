/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Plus, Trash2, Tag, Lock, FolderPlus } from 'lucide-react';

export const CategoryManagementTab: React.FC = () => {
  const { categories, products, addCategory, deleteCategory, canManageCategories } = useStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!canManageCategories) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 p-8 text-center max-w-lg mx-auto shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          Administrator Access Required
        </h3>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Product department category configuration is restricted to Admins.
        </p>
      </div>
    );
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = addCategory(name.trim(), description.trim());
    if (ok) {
      setName('');
      setDescription('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Category Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Add Product Category</h3>
        <p className="text-xs text-gray-500 mb-4">
          Categories organize catalog items and power customer navigation shortcuts.
        </p>

        <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ergonomic Desks"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Brief summary of items in this department"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Category Name</th>
                <th className="py-3 px-4 font-semibold">URL Slug</th>
                <th className="py-3 px-4 font-semibold">Products Assigned</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map(cat => {
                const count = products.filter(p => p.categoryId === cat.id).length;

                return (
                  <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">{cat.name}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{cat.slug}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-gray-100 text-gray-800">
                        {count} items
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 truncate max-w-xs">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
