/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { BannerSlide } from '../../types';
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';

const PRESET_BANNER_IMAGES = [
  {
    label: 'Titanium Audio Headphones',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=85',
  },
  {
    label: 'Smart Sapphire Titanium Watch',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=85',
  },
  {
    label: 'Mechanical Ergonomic Workstation Deck',
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1600&q=85',
  },
  {
    label: 'Minimalist Workspace Peripherals',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=85',
  },
  {
    label: 'Cinema Optics & Mirrorless Gear',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=85',
  },
];

export const BannerManagementTab: React.FC = () => {
  const {
    banners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    categories,
    canAccessDashboard,
  } = useStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_BANNER_IMAGES[0].url);
  const [linkCategory, setLinkCategory] = useState('cat-audio');
  const [buttonText, setButtonText] = useState('Explore Gear');
  const [isActive, setIsActive] = useState(true);

  if (!canAccessDashboard) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-sm text-gray-600">Access Restricted: Staff or Administrator permissions required.</p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingBannerId(null);
    setTitle('');
    setSubtitle('');
    setBadge('XEEROO FLAGSHIP');
    setImageUrl(PRESET_BANNER_IMAGES[0].url);
    setLinkCategory('cat-audio');
    setButtonText('Shop Now');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (banner: BannerSlide) => {
    setEditingBannerId(banner.id);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setBadge(banner.badge || '');
    setImageUrl(banner.imageUrl);
    setLinkCategory(banner.linkCategory || '');
    setButtonText(banner.buttonText || 'Shop Now');
    setIsActive(banner.isActive);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    if (editingBannerId) {
      updateBanner(editingBannerId, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        badge: badge.trim(),
        imageUrl: imageUrl.trim(),
        linkCategory,
        buttonText: buttonText.trim(),
        isActive,
      });
    } else {
      addBanner({
        title: title.trim(),
        subtitle: subtitle.trim(),
        badge: badge.trim(),
        imageUrl: imageUrl.trim(),
        linkCategory,
        buttonText: buttonText.trim(),
        isActive,
        order: banners.length + 1,
      });
    }

    setIsFormOpen(false);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const current = banners[index];
    const prev = banners[index - 1];
    updateBanner(current.id, { order: prev.order });
    updateBanner(prev.id, { order: current.order });
  };

  const handleMoveDown = (index: number) => {
    if (index >= banners.length - 1) return;
    const current = banners[index];
    const next = banners[index + 1];
    updateBanner(current.id, { order: next.order });
    updateBanner(next.id, { order: current.order });
  };

  const sortedBanners = [...banners].sort((a, b) => a.order - b.order);
  const isMaxReached = banners.length >= 10;

  return (
    <div className="space-y-6">
      {/* Top Banner & Limits Counter */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold tracking-tight">Desktop Storefront Banners</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Staff can configure up to <strong>10 rotating banners</strong> for desktop users. Slides automatically advance every 5 seconds and pause on cursor hover. Mobile view displays directly the compact catalog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs text-slate-200">
            Capacity: <strong className={isMaxReached ? 'text-rose-400' : 'text-emerald-400'}>{banners.length}</strong> / 10
          </div>

          <button
            onClick={handleOpenCreate}
            disabled={isMaxReached}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              isMaxReached
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>
      </div>

      {/* Banner Create / Edit Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>{editingBannerId ? 'Edit Desktop Banner' : 'Create New Desktop Banner (Up to 10)'}</span>
              <span className="text-[11px] font-mono text-gray-400">Total: {banners.length}/10</span>
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. AeroPulse Titanium Wireless Headphones"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subtitle / Description
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="Key features, specs or promotional headline"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    placeholder="e.g. NEW RELEASE"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={e => setButtonText(e.target.value)}
                    placeholder="e.g. Shop Headphones"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Category Shortcut
                </label>
                <select
                  value={linkCategory}
                  onChange={e => setLinkCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                >
                  <option value="">All Products</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-mono text-[11px]"
                />

                {/* Preset quick picks */}
                <div className="mt-2">
                  <span className="text-[10px] text-gray-400 block mb-1">Or pick high-res preset:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_BANNER_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className="text-[10px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="banner-is-active"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="banner-is-active" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Activate banner immediately in carousel rotation
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingBannerId ? 'Save Changes' : 'Add Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banners List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Configured Banners ({banners.length} of 10)
          </span>
          <span className="text-[11px] text-gray-500">Auto-switch interval: 5 seconds</span>
        </div>

        <div className="divide-y divide-gray-100">
          {sortedBanners.map((banner, index) => (
            <div
              key={banner.id}
              className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-20 h-12 rounded-lg bg-gray-900 overflow-hidden shrink-0 border border-gray-200 relative">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  {!banner.isActive && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-[10px] text-white font-bold">
                      OFF
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{banner.title}</span>
                    {banner.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                        {banner.badge}
                      </span>
                    )}
                  </div>
                  {banner.subtitle && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 max-w-md mt-0.5">
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                    <span>Order: #{banner.order}</span>
                    <span>•</span>
                    <span>CTA: {banner.buttonText || 'Shop'}</span>
                    <span>•</span>
                    <span className={banner.isActive ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {banner.isActive ? '● Live on Store' : '○ Paused'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  title="Move banner earlier in sequence"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === sortedBanners.length - 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  title="Move banner later in sequence"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleBannerActive(banner.id)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    banner.isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                  title={banner.isActive ? 'Deactivate banner' : 'Activate banner'}
                >
                  {banner.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleOpenEdit(banner)}
                  className="p-1.5 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Edit banner content"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteBanner(banner.id)}
                  className="p-1.5 rounded-lg border border-gray-200 text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete banner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
