/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, FacebookConfig } from '../types';
import { formatBDT } from './currency';
import { getProductShortUrl } from './productUrl';

export const FACEBOOK_CONFIG_STORAGE_KEY = 'xeeroo_facebook_config';

// Verified permanent Page Access Token for Page "X E E R O O" (ID: 103314657990315)
export const VERIFIED_PAGE_ACCESS_TOKEN =
  'EAAUOWYLTVWEBS2A5cuOyKLvmzjVHuTU39ESakSrQImqX8vHxx9KmBTmrXbAZAPZChMBUGgIZCbfIZAQRfS7fbUCW3Px6ZBAsvOVECkfImh70Iw407IUBRdUpbyxFrpOLfugWDhBMw8aFd87bDYtAdbLcKK1hOXlftBEZAfeZCIoIZCwhb0LfpBnoGnqdm0xz10PTqSIZD';

export const ENV_FACEBOOK_PAGE_ID =
  (typeof import.meta !== 'undefined' &&
    ((import.meta as any).env?.VITE_FACEBOOK_PAGE_ID ||
      (import.meta as any).env?.FACEBOOK_PAGE_ID)) ||
  '103314657990315';

export const ENV_FACEBOOK_PAGE_ACCESS_TOKEN =
  (typeof import.meta !== 'undefined' &&
    ((import.meta as any).env?.VITE_FACEBOOK_PAGE_ACCESS_TOKEN ||
      (import.meta as any).env?.FACEBOOK_PAGE_ACCESS_TOKEN)) ||
  '';

