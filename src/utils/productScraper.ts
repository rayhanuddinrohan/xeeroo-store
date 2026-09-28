/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScrapedProductResult {
  title: string;
  description: string;
  price: number;
  currency: string;
  brand: string;
  category: string;
  sku: string;
  stockQuantity: number;
  images: string[];
  features: string[];
  specifications: Record<string, string>;
  originalUrl: string;
  sourceDomain: string;
}

/**
 * Clean image URL to get the highest resolution possible
 */
export function sanitizeAndUpresImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.replace(/\\"/g, '"').replace(/\\\//g, '/').trim();
  
  if (cleaned.startsWith('//')) {
    cleaned = 'https:' + cleaned;
  }

  // Amazon: Strip thumbnail crop dimensions (e.g., ._AC_SX679_ or ._SX425_ or ._AC_US40_)
  if (cleaned.includes('media-amazon.com') || cleaned.includes('images-amazon.com')) {
    cleaned = cleaned.replace(/\._[A-Z0-9_,]+_\./i, '.');
  }

  // AliExpress: Strip thumbnail suffixes like _50x50.jpg, _220x220.jpg, _Q90.jpg_.webp
  if (cleaned.includes('alicdn.com')) {
    cleaned = cleaned.replace(/_[0-9]+x[0-9]+[a-z0-9_]*\.(?:jpg|png|webp|jpeg)/i, '.jpg');
    cleaned = cleaned.replace(/_\.webp$/i, '');
  }

  // Alibaba: Strip thumbnail suffixes
  if (cleaned.includes('sc04.alicdn.com') || cleaned.includes('alibaba.com')) {
    cleaned = cleaned.replace(/_[0-9]+x[0-9]+[a-z0-9_]*\.(?:jpg|png|webp)/i, '');
  }

  return cleaned;
}

/**
 * Extract product information directly from HTML string in the browser
 */
