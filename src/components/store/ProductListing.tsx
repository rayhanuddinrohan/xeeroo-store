/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { formatBDT } from '../../utils/currency';
import { SlidersHorizontal, ArrowUpDown, Filter, RotateCcw, AlertTriangle } from 'lucide-react';

export const ProductListing: React.FC = () => {
  const {
    products,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    inStockOnly,
    setInStockOnly,
    currentUser,
  } = useStore();

  const isStaff = currentUser?.role === 'moderator' || currentUser?.role === 'admin';

  // Filter products based on search, category, stock, price, and RBAC published status
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. RBAC check: Customers cannot view unpublished drafts!
      if (!isStaff && !product.isPublished) {
        return false;
      }

      // 2. Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesSku = product.sku.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSku && !matchesDesc && !matchesBrand) {
          return false;
        }
      }

      // 3. Category check
      if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) {
        return false;
      }

      // 4. In-stock check
      if (inStockOnly && product.stockQuantity <= 0) {
        return false;
      }

      // 5. Price range check
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // 'featured' keeps original ordering
    });
  }, [products, isStaff, searchQuery, selectedCategory, inStockOnly, priceRange, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange([0, 1000]);
    setInStockOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    inStockOnly ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000 ||
    sortBy !== 'featured';

  return (
    <div className="w-full">
      {/* Listing controls & active filters header (Sticky category bar on mobile) */}
      <div className="sticky top-0 md:static z-30 bg-white/95 md:bg-white backdrop-blur-md md:backdrop-blur-none border-b md:border border-gray-200 -mx-4 px-4 py-2.5 sm:mx-0 sm:px-4 sm:rounded-xl mb-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Categories Tab Pill Strip - Horizontally scrollable */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 touch-pan-x">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Products
            </button>
            {categories.map(cat => {
              const count = products.filter(
                p => p.categoryId === cat.id && (isStaff || p.isPublished)
              ).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat.id
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort & Quick In-Stock Toggle */}
          <div className="flex items-center justify-between sm:justify-end flex-wrap gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
            {/* In stock only toggle */}
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span>In-stock Only</span>
            </label>

            {/* Price sort dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                id="select-sort-by"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="featured">Featured Order</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                title="Reset all active filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Price Slider Bar & Results Counter */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-700">Max Price: <strong className="font-mono text-gray-900">{formatBDT(priceRange[1])}</strong></span>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-32 sm:w-44 accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-gray-900 font-semibold">{filteredProducts.length}</strong> items
            </span>
            {isStaff && (
              <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Staff View (Includes Drafts)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No products match your criteria</h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Try adjusting your search keywords, price limits, or clearing the active category filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
