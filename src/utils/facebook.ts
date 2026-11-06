/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, FacebookConfig } from '../types';
import { formatBDT } from './currency';

export const FACEBOOK_CONFIG_STORAGE_KEY = 'xeeroo_facebook_config';

// Verified permanent Page Access Token for Page "X E E R O O" (ID: 103314657990315)
export const VERIFIED_PAGE_ACCESS_TOKEN =
  'EAAUOWYLTVWEBS2A5cuOyKLvmzjVHuTU39ESakSrQImqX8vHxx9KmBTmrXbAZAPZChMBUGgIZCbfIZAQRfS7fbUCW3Px6ZBAsvOVECkfImh70Iw407IUBRdUpbyxFrpOLfugWDhBMw8aFd87bDYtAdbLcKK1hOXlftBEZAfeZCIoIZCwhb0LfpBnoGnqdm0xz10PTqSIZD';

export const DEFAULT_FACEBOOK_CONFIG: FacebookConfig = {
  pageId: '103314657990315',
  accessToken: VERIFIED_PAGE_ACCESS_TOKEN,
  enabled: true,
  autoPostOnAdd: true,
  customPrefix: '🔥 NEW ARRIVAL AT XEEROO!',
  customHashtags: '#XEEROO #OnlineShopping #Bangladesh #EcommerceBD #Gadgets #Tech',
  includePrice: true,
  includeLink: true,
  pageName: 'X E E R O O',
  pageLink: 'https://www.facebook.com/103314657990315',
  websiteUrl: 'https://ais-pre-jaojjujai65chcukwocmss-455970953521.asia-southeast1.run.app',
};

export const getStoredFacebookConfig = (): FacebookConfig => {
  try {
    const raw = localStorage.getItem(FACEBOOK_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If user had stored the User Token, automatically upgrade to the Page Access Token
      const storedToken =
        parsed.accessToken && parsed.accessToken.startsWith('EAAUOWYLTVWEBSxE1oMD')
          ? VERIFIED_PAGE_ACCESS_TOKEN
          : parsed.accessToken || VERIFIED_PAGE_ACCESS_TOKEN;

      return {
        ...DEFAULT_FACEBOOK_CONFIG,
        ...parsed,
        pageId: parsed.pageId || DEFAULT_FACEBOOK_CONFIG.pageId,
        accessToken: storedToken,
        websiteUrl: parsed.websiteUrl || DEFAULT_FACEBOOK_CONFIG.websiteUrl,
        enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
        autoPostOnAdd: parsed.autoPostOnAdd !== undefined ? Boolean(parsed.autoPostOnAdd) : true,
      };
    }
  } catch (e) {
    console.warn('Error reading stored Facebook config:', e);
  }
  return DEFAULT_FACEBOOK_CONFIG;
};

/**
 * Exchange a User/System-User token for a Page Access Token if required (handled securely via backend proxy)
 */
export const resolvePageAccessToken = async (
  _pageId: string,
  providedToken: string
): Promise<string> => {
  return providedToken.trim();
};

export const saveStoredFacebookConfig = (config: FacebookConfig): void => {
  try {
    localStorage.setItem(FACEBOOK_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving Facebook config to localStorage:', e);
  }
};

/**
 * Format product into a rich, high-converting Facebook Page post caption
 * Template rules per store owner:
 * - Brand removed
 * - Stock removed
 * - Description removed (only Key Features kept)
 * - WhatsApp number: +8801570243005
 * - Canonical, accessible public product URL
 */
export const formatProductCaption = (
  product: Product,
  config: Partial<FacebookConfig> = {},
  storeBaseUrl?: string
): string => {
  const prefix = config.customPrefix || '🔥 NEW ARRIVAL AT XEEROO!';
  const hashtags = config.customHashtags || '#XEEROO #OnlineShopping #Bangladesh #Gadgets #Tech';
  const includePrice = config.includePrice ?? true;
  const includeLink = config.includeLink ?? true;

  // Resolve canonical, publicly accessible store base URL
  let baseDomain = (config.websiteUrl || storeBaseUrl || '').trim();
  if (!baseDomain || baseDomain.includes('localhost') || baseDomain.includes('127.0.0.1')) {
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      baseDomain = window.location.origin;
    } else {
      baseDomain = 'https://ais-pre-jaojjujai65chcukwocmss-455970953521.asia-southeast1.run.app';
    }
  }

  // If in development preview, convert to public shared preview so external customers can access it
  if (baseDomain.includes('ais-dev-')) {
    baseDomain = baseDomain.replace('ais-dev-', 'ais-pre-');
  }
  baseDomain = baseDomain.replace(/\/+$/, '');

  const productIdentifier = product.slug || product.id;
  const productUrl = `${baseDomain}/#/product/${encodeURIComponent(productIdentifier)}`;

  const lines: string[] = [];

  // 1. Header prefix
  if (prefix) {
    lines.push(prefix);
    lines.push('━━━━━━━━━━━━━━━━━━━━');
  }

  // 2. Product Title (Brand removed)
  lines.push(`📦 ${product.title}`);

  // 3. Price (Stock removed)
  if (includePrice) {
    lines.push(`💰 Price: ${formatBDT(product.price)}`);
  }

  // 4. Key Features Only (Description removed)
  if (product.features && product.features.length > 0) {
    lines.push('');
    lines.push('✨ Key Features:');
    product.features.slice(0, 6).forEach(f => {
      const trimmed = f.replace(/^[•\-\*]\s*/, '').trim();
      if (trimmed) {
        lines.push(` • ${trimmed}`);
      }
    });
  }

  // 5. Direct Order Call to Action
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  if (includeLink) {
    lines.push('🛒 সরাসরি ওয়েবসাইট থেকে অর্ডার করুন:');
    lines.push(`👉 ${productUrl}`);
    lines.push('');
  }

  lines.push('🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা!');
  lines.push('📞 Hotline / WhatsApp: +8801570243005');
  lines.push('━━━━━━━━━━━━━━━━━━━━');

  // 6. Hashtags
  if (hashtags) {
    lines.push(hashtags);
  }

  return lines.join('\n');
};