export function parseProductFromHtml(html: string, targetUrl: string): ScrapedProductResult {
  const urlObj = new URL(targetUrl);
  const domain = urlObj.hostname.replace('www.', '');

  let title = '';
  let description = '';
  let price = 0;
  let currency = 'BDT';
  let brand = 'XEEROO Gear';
  let category = 'Gadgets';
  let sku = `IMP-${Date.now().toString().slice(-5)}`;
  const images: string[] = [];
  const features: string[] = [];
  const specifications: Record<string, string> = {};

  const addImage = (u: string) => {
    const sanitized = sanitizeAndUpresImageUrl(u);
    if (
      sanitized &&
      sanitized.startsWith('http') &&
      !sanitized.includes('sprite') &&
      !sanitized.includes('placeholder') &&
      !sanitized.includes('icon') &&
      !sanitized.includes('logo') &&
      !images.includes(sanitized) &&
      images.length < 10
    ) {
      images.push(sanitized);
    }
  };

  // 1. Check for JSON-LD Schema (schema.org/Product)
  const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsedJson = JSON.parse(match[1]);
      const checkProduct = (obj: any): any => {
        if (!obj) return null;
        if (obj['@type'] === 'Product') return obj;
        if (Array.isArray(obj)) {
          for (const it of obj) {
            const found = checkProduct(it);
            if (found) return found;
          }
        }
        if (Array.isArray(obj['@graph'])) {
          for (const it of obj['@graph']) {
            const found = checkProduct(it);
            if (found) return found;
          }
        }
        return null;
      };

      const found = checkProduct(parsedJson);
      if (found) {
        if (found.name && !title) title = found.name;
        if (found.description && !description) description = found.description;
        if (found.sku) sku = found.sku;
        if (found.brand) {
          brand = typeof found.brand === 'string' ? found.brand : found.brand.name || brand;
        }

        // Price & Currency from offers
        if (found.offers) {
          const offer = Array.isArray(found.offers) ? found.offers[0] : found.offers;
          if (offer) {
            const rawP = offer.price || offer.lowPrice || offer.highPrice;
            if (rawP) price = parseFloat(String(rawP).replace(/[^0-9.]/g, '')) || 0;
            if (offer.priceCurrency) currency = offer.priceCurrency;
          }
        }

        // Images from schema
        if (found.image) {
          if (Array.isArray(found.image)) {
            found.image.forEach((img: any) => {
              if (typeof img === 'string') addImage(img);
              else if (img?.url) addImage(img.url);
            });
          } else if (typeof found.image === 'string') {
            addImage(found.image);
          } else if (found.image?.url) {
            addImage(found.image.url);
          }
        }
        break;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // 2. OpenGraph & Meta Tag extractors
  const getMeta = (prop: string): string => {
    const r1 = new RegExp(`<meta\\s+(?:property|name)=["'](?:og:|twitter:)?${prop}["']\\s+content=["'](.*?)["']`, 'i');
    const r2 = new RegExp(`<meta\\s+content=["'](.*?)["']\\s+(?:property|name)=["'](?:og:|twitter:)?${prop}["']`, 'i');
    const m = html.match(r1) || html.match(r2);
    return m ? m[1].trim() : '';
  };

  if (!title) {
    title = getMeta('title');
    if (!title) {
      const titleTag = html.match(/<title>([^<]*)<\/title>/i);
      title = titleTag ? titleTag[1].trim() : '';
    }
  }
  // Clean store title suffixes
  title = title.replace(/\s*[|\-–—]\s*(?:Amazon|Daraz|StarTech|Ryans|AliExpress|Alibaba|Shopify|eBay).*$/i, '').trim();

  if (!description) {
    description = getMeta('description');
  }

  const ogImage = getMeta('image');
  if (ogImage) addImage(ogImage);

  // 3. Amazon Dedicated Extraction
  if (domain.includes('amazon')) {
    // Brand
    const brandMatch = html.match(/id=["']bylineInfo["'][^>]*>Visit the (.*?) Store<\/a>/i) ||
                       html.match(/id=["']bylineInfo["'][^>]*>Brand:\s*(.*?)<\/a>/i);
    if (brandMatch) brand = brandMatch[1].trim();

    // High Res Images
    const amazonHiResMatches = html.matchAll(/"(?:hiRes|large)"\s*:\s*"(https?:[^"]+)"/gi);
    for (const m of amazonHiResMatches) {
      addImage(m[1]);
    }

    const amazonDynImgMatches = html.matchAll(/data-a-dynamic-image=["'](\{.*?\})["']/gi);
    for (const m of amazonDynImgMatches) {
      try {
        const dynObj = JSON.parse(m[1].replace(/&quot;/g, '"'));
        Object.keys(dynObj).forEach(k => addImage(k));
      } catch {
        // ignore
      }
    }

    const amazonOldHiRes = html.matchAll(/data-old-hires=["'](https?:[^"']+)["']/gi);
    for (const m of amazonOldHiRes) {
      addImage(m[1]);
    }

    // Price
    const amazonPriceMatch = html.match(/class=["'][^"']*a-price-whole[^"']*["']>([0-9,]+)/i);
    if (amazonPriceMatch) {
      const whole = amazonPriceMatch[1].replace(/,/g, '');
      const fracMatch = html.match(/class=["'][^"']*a-price-fraction[^"']*["']>([0-9]+)/i);
      const frac = fracMatch ? `.${fracMatch[1]}` : '';
      price = parseFloat(`${whole}${frac}`) || price;
      currency = 'USD';
    }

    // Bullets / Features
    const bulletRegex = /<span class=["']a-list-item["']>([\s\S]*?)<\/span>/gi;
    let bMatch: RegExpExecArray | null;
    while ((bMatch = bulletRegex.exec(html)) !== null && features.length < 8) {
      const cleanB = bMatch[1].replace(/<[^>]+>/g, '').trim();
      if (cleanB && cleanB.length > 10 && !cleanB.includes('Customer Reviews') && !cleanB.includes('Amazon')) {
        features.push(cleanB);
      }
    }
  }

  // 4. AliExpress & Alibaba Dedicated Extraction
  if (domain.includes('aliexpress') || domain.includes('alibaba')) {
    brand = domain.includes('aliexpress') ? 'AliExpress Premium' : 'Alibaba Direct';
    
    // Search for images in runParams or gallery config
    const aliImgMatches = html.matchAll(/"(https:\/\/[^"]*(?:alicdn\.com|alibaba\.com)[^"]*\.(?:jpg|png|webp|jpeg))"/gi);
    for (const m of aliImgMatches) {
      addImage(m[1]);
    }

    // Secondary search for img tags with alicdn
    const imgTagMatches = html.matchAll(/<img[^>]+src=["'](https:\/\/[^"']*(?:alicdn\.com|alibaba\.com)[^"']*)["']/gi);
    for (const m of imgTagMatches) {
      addImage(m[1]);
    }

    // Price extraction for AliExpress/Alibaba
    const aliPriceMatch = html.match(/"formattedPrice"\s*:\s*"([^"]+)"/i) ||
                          html.match(/"minPrice"\s*:\s*"?([0-9.]+)"?/i) ||
                          html.match(/US\s*\$\s*([0-9.]+)/i);
    if (aliPriceMatch) {
      price = parseFloat(aliPriceMatch[1].replace(/[^0-9.]/g, '')) || price;
      currency = 'USD';
    }
  }

  // 5. Generic img tag search if still no images found
  if (images.length === 0) {
    const genericImgMatches = html.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|png|webp|jpeg))["']/gi);
    for (const m of genericImgMatches) {
      addImage(m[1]);
    }
  }

  // Clean description HTML tags
  description = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (description.length > 500) {
    description = description.slice(0, 500) + '...';
  }

  return {
    title: title || 'Extracted Hardware Product',
    description: description || 'High-performance authentic tech accessory imported via direct product link.',
    price: price > 0 ? price : 2500,
    currency,
    brand: brand || 'XEEROO Gear',
    category,
    sku,
    stockQuantity: 25,
    images: images.length > 0 ? images : [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    ],
    features: features.length > 0 ? features : [
      'Premium acoustic precision engineering',
      'Ultra-durable ergonomic chassis',
      'Universal broad compatibility',
      'Official verified warranty coverage'
    ],
    specifications,
    originalUrl: targetUrl,
    sourceDomain: domain,
  };
}

/**
 * Universal Scraper with automatic GitHub / Static / Dev fallback!
 * 1. Tries local backend /api/scrape-product (if running in dev)
 * 2. If running on GitHub Pages (static), falls back to high-availability CORS proxies
 */
export async function scrapeProductFromAnyUrl(targetUrl: string): Promise<ScrapedProductResult> {
  const cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith('http')) {
    throw new Error('অনুগ্রহ করে http:// বা https:// দিয়ে শুরু হওয়া সঠিক প্রোডাক্টের লিংক দিন।');
  }

  // Strategy A: Try backend API route (/api/scrape-product)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        controller.abort(new Error('Connection timeout'));
      } catch {
        // ignore
      }
    }, 22000);

    const localResponse = await fetch(`/api/scrape-product?url=${encodeURIComponent(cleanUrl)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = localResponse.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await localResponse.json();
      if (data.success && data.product && data.product.title) {
        return data.product;
      }
      if (data.error) {
        throw new Error(data.error);
      }
    }
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    // If backend gave an explicit error message, rethrow it directly
    if (
      error.message &&
      !error.message.includes('aborted') &&
      !error.message.includes('Failed to fetch') &&
      !error.message.includes('Load failed')
    ) {
      throw err;
    }
    // Otherwise fallback to client-side proxies
  }

  // Strategy B: Client-Side Proxies
  const proxyFetchers = [
    // 1. AllOrigins JSON wrapper
    async (target: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort(new Error('Proxy timeout'));
        } catch {
          // ignore
        }
      }, 12000);
      try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(target)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        const data = await res.json();
        return typeof data.contents === 'string' ? data.contents : null;
      } catch {
        clearTimeout(timeoutId);
        return null;
      }
    },
    // 2. CorsProxy.io
    async (target: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort(new Error('Proxy timeout'));
        } catch {
          // ignore
        }
      }, 12000);
      try {
        const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(target)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        return await res.text();
      } catch {
        clearTimeout(timeoutId);
        return null;
      }
    },
    // 3. CodeTabs
    async (target: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort(new Error('Proxy timeout'));
        } catch {
          // ignore
        }
      }, 12000);
      try {
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        return await res.text();
      } catch {
        clearTimeout(timeoutId);
        return null;
      }
    },
  ];

  let lastError: Error | null = null;

  for (const fetcher of proxyFetchers) {
    try {
      const html = await fetcher(cleanUrl);
      if (html && html.length > 300) {
        if (
          html.includes('The page could not be found') ||
          html.includes('404: NOT_FOUND') ||
          html.includes('403 Forbidden')
        ) {
          continue;
        }

        const parsed = parseProductFromHtml(html, cleanUrl);
        if (parsed.title) {
          return parsed;
        }
      }
    } catch (err: unknown) {
      lastError = err as Error;
    }
  }

  const isTimeout =
    lastError?.name === 'AbortError' ||
    lastError?.message?.includes('aborted') ||
    lastError?.message?.includes('timeout');

  throw new Error(
    isTimeout
      ? 'ওয়েবসাইটের সাথে সংযোগ করতে সময় বেশি লেগেছে (Connection Timeout)। অনুগ্রহ করে লিঙ্কটি চেক করুন অথবা ম্যানুয়ালি তথ্য পূরণ করুন।'
      : (lastError?.message && !lastError.message.includes('aborted')
          ? lastError.message
          : 'লিংক থেকে স্বয়ংক্রিয়ভাবে তথ্য সংগ্রহ করা যায়নি। সাইটটি বোট প্রটেকশন দিয়ে সুরক্ষিত থাকতে পারে। আপনি ম্যানুয়ালি তথ্য পূরণ করতে পারেন।')
  );
}
