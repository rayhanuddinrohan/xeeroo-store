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
 * Exchange a User/System-User token for a Page Access Token if required
 */
export const resolvePageAccessToken = async (
  pageId: string,
  providedToken: string
): Promise<string> => {
  const cleanId = pageId.trim();
  const cleanTok = providedToken.trim();
  if (!cleanId || !cleanTok) return cleanTok;

  try {
    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanId)}?fields=access_token&access_token=${encodeURIComponent(cleanTok)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.access_token) {
      return data.access_token;
    }
  } catch (e) {
    console.warn('Failed to resolve page access token from provided token:', e);
  }
  return cleanTok;
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
 */
export const formatProductCaption = (
  product: Product,
  config: Partial<FacebookConfig> = {},
  storeBaseUrl?: string
): string => {
  const prefix = config.customPrefix || '🔥 NEW ARRIVAL AT XEEROO!';
  const hashtags = config.customHashtags || '#XEEROO #OnlineShopping #Bangladesh';
  const includePrice = config.includePrice ?? true;
  const includeLink = config.includeLink ?? true;

  const origin = storeBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://xeeroo.com');
  const productUrl = `${origin}/#/product/${product.slug || product.id}`;

  const lines: string[] = [];

  // 1. Header prefix
  if (prefix) {
    lines.push(prefix);
    lines.push('━━━━━━━━━━━━━━━━━━━━');
  }

  // 2. Product Title & Brand
  lines.push(`📦 ${product.title}`);
  if (product.brand && product.brand !== 'General') {
    lines.push(`🏷️ Brand: ${product.brand}`);
  }

  // 3. Price & Stock
  if (includePrice) {
    lines.push(`💰 Price: ${formatBDT(product.price)}`);
    if (product.stockQuantity && product.stockQuantity > 0) {
      lines.push(`⚡ Stock: In Stock (${product.stockQuantity} units available)`);
    }
  }

  // 4. Features & Highlights (if available)
  if (product.features && product.features.length > 0) {
    lines.push('');
    lines.push('✨ Key Features:');
    product.features.slice(0, 5).forEach(f => {
      lines.push(` • ${f}`);
    });
  }

  // 5. Short Description (clean HTML tags if any)
  if (product.description) {
    const cleanDesc = product.description
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanDesc) {
      lines.push('');
      lines.push('📝 Description:');
      lines.push(cleanDesc.length > 320 ? `${cleanDesc.slice(0, 317)}...` : cleanDesc);
    }
  }

  // 6. Direct Order Call to Action
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  if (includeLink) {
    lines.push('🛒 সরাসরি ওয়েবসাইট থেকে অর্ডার করুন:');
    lines.push(`👉 ${productUrl}`);
    lines.push('');
  }

  lines.push('🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা!');
  lines.push('📞 Hotline / WhatsApp: +880 1712-345678');
  lines.push('━━━━━━━━━━━━━━━━━━━━');

  // 7. Hashtags
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
  error?: string;
}> => {
  const cleanPageId = pageId.trim();
  const cleanToken = accessToken.trim();

  if (!cleanPageId || !cleanToken) {
    return { success: false, error: 'Page ID এবং Page Access Token প্রদান করুন।' };
  }

  // Try via backend proxy first
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
        };
      }
      if (data.error) {
        return { success: false, error: data.error };
      }
    }
  } catch {
    // Fall back to direct Graph API call
  }

  try {
    const directUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}?fields=id,name,link,is_published&access_token=${encodeURIComponent(cleanToken)}`;
    const res = await fetch(directUrl);
    const data = await res.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message || `Facebook API Error: ${data.error.code}`,
      };
    }

    return {
      success: true,
      name: data.name,
      link: data.link || `https://www.facebook.com/${data.id}`,
      id: data.id,
      isPublished: data.is_published,
    };
  } catch (err: unknown) {
    const e = err as { message?: string };
    return {
      success: false,
      error: e.message || 'Facebook API-তে সংযোগ করা যায়নি। নেটওয়ার্ক চেক করুন।',
    };
  }
};

/**
 * Publish product to Facebook Page
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

  // Automatically resolve the Page Access Token if a user or system-user token was provided
  const effectiveToken = await resolvePageAccessToken(cleanPageId, cleanToken);

  // 1. First attempt: Use backend proxy to avoid CORS and handle upload safely
  try {
    const response = await fetch('/api/facebook/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId: cleanPageId,
        accessToken: effectiveToken,
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
    } else if (result.error && !result.canFallbackDirect) {
      return {
        success: false,
        message: result.error,
      };
    }
  } catch (backendErr) {
    console.warn('Backend Facebook proxy error, attempting direct call:', backendErr);
  }

  // 2. Second attempt: Direct call to Facebook Graph API
  try {
    // If we have a publicly accessible image URL (http/https not data:image or localhost)
    const isPublicImage =
      primaryImage &&
      primaryImage.startsWith('http') &&
      !primaryImage.includes('localhost') &&
      !primaryImage.includes('127.0.0.1');

    if (isPublicImage) {
      // POST to /{page_id}/photos
      const photoEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}/photos`;
      const formData = new URLSearchParams();
      formData.append('url', primaryImage);
      formData.append('caption', caption);
      formData.append('access_token', effectiveToken);

      const res = await fetch(photoEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await res.json();
      if (data.id || data.post_id) {
        const id = data.post_id || data.id;
        return {
          success: true,
          postId: id,
          postUrl: `https://www.facebook.com/${id}`,
          message: 'ফেসবুক পেজে ছবি সহ প্রোডাক্টটি সফলভাবে পোস্ট হয়েছে!',
        };
      }

      if (data.error) {
        console.warn('Facebook photo post error:', data.error);
        // If photo upload failed, fallback to feed post below
      }
    }

    // Fallback: POST to /{page_id}/feed
    const feedEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}/feed`;
    const feedData = new URLSearchParams();
    feedData.append('message', caption);
    if (productUrl.startsWith('http')) {
      feedData.append('link', productUrl);
    }
    feedData.append('access_token', effectiveToken);

    const feedRes = await fetch(feedEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: feedData.toString(),
    });

    const feedResult = await feedRes.json();
    if (feedResult.id) {
      return {
        success: true,
        postId: feedResult.id,
        postUrl: `https://www.facebook.com/${feedResult.id}`,
        message: 'ফেসবুক পেজে প্রোডাক্টের পোস্ট সফলভাবে সম্পন্ন হয়েছে!',
      };
    }

    return {
      success: false,
      message: feedResult.error?.message || 'ফেসবুক পেজে পোস্ট করতে ব্যর্থ হয়েছে।',
    };
  } catch (err: unknown) {
    const e = err as { message?: string };
    return {
      success: false,
      message: e.message || 'ফেসবুক API-র সাথে যোগাযোগ করার সময় সমস্যা হয়েছে।',
    };
  }
};
