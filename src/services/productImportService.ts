/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';
import { saveFirestoreProduct } from '../lib/firebase';

export interface BusinessKoroRawProduct {
  id?: string | number;
  _id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  images?: string[];
  suggestedPrice?: number | string;
  price?: number | string;
  inStock?: boolean;
  stock?: number;
  variants?: any[];
  brand?: string;
  sku?: string;
  category?: string;
  [key: string]: any;
}

export interface ImportSyncResult {
  success: boolean;
  count: number;
  products: Product[];
  message: string;
  error?: string;
}

/**
 * Fetch products from BusinessKoro External API:
 * Base URL: https://api.businesskoro.com/api/v1/storefront
 * Endpoint: GET /products
 * Headers: x-api-key: YOUR_API_KEY
 */
export const fetchBusinessKoroProducts = async (
  apiKey: string,
  origin: string = 'https://xeeroo.com'
): Promise<BusinessKoroRawProduct[]> => {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('API key is required. Please provide a valid BusinessKoro x-api-key.');
  }

  // 1. First attempt: Server-side proxy route (adds required domain headers: Origin, Referer, x-domain)
  try {
    const query = new URLSearchParams({
      apiKey: cleanKey,
      origin: origin.trim() || 'https://xeeroo.com',
    });

    const proxyRes = await fetch(`/api/businesskoro/products?${query.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'x-api-key': cleanKey,
        'x-origin': origin.trim() || 'https://xeeroo.com',
      },
    });

    const text = await proxyRes.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Non-JSON response received from BusinessKoro API.');
    }

    if (!proxyRes.ok || json.error) {
      throw new Error(json.error || json.message || `HTTP ${proxyRes.status}: Failed to fetch products from BusinessKoro.`);
    }

    const list = Array.isArray(json.products)
      ? json.products
      : Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.data?.products)
      ? json.data.products
      : Array.isArray(json)
      ? json
      : [];

    return list;
  } catch (proxyErr: any) {
    console.warn('Proxy fetch to BusinessKoro failed, attempting direct fetch...', proxyErr);

    // 2. Second attempt: Direct fetch to external API with CORS
    try {
      const directRes = await fetch('https://api.businesskoro.com/api/v1/storefront/products', {
        method: 'GET',
        headers: {
          'x-api-key': cleanKey,
          'Accept': 'application/json',
        },
      });

      if (directRes.ok) {
        const data = await directRes.json();
        const list = Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.products)
          ? data.data.products
          : Array.isArray(data)
          ? data
          : [];
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      } else {
        const errData = await directRes.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Authentication failed (${directRes.status}).`);
      }
    } catch {
      // Re-throw the original proxy error which contains the detailed message
    }

    throw new Error(proxyErr.message || 'Could not connect to BusinessKoro API. Please verify your x-api-key and internet connection.');
  }
};

/**
 * Map raw BusinessKoro product to our Firestore Product schema
 */
export const mapBusinessKoroToStoreProduct = (
  raw: BusinessKoroRawProduct,
  defaultCategoryId: string = 'cat-audio'
): Product => {
  const rawId = String(raw.id || raw._id || `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const title = String(raw.name || raw.title || 'BusinessKoro Product').trim();
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `prod-${rawId}`;

  const description = String(raw.description || 'Authentic tech product sourced via BusinessKoro.').trim();

  // Price mapping: suggestedPrice as price
  const suggestedPrice = Number(raw.suggestedPrice) || Number(raw.price) || 990;
  const sellingPrice = Math.round(suggestedPrice);

  // In-stock mapping
  const inStock = raw.inStock !== false;
  const stockQuantity = typeof raw.stock === 'number' ? raw.stock : inStock ? 50 : 0;

  // Images mapping
  const images: string[] = [];
  if (Array.isArray(raw.images)) {
    raw.images.forEach(img => {
      if (typeof img === 'string' && img.trim().startsWith('http')) {
        images.push(img.trim());
      }
    });
  }
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80');
  }

  // Variants mapping
  const variants = Array.isArray(raw.variants) ? raw.variants : [];

  const nowIso = new Date().toISOString();

  return {
    id: `prod-bk-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    title,
    name: title,
    slug,
    description,
    price: sellingPrice,
    suggestedPrice,
    stockQuantity,
    inStock,
    variants,
    soldCount: 0,
    sku: String(raw.sku || `BK-${rawId.slice(-6)}`).toUpperCase(),
    categoryId: defaultCategoryId,
    images,
    isPublished: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    updatedBy: 'businesskoro_api_sync',
    rating: 5,
    reviewsCount: 0,
    brand: String(raw.brand || 'BusinessKoro').trim(),
    features: [
      'Official BusinessKoro Verified Supplier',
      'Original Manufacturer Quality',
      'Fast Delivery across Bangladesh',
    ],
  };
};

/**
 * Fetch and sync all products directly to Firestore database
 */
export const syncBusinessKoroProductsToFirestore = async (
  apiKey: string,
  targetCategoryId: string = 'cat-audio',
  onProgress?: (synced: number, total: number) => void
): Promise<ImportSyncResult> => {
  const rawProducts = await fetchBusinessKoroProducts(apiKey);
  if (!rawProducts || rawProducts.length === 0) {
    return {
      success: true,
      count: 0,
      products: [],
      message: 'Connected to BusinessKoro API successfully, but no products were returned in the feed.',
    };
  }

  const mappedProducts: Product[] = [];
  let savedCount = 0;

  for (let i = 0; i < rawProducts.length; i++) {
    const raw = rawProducts[i];
    const product = mapBusinessKoroToStoreProduct(raw, targetCategoryId);
    mappedProducts.push(product);

    // Save directly to Firestore Products collection
    await saveFirestoreProduct(product);
    savedCount++;
    onProgress?.(savedCount, rawProducts.length);
  }

  return {
    success: true,
    count: mappedProducts.length,
    products: mappedProducts,
    message: `Successfully imported and synced ${mappedProducts.length} products to Firestore!`,
  };
};
