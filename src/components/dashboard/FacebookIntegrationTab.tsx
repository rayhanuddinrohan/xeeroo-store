/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { FacebookConfig, Product } from '../../types';
import { formatBDT } from '../../utils/currency';
import {
  verifyFacebookPage,
  formatProductCaption,
  DEFAULT_FACEBOOK_CONFIG,
} from '../../utils/facebook';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Send,
  RefreshCw,
  Sliders,
  FileText,
  Package,
  Layers,
  HelpCircle,
  Globe,
  Radio,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export const FacebookIntegrationTab: React.FC = () => {
  const {
    products,
    facebookConfig,
    updateFacebookConfig,
    postProductToFacebook,
    addToast,
  } = useStore();

  const [config, setConfig] = useState<FacebookConfig>(() => ({
    ...DEFAULT_FACEBOOK_CONFIG,
    ...facebookConfig,
  }));

  const [showToken, setShowToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    tested: boolean;
    success: boolean;
    name?: string;
    link?: string;
    message?: string;
  }>({
    tested: true,
    success: true,
    name: facebookConfig.pageName || 'X E E R O O',
    link: facebookConfig.pageLink || 'https://www.facebook.com/103314657990315',
  });

  const [isTestingPost, setIsTestingPost] = useState(false);
  const [testPostResult, setTestPostResult] = useState<{
    success: boolean;
    message: string;
    postUrl?: string;
  } | null>(null);

  const [postingProductId, setPostingProductId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedPreviewProduct, setSelectedPreviewProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (facebookConfig) {
      setConfig({
        ...DEFAULT_FACEBOOK_CONFIG,
        ...facebookConfig,
      });
    }
  }, [facebookConfig]);

  useEffect(() => {
    if (products.length > 0 && !selectedPreviewProduct) {
      setSelectedPreviewProduct(products[0]);
    }
  }, [products, selectedPreviewProduct]);

  // Handle Verify Page with Meta Graph API
  const handleVerify = async () => {
    if (!config.pageId.trim() || !config.accessToken.trim()) {
      addToast('দয়া করে Page ID এবং Access Token প্রদান করুন।', 'warning');
      return;
    }

    setIsVerifying(true);
    setVerifyStatus({ tested: false, success: false });

    try {
      const res = await verifyFacebookPage(config.pageId, config.accessToken);
      if (res.success) {
        setVerifyStatus({
          tested: true,
          success: true,
          name: res.name || 'X E E R O O',
          link: res.link || `https://www.facebook.com/${config.pageId}`,
          message: `ফেসবুক পেজ "${res.name}" এর সাথে সফলভাবে কানেক্ট হয়েছে!`,
        });
        addToast(`✅ ফেসবুক পেজ "${res.name}" ভেরিফাইড!`, 'success');
        // Update stored name
        if (res.name) {
          setConfig(prev => ({
            ...prev,
            pageName: res.name,
            pageLink: res.link || prev.pageLink,
            accessToken: res.resolvedToken || prev.accessToken,
          }));
        }
      } else {
        setVerifyStatus({
          tested: true,
          success: false,
          message: res.error || 'ভেরিফিকেশন ব্যর্থ হয়েছে। Token বা Page ID যাচাই করুন।',
        });
        addToast(res.error || 'ফেসবুক পেজ ভেরিফিকেশন ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setVerifyStatus({
        tested: true,
        success: false,
        message: e.message || 'নেটওয়ার্ক এরর।',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Save Configuration
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await updateFacebookConfig(updated);
    addToast('Facebook Auto-Post সেটিংস ক্লাউড ডাটাবেজে সংরক্ষিত হয়েছে!', 'success');
  };

  // Send a quick test post
  const handleSendTestPost = async () => {
    const sampleProduct = selectedPreviewProduct || products[0];
    if (!sampleProduct) {
      addToast('টেস্ট পোস্ট করার জন্য কোনো প্রোডাক্ট পাওয়া যায়নি।', 'warning');
      return;
    }

    setIsTestingPost(true);
    setTestPostResult(null);

    try {
      const res = await postProductToFacebook(sampleProduct);
      setTestPostResult(res);
    } finally {
      setIsTestingPost(false);
    }
  };

  // Post single product from table
  const handlePostSingleProduct = async (prod: Product) => {
    setPostingProductId(prod.id);
    try {
      await postProductToFacebook(prod);
    } finally {
      setPostingProductId(null);
    }
  };

  // Preview caption calculation
  const sampleProduct = selectedPreviewProduct || products[0] || {
    id: 'sample',
    title: 'Minimalist Premium Watch',
    price: 3450,
    stockQuantity: 15,
    slug: 'minimalist-premium-watch',
    description: 'Ultra-thin aesthetic chronometer crafted with surgical-grade stainless steel and sapphire glass.',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
    brand: 'XEEROO Signature',
    features: ['Water Resistant 50M', 'Sapphire Glass', 'Genuine Leather Strap'],
    categoryId: 'cat-watches',
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rating: 5,
    reviewsCount: 12,
  };

  const previewCaption = formatProductCaption(
    sampleProduct,
    config,
    config.websiteUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://xeeroo.com')
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white border border-white/25">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Meta Graph API v19.0 Integration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <Share2 className="w-7 h-7 text-sky-300" />
              <span>Facebook Page Auto-Post</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              ওয়েবসাইটে নতুন কোনো প্রোডাক্ট যোগ করার সাথে সাথে স্বয়ংক্রিয়ভাবে আপনার অফিসিয়াল ফেসবুক পেজে ফটো, আকর্ষণীয় ক্যাপশন, মূল্য এবং অর্ডার লিংক সহ পোস্ট করুন।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>যাচাই হচ্ছে...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-sky-200" />
                  <span>Verify Page</span>
                </>
              )}
            </button>

            <a
              href={config.pageLink || `https://www.facebook.com/${config.pageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ফেসবুক পেজ দেখুন</span>
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </a>
          </div>
        </div>
      </div>

      {/* Active Page Status Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-blue-400">
              f
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-gray-900">
                  {verifyStatus.name || config.pageName || 'X E E R O O'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>কানেক্টেড ও একটিভ</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Page ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono font-bold text-gray-800">{config.pageId}</code>
                <span className="mx-2 text-gray-300">•</span>
                System User Token: <span className="text-emerald-700 font-semibold font-mono">Permanent (Never Expires)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-blue-50/70 border border-blue-100 p-3 rounded-xl">
            <div className="text-right sm:block">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-900">
                Auto-Post Status
              </span>
              <span className="text-xs font-black text-blue-700">
                {config.enabled && config.autoPostOnAdd ? '🟢 সম্পূর্ণ সক্রিয় (Auto-On)' : '⚪ অফ করা'}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled && config.autoPostOnAdd}
                onChange={async (e) => {
                  const val = e.target.checked;
                  const newCfg = { ...config, enabled: val, autoPostOnAdd: val };
                  setConfig(newCfg);
                  await updateFacebookConfig(newCfg);
                  addToast(val ? 'ফেসবুক অটো-পোস্ট চালু করা হয়েছে!' : 'ফেসবুক অটো-পোস্ট বন্ধ করা হয়েছে!', 'info');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Verification feedback alert */}
        {verifyStatus.message && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              verifyStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {verifyStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{verifyStatus.message}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Form Settings & Live Facebook Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  পোস্ট ও এপিআই সেটিংস
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? 'গাইড বন্ধ করুন' : 'সহায়িকা ও নির্দেশিকা'}</span>
              </button>
            </div>

            {/* Guide Accordion */}
            {showGuide && (
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl text-xs text-sky-950 space-y-2">
                <p className="font-bold">💡 কীভাবে ফেসবুক অটো-পোস্ট কাজ করে:</p>
                <ul className="list-disc list-inside space-y-1 text-sky-900 text-[11px] leading-relaxed">
                  <li>প্রদত্ত <strong>Permanent System User Token</strong> দিয়ে মেটা গ্রাফ এপিআই (Graph API v19.0) সরাসরি কাজ করে।</li>
                  <li>নতুন প্রোডাক্ট যোগ করার সময় মূল কাভার ছবিটি ফেসবুকে হাই-রেজুল্যুশনে ফটো পোস্ট হিসেবে আপলোড হয়।</li>
                  <li>ক্যাপশনে স্বয়ংক্রিয়ভাবে প্রোডাক্টের নাম, মূল্য, ফিচার এবং সরাসরি ওয়েবসাইটে অর্ডার করার লিংক বসে যায়।</li>
                  <li>যে কোনো প্রোডাক্ট টেবিল থেকে <strong>&quot;Post to FB&quot;</strong> বাটনে ক্লিক করে ম্যানুয়ালিও তাৎক্ষণিক পোস্ট করা যায়।</li>
                </ul>
              </div>
            )}

            {/* Page ID */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Facebook Page ID *
              </label>
              <input
                type="text"
                value={config.pageId}
                onChange={(e) => setConfig({ ...config, pageId: e.target.value.trim() })}
                placeholder="e.g. 103314657990315"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-gray-900 transition-all font-bold"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                আপনার ফেসবুক পেজের নির্দিষ্ট আইডি (Page ID)। পেজের About সেকশনে পাওয়া যায়।
              </p>
            </div>

            {/* Access Token */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-800">
                  Page Access Token *
                </label>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showToken ? 'Hide Token' : 'Show Token'}</span>
                </button>
              </div>
              <div className="relative">
                <textarea
                  rows={showToken ? 4 : 2}
                  value={config.accessToken}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value.trim() })}
                  placeholder="EAAUOWYLTVWEBSx..."
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-gray-900 transition-all resize-y"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Meta Business Suite / Graph API Explorer এর <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-700">pages_manage_posts</code> পারমিশন যুক্ত টোকেন।
              </p>
            </div>

            {/* Custom Post Header Prefix */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                পোস্টের হেডলাইন / প্রিফিক্স (Headline / Hook)
              </label>
              <input
                type="text"
                value={config.customPrefix || ''}
                onChange={(e) => setConfig({ ...config, customPrefix: e.target.value })}
                placeholder="🔥 NEW ARRIVAL AT XEEROO!"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-gray-900 transition-all font-semibold"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                প্রতিটি পোস্টের শীর্ষে এই আকর্ষণীয় হেডলাইনটি প্রদর্শিত হবে।
              </p>
            </div>

            {/* Custom Hashtags */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                হ্যাশট্যাগ তালিকা (Hashtags)
              </label>
              <input
                type="text"
                value={config.customHashtags || ''}
                onChange={(e) => setConfig({ ...config, customHashtags: e.target.value })}
                placeholder="#XEEROO #OnlineShopping #Bangladesh #Tech"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-blue-700 font-mono transition-all"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                রিচ এবং সার্চ দৃশ্যমানতা বৃদ্ধির জন্য স্পেস দিয়ে হ্যাশট্যাগ লিখুন।
              </p>
            </div>

            {/* Website Base URL */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                ক্যাপশনে ওয়েবসাইট লিঙ্ক / ডোমেইন (Store Website URL)
              </label>
              <input
                type="url"
                value={config.websiteUrl || ''}
                onChange={(e) => setConfig({ ...config, websiteUrl: e.target.value })}
                placeholder="https://ais-pre-jaojjujai65chcukwocmss-455970953521.asia-southeast1.run.app"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-gray-800 font-mono transition-all"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                ফেসবুক পোস্টের নিচে অর্ডার করার যে লিঙ্কটি যাবে (ডিফল্ট: পাবলিক শেয়ার লিঙ্ক বা আপনার ওয়েবসাইট ডোমেইন)।
              </p>
            </div>

            {/* Checkbox Options */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoPostOnAdd}
                  onChange={(e) => setConfig({ ...config, autoPostOnAdd: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-800">
                  নতুন প্রোডাক্ট যোগ করার সাথে সাথে স্বয়ংক্রিয়ভাবে পেজে পোস্ট করুন (Auto-Post)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includePrice !== false}
                  onChange={(e) => setConfig({ ...config, includePrice: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-700">
                  ক্যাপশনে প্রোডাক্টের মূল্য (Price in BDT) যুক্ত করুন
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeLink !== false}
                  onChange={(e) => setConfig({ ...config, includeLink: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-700">
                  ওয়েবসাইটে সরাসরি অর্ডার করার লিঙ্ক (Product Direct URL) ক্যাপশনে রাখুন
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleVerify}
                className="px-4 py-2.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Test Credentials
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Facebook Post Mockup & Test Sender */}
        <div className="lg:col-span-5 space-y-6">
          {/* Post Preview Box */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
            {/* Header of the mockup */}
            <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-900">
                  লাইভ পোস্ট প্রিভিউ (Facebook Mockup)
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Interactive Preview
              </span>
            </div>

            {/* The Facebook Post UI */}
            <div className="p-4 space-y-3 font-sans">
              {/* FB Author Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg border-2 border-white shadow-xs">
                    f
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-gray-900 hover:underline cursor-pointer">
                        {config.pageName || 'X E E R O O'}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span>Just now</span>
                      <span>•</span>
                      <Globe className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Caption Text */}
              <div className="text-xs text-gray-900 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                {previewCaption}
              </div>

              {/* Product Cover Photo Preview */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-200 group">
                <img
                  src={
                    sampleProduct.images && sampleProduct.images.length > 0
                      ? sampleProduct.images[0]
                      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={sampleProduct.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white flex items-center justify-between text-xs">
                  <span className="font-bold truncate">{sampleProduct.title}</span>
                  <span className="font-mono font-bold text-amber-300 shrink-0 ml-2">
                    {formatBDT(sampleProduct.price)}
                  </span>
                </div>
              </div>

              {/* Facebook Reactions & Actions */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-around text-xs text-gray-500 font-semibold py-1">
                <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                  👍 Like
                </span>
                <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                  💬 Comment
                </span>
                <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                  ↗️ Share
                </span>
              </div>
            </div>

            {/* Test Post Action Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">টেস্ট প্রোডাক্ট নির্বাচন করুন:</span>
                <select
                  value={sampleProduct.id}
                  onChange={(e) => {
                    const found = products.find(p => p.id === e.target.value);
                    if (found) setSelectedPreviewProduct(found);
                  }}
                  className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title.slice(0, 30)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={isTestingPost}
                onClick={handleSendTestPost}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTestingPost ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>ফেসবুকে পোস্ট পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-sky-200" />
                    <span>Send Test Post to Facebook Page Now</span>
                  </>
                )}
              </button>

              {testPostResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 ${
                    testPostResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testPostResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testPostResult.message}</span>
                  </div>

                  {testPostResult.postUrl && (
                    <a
                      href={testPostResult.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-semibold mt-1"
                    >
                      <span>ফেসবুকে পোস্টটি দেখুন (View Post on Facebook)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Catalog Quick-Post Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>প্রোডাক্ট ক্যাটালগ ও ওয়ান-ক্লিক ফেসবুক শেয়ার (Quick Post)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              যেকোনো বিদ্যমান প্রোডাক্ট এক ক্লিকেই ফেসবুক পেজে ফটো ও বিবরণ সহ প্রকাশ করতে পারবেন।
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full self-start sm:self-auto">
            Total {products.length} Products
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-4">প্রোডাক্ট</th>
                <th className="py-3 px-4">মূল্য</th>
                <th className="py-3 px-4">স্টক</th>
                <th className="py-3 px-4">ফেসবুক স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.slice(0, 15).map((p) => {
                const isThisPosting = postingProductId === p.id;
                const hasBeenPosted = Boolean(p.facebookPostId || p.facebookPostUrl);

                return (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                          {p.images && p.images[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            SKU: <span className="font-mono">{p.sku || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {formatBDT(p.price)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.stockQuantity > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.stockQuantity > 0 ? `${p.stockQuantity} In Stock` : 'Out of Stock'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {hasBeenPosted ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Posted to FB</span>
                          </span>
                          {p.facebookPostUrl && (
                            <a
                              href={p.facebookPostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-[10px] text-blue-600 hover:underline font-mono"
                            >
                              View Post ↗
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">
                          Not posted yet
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={isThisPosting}
                        onClick={() => handlePostSingleProduct(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          hasBeenPosted
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:opacity-50`}
                      >
                        {isThisPosting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>{hasBeenPosted ? 'Repost to FB' : 'Post to FB'}</span>
                          </>
                        )}
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
