/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const BannerCarousel: React.FC = () => {
  const { products, setSelectedProductId, setViewMode } = useStore();

  // 1. Automatically pick in-stock, published products
  const inStockProducts = useMemo(() => {
    const available = products.filter(p => p.stockQuantity > 0 && (p.isPublished ?? true));
    if (available.length === 0) return [];

    // Deterministic pseudo-random shuffle seeded so it doesn't reshuffle every re-render
    const shuffled = [...available].sort((a, b) => {
      const hashA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hashB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return (hashA % 17) - (hashB % 17);
    });

    return shuffled.slice(0, 7); // Pick top 7 random in-stock products
  }, [products]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-switch banner every 5 seconds
  useEffect(() => {
    if (inStockProducts.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % inStockProducts.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inStockProducts.length, isPaused, currentIndex]);

  if (inStockProducts.length === 0) {
    return null;
  }

  const currentProduct = inStockProducts[currentIndex % inStockProducts.length];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + inStockProducts.length) % inStockProducts.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % inStockProducts.length);
  };

  const handleSelectCurrent = () => {
    setSelectedProductId(currentProduct.id);
    setViewMode('product-detail');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const currentImage =
    currentProduct.images && currentProduct.images.length > 0
      ? currentProduct.images[0]
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80';

  return (
    <div
      className="hidden md:block relative mb-8 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 group select-none cursor-pointer"
      onClick={handleSelectCurrent}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Slide Content */}
      <div className="relative h-[320px] lg:h-[380px] xl:h-[420px] w-full overflow-hidden">
        {/* Product Image */}
        <div className="absolute inset-0">
          <img
            key={currentProduct.id}
            src={currentImage}
            alt={currentProduct.title}
            className="w-full h-full object-cover object-center filter brightness-90 transition-all duration-700 scale-100 group-hover:scale-105"
          />
          {/* Subtle gradient overlay to make product title stand out cleanly */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-transparent"></div>
        </div>

        {/* Product Name Only */}
        <div className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-12 text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-xl max-w-3xl line-clamp-2 leading-tight">
            {currentProduct.title}
          </h2>
        </div>

        {/* Carousel Prev/Next Navigation Controls */}
        {inStockProducts.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white border border-slate-700/80 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer shadow-lg"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white border border-slate-700/80 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer shadow-lg"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Slide Indicator Dots */}
        {inStockProducts.length > 1 && (
          <div className="absolute bottom-4 right-8 z-20 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80">
            {inStockProducts.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex % inStockProducts.length === idx
                    ? 'w-6 h-1.5 bg-blue-500'
                    : 'w-1.5 h-1.5 bg-slate-500 hover:bg-slate-300'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