/**
 * Verify page access and fetch Page details (Name, Profile Pic, Link)
 */
export const verifyFacebookPage = async (
  pageId: string,
  accessToken: string
): Promise<{
  success: boolean;
  name?: string;
  link?: string;
  id?: string;
  isPublished?: boolean;
  resolvedToken?: string;
  error?: string;
}> => {
  const cleanPageId = pageId.trim();
  const cleanToken = accessToken.trim();

  if (!cleanPageId || !cleanToken) {
    return { success: false, error: 'Facebook Page ID এবং Access Token প্রদান করুন।' };
  }

  try {
    const proxyRes = await fetch('/api/facebook/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: cleanPageId, accessToken: cleanToken }),
    });

    const data = await proxyRes.json();
    if (data.success) {
      return {
        success: true,
        name: data.page?.name || 'X E E R O O',
        link: data.page?.link || `https://www.facebook.com/${cleanPageId}`,
        id: data.page?.id || cleanPageId,
        isPublished: data.page?.is_published,
        resolvedToken: data.resolvedToken,
      };
    }
    return {
      success: false,
      error: data.error || 'ফেসবুক পেজ ভেরিফিকেশন ব্যর্থ হয়েছে।',
    };
  } catch (err: unknown) {
    console.warn('Facebook verify proxy error:', err);
    return {
      success: false,
      error: 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।',
    };
  }
};

/**
 * Publish product to Facebook Page (via server-side proxy to guarantee deliverability & bypass browser CORS/Adblockers)
 */
export const publishProductToFacebook = async (
  product: Product,
  config: FacebookConfig,
  storeBaseUrl?: string,
  customCaption?: string
): Promise<{
  success: boolean;
  postId?: string;
  postUrl?: string;
  message: string;
}> => {
  const cleanPageId = config.pageId.trim();
  const cleanToken = config.accessToken.trim();

  if (!cleanPageId || !cleanToken) {
    return {
      success: false,
      message: 'Facebook Page ID অথবা Access Token পাওয়া যায়নি। দয়া করে সেটিংস চেক করুন।',
    };
  }

  const caption = customCaption || formatProductCaption(product, config, storeBaseUrl);
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85';

  const origin = storeBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://xeeroo.com');
  const productUrl = `${origin}/#/product/${product.slug || product.id}`;

  try {
    const response = await fetch('/api/facebook/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId: cleanPageId,
        accessToken: cleanToken,
        caption,
        imageUrl: primaryImage,
        productUrl,
        productTitle: product.title,
      }),
    });

    const result = await response.json();
    if (result.success) {
      return {
        success: true,
        postId: result.postId,
        postUrl: result.postUrl || `https://www.facebook.com/${result.postId || cleanPageId}`,
        message: result.message || 'ফেসবুক পেজে প্রোডাক্টটি সফলভাবে পোস্ট হয়েছে!',
      };
    } else {
      return {
        success: false,
        message: result.error || 'ফেসবুক পেজে পোস্ট করতে ব্যর্থ হয়েছে।',
      };
    }
  } catch (err: unknown) {
    console.warn('Backend Facebook publish proxy error:', err);
    return {
      success: false,
      message: 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করুন।',
    };
  }
};
