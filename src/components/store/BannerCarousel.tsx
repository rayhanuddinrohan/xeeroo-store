/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/currency';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  Zap,
} from 'lucide-react';

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
      className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 group select-none cursor-pointer"
      onClick={handleSelectCurrent}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Slide Content */}
      <div className="relative h-[360px] sm:h-[400px] lg:h-[440px] w-full overflow-hidden">
        {/* Background Image with Ambient Glow */}
        <div className="absolute inset-0">
          <img
            key={currentProduct.id}
            src={currentImage}
            alt={currentProduct.title}
            className="w-full h-full object-cover object-center filter brightness-50 transition-all duration-700 scale-100 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"></div>
        </div>

        {/* Text and Action Content Overlay */}
        <div className="relative z-10 h-full max-w-2xl flex flex-col justify-center px-6 sm:px-10 lg:px-14 text-white">
          {/* Badges: Stock Status & Brand */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              স্টকে আছে ({currentProduct.stockQuantity} টি বাকি)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-600/30 text-blue-300 border border-blue-500/30">
              <Zap className="w-3 h-3 text-blue-400" />
              {currentProduct.brand}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight mb-2 drop-shadow-md line-clamp-2">
            {currentProduct.title}
          </h2>

          {/* Short Excerpt */}
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed font-normal max-w-xl">
            {currentProduct.description}
          </p>

          {/* Price & CTA Button */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <div className="flex items-baseline gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {formatBDT(currentProduct.price)}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectCurrent();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer group-hover:translate-x-1"
            >
              <span>প্রোডাক্ট দেখুন ও অর্ডার করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Right Thumbnail Card for Desktop */}
        <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 w-72 bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-4 shadow-2xl flex-col items-center text-center">
          <div className="w-48 h-48 rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-800">
            <img
              src={currentImage}
              alt={currentProduct.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <span className="text-xs font-semibold text-slate-300 line-clamp-1 mb-1">
            {currentProduct.title}
          </span>
          <span className="text-base font-black text-emerald-400 font-mono">
            {formatBDT(currentProduct.price)}
          </span>
        </div>

        {/* Carousel Prev/Next Navigation Controls */}
        {inStockProducts.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Slide Indicator Dots */}
        {inStockProducts.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80">
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
                    : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'
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
