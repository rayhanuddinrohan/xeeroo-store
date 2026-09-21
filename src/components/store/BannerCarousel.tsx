/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Pause,
  Play,
  Settings,
} from 'lucide-react';

export const BannerCarousel: React.FC = () => {
  const {
    banners,
    setSelectedCategory,
    categories,
    setViewMode,
    setDashboardTab,
    canAccessDashboard,
  } = useStore();

  const activeBanners = banners.filter(b => b.isActive).sort((a, b) => a.order - b.order);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-switch banners every 5 seconds
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeBanners.length, isPaused, currentIndex]);

  if (activeBanners.length === 0) {
    return null;
  }

  // Ensure current index is within bounds
  const currentBanner = activeBanners[currentIndex % activeBanners.length];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  const handleBannerAction = () => {
    if (currentBanner.linkCategory) {
      setSelectedCategory(currentBanner.linkCategory);
    }
  };

  const handleManageBanners = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDashboardTab('banners');
    setViewMode('dashboard');
  };

  return (
    /* Strictly Hidden on Mobile (< md), Active on Desktop as requested */
    <div
      className="hidden md:block relative mb-8 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Slide Content */}
      <div className="relative h-[380px] lg:h-[420px] w-full overflow-hidden">
        {/* Background Image with Ambient Overlay */}
        <div className="absolute inset-0">
          <img
            key={currentBanner.id}
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover object-center filter brightness-60 transition-all duration-700 scale-100 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"></div>
        </div>

        {/* Text Content Overlay */}
        <div className="relative z-10 h-full max-w-2xl flex flex-col justify-center px-10 lg:px-14 text-white">
          {currentBanner.badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-3 w-fit backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentBanner.badge}</span>
            </div>
          )}

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight drop-shadow-md">
            {currentBanner.title}
          </h2>

          {currentBanner.subtitle && (
            <p className="text-sm lg:text-base text-slate-300 font-normal leading-relaxed mb-6 max-w-xl line-clamp-2">
              {currentBanner.subtitle}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleBannerAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>{currentBanner.buttonText || 'Explore Collection'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {canAccessDashboard && (
              <button
                onClick={handleManageBanners}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-medium text-xs transition-colors cursor-pointer backdrop-blur-xs"
                title="Staff: Add or edit banners (up to 10)"
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" />
                <span>Manage Banners ({banners.length}/10)</span>
              </button>
            )}
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous Banner"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white border border-slate-700/60 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg z-20 backdrop-blur-xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              aria-label="Next Banner"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white border border-slate-700/60 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg z-20 backdrop-blur-xs"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Carousel Bottom Control Bar: Indicators & Counter */}
        <div className="absolute bottom-4 right-8 z-20 flex items-center gap-4 bg-slate-950/70 px-4 py-1.5 rounded-full border border-slate-800/80 backdrop-blur-md">
          {/* Play/Pause state */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isPaused ? 'Resume auto-switch' : 'Pause auto-switch'}
          >
            {isPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3" />}
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-blue-500'
                    : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Numerical Slide Counter */}
          <span className="text-[11px] font-mono text-slate-400 pl-1 border-l border-slate-800">
            <strong className="text-white">0{currentIndex + 1}</strong> / 0{activeBanners.length}
          </span>
        </div>
      </div>
    </div>
  );
};