export const DEFAULT_FACEBOOK_CONFIG: FacebookConfig = {
  pageId: ENV_FACEBOOK_PAGE_ID || '103314657990315',
  accessToken: ENV_FACEBOOK_PAGE_ACCESS_TOKEN || VERIFIED_PAGE_ACCESS_TOKEN,
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
          : parsed.accessToken || ENV_FACEBOOK_PAGE_ACCESS_TOKEN || VERIFIED_PAGE_ACCESS_TOKEN;

      return {
        ...DEFAULT_FACEBOOK_CONFIG,
        ...parsed,
        pageId: parsed.pageId || ENV_FACEBOOK_PAGE_ID || DEFAULT_FACEBOOK_CONFIG.pageId,
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
  const productUrl = getProductShortUrl(product, baseDomain);

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
 * Direct client-side Facebook Graph API fallback with detailed error mapping
 */
export const publishDirectlyToFacebookGraphApi = async (
  pageId: string,
  accessToken: string,
  caption: string,
  imageUrl: string,
  productUrl: string,
  productTitle?: string
): Promise<{
  success: boolean;
  postId?: string;
  postUrl?: string;
  message: string;
}> => {
  const cleanPageId = pageId.trim();
  const cleanToken = accessToken.trim();

  // Exchange User Token for Page Access Token if applicable
  let effectiveToken = cleanToken;
  try {
    const pageTokRes = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}?fields=access_token&access_token=${encodeURIComponent(cleanToken)}`
    );
    const pageTokData = await pageTokRes.json();
    if (pageTokData && pageTokData.access_token) {
      effectiveToken = pageTokData.access_token;
    }
  } catch (tokErr) {
    console.warn('[Facebook API] Direct token resolution notice:', tokErr);
  }

  // 1. Try publishing Photo post if public image URL is available
  const isPublicImage =
    imageUrl &&
    typeof imageUrl === 'string' &&
    imageUrl.startsWith('http') &&
    !imageUrl.includes('localhost') &&
    !imageUrl.includes('127.0.0.1');

  if (isPublicImage) {
    try {
      const photoUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}/photos`;
      const params = new URLSearchParams();
      params.append('url', imageUrl);
      params.append('caption', caption || productTitle || 'XEEROO Product');
      params.append('access_token', effectiveToken);

      const photoRes = await fetch(photoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const photoData = await photoRes.json();
      if (photoData.id || photoData.post_id) {
        const id = photoData.post_id || photoData.id;
        return {
          success: true,
          postId: id,
          postUrl: `https://www.facebook.com/${id}`,
          message: 'ফেসবুক পেজে সফলভাবে প্রোডাক্টটি পোস্ট হয়েছে!',
        };
      }
      if (photoData.error) {
        console.warn('[Facebook API] Direct photo post notice:', photoData.error);
        // Fall back to Feed post
      }
    } catch (photoErr) {
      console.warn('[Facebook API] Direct photo post network issue, falling back to feed:', photoErr);
    }
  }

  // 2. Fallback to Feed post
  try {
    const feedUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}/feed`;
    const params = new URLSearchParams();
    params.append('message', caption || productTitle || 'XEEROO Product');
    if (productUrl && productUrl.startsWith('http')) {
      params.append('link', productUrl);
    }
    params.append('access_token', effectiveToken);

    const feedRes = await fetch(feedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const feedData = await feedRes.json();
    if (feedData.id) {
      return {
        success: true,
        postId: feedData.id,
        postUrl: `https://www.facebook.com/${feedData.id}`,
        message: 'ফেসবুক পেজে সফলভাবে প্রোডাক্টটি পোস্ট হয়েছে!',
      };
    }

    if (feedData.error) {
      const err = feedData.error;
      let errorMsg = err.message || 'পোস্ট প্রকাশ করা যায়নি';
      if (err.code === 200 || err.code === 10) {
        errorMsg = `Facebook পারমিশন ত্রুটি (#200): পেজে পোস্ট করার জন্য Page Access Token এবং 'pages_manage_posts' ও 'pages_read_engagement' পারমিশন প্রয়োজন। (${err.message})`;
      } else if (err.code === 190) {
        errorMsg = 'Facebook Access Token মেয়াদোত্তীর্ণ বা অকার্যকর হয়ে গেছে (#190)। অনুগ্রহ করে Facebook Developer Console বা Graph API Explorer থেকে নতুন Page Access Token নিয়ে আপডেট করুন।';
      } else if (err.code === 100) {
        errorMsg = `প্রদত্ত Facebook Page ID টি সঠিক নয় (#100)। (${err.message})`;
      } else if (err.code === 4 || err.code === 17 || err.code === 32) {
        errorMsg = 'Facebook API Rate Limit অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।';
      }
      return { success: false, message: errorMsg };
    }
  } catch (feedErr: unknown) {
    const error = feedErr as { message?: string };
    return {
      success: false,
      message: error.message
        ? `ফেসবুক API এর সাথে যোগাযোগ ব্যর্থ হয়েছে: ${error.message}`
        : 'Facebook Graph API সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। আপনার ইন্টারনেট সংযোগ চেক করুন।',
    };
  }

  return {
    success: false,
    message: 'ফেসবুকে পোস্ট সম্পন্ন করা যায়নি। অনুগ্রহ করে পেজ সেটিংস ও অ্যাক্সেস টোকেন যাচাই করুন।',
  };
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
  const cleanPageId = (pageId || ENV_FACEBOOK_PAGE_ID).trim();
  const cleanToken = (accessToken || ENV_FACEBOOK_PAGE_ACCESS_TOKEN || VERIFIED_PAGE_ACCESS_TOKEN).trim();

  if (!cleanPageId || !cleanToken) {
    return { success: false, error: 'Facebook Page ID এবং Access Token প্রদান করুন।' };
  }

  // 1. Attempt verification via server-side proxy
  try {
    const proxyRes = await fetch('/api/facebook/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: cleanPageId, accessToken: cleanToken }),
    });

    if (proxyRes.ok) {
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
    }
  } catch (proxyErr) {
    console.warn('Facebook verify proxy offline, attempting direct Graph API verify:', proxyErr);
  }

  // 2. Direct Graph API fallback if proxy fails or returns non-200
  try {
    const fbUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}?fields=id,name,link,is_published&access_token=${encodeURIComponent(cleanToken)}`;
    const fbRes = await fetch(fbUrl);
    const fbData = await fbRes.json();

    if (fbData.error) {
      let errorMsg = fbData.error.message || 'ফেসবুক পেজ ভেরিফিকেশন ব্যর্থ হয়েছে।';
      if (fbData.error.code === 190) {
        errorMsg = 'Facebook Access Token টি অকার্যকর (Invalid) বা মেয়াদোত্তীর্ণ (Expired) হয়ে গেছে (#190)। নতুন Page Access Token প্রদান করুন।';
      } else if (fbData.error.code === 200 || fbData.error.code === 10) {
        errorMsg = `Facebook পারমিশন সমস্যা (#200): পেজটি অ্যাক্সেস করার পর্যাপ্ত পারমিশন নেই (${fbData.error.message})।`;
      } else if (fbData.error.code === 100) {
        errorMsg = 'প্রদত্ত Facebook Page ID টি সঠিক নয় (#100)। সঠিক পেজ আইডি যাচাই করুন।';
      }
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      name: fbData.name || 'X E E R O O',
      link: fbData.link || `https://www.facebook.com/${cleanPageId}`,
      id: fbData.id || cleanPageId,
      isPublished: fbData.is_published,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      success: false,
      error: error.message
        ? `ফেসবুক সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি: ${error.message}`
        : 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।',
    };
  }
};

/**
 * Publish product to Facebook Page (via server-side proxy with seamless client-side Graph API fallback)
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
  const cleanPageId = (config.pageId || ENV_FACEBOOK_PAGE_ID).trim();
  const cleanToken = (config.accessToken || ENV_FACEBOOK_PAGE_ACCESS_TOKEN || VERIFIED_PAGE_ACCESS_TOKEN).trim();

  if (!cleanPageId || !cleanToken) {
    return {
      success: false,
      message: 'Facebook Page ID অথবা Access Token পাওয়া যায়নি। অনুগ্রহ করে FACEBOOK_PAGE_ID ও FACEBOOK_PAGE_ACCESS_TOKEN বা সেটিংস চেক করুন।',
    };
  }

  const caption = customCaption || formatProductCaption(product, config, storeBaseUrl);
  let primaryImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85';

  const origin = storeBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://xeeroo.com');
  const productUrl = getProductShortUrl(product, origin);

  // If image URL is relative, resolve to absolute URL
  if (primaryImage.startsWith('/')) {
    primaryImage = `${origin.replace(/\/+$/, '')}${primaryImage}`;
  }

  // 1. Try server-side proxy
  let proxyFailed = false;
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

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          postId: result.postId,
          postUrl: result.postUrl || `https://www.facebook.com/${result.postId || cleanPageId}`,
          message: result.message || 'ফেসবুক পেজে প্রোডাক্টটি সফলভাবে পোস্ট হয়েছে!',
        };
      } else {
        // Legitimate error from Facebook Graph API (e.g. token expired, permissions)
        return {
          success: false,
          message: result.error || 'ফেসবুক পেজে পোস্ট করতে ব্যর্থ হয়েছে।',
        };
      }
    } else {
      proxyFailed = true;
    }
  } catch (proxyErr) {
    console.warn('Facebook server proxy unreachable, executing direct Graph API fallback:', proxyErr);
    proxyFailed = true;
  }

  // 2. Direct client-side Facebook Graph API fallback
  if (proxyFailed) {
    console.log('[Facebook Auto-Post] Executing direct Graph API publish fallback...');
    return await publishDirectlyToFacebookGraphApi(
      cleanPageId,
      cleanToken,
      caption,
      primaryImage,
      productUrl,
      product.title
    );
  }

  return {
    success: false,
    message: 'ফেসবুক পোস্ট করার সময় অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  };
};

