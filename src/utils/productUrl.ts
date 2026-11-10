/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

/**
 * Character set for clean, readable, collision-resistant short codes.
 * Excludes ambiguous characters (0, O, 1, l, I) to prevent confusion when shared.
 */
const SHORT_CODE_CHARSET = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * Generates an 8-character unique short code (e.g., 'k7x9m2p1').
 */
export function generateShortCode(length: number = 8): string {
  let result = '';
  const charsetLen = SHORT_CODE_CHARSET.length;
  // Use crypto when available in browser or Node
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      result += SHORT_CODE_CHARSET[bytes[i] % charsetLen];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += SHORT_CODE_CHARSET[Math.floor(Math.random() * charsetLen)];
    }
  }
  return result;
}

/**
 * Resolves a canonical, publicly accessible store domain.
 * Converts internal dev domain (ais-dev-) to public preview domain (ais-pre-)
 * so that shared short URLs work for external visitors and social media bots.
 */
export function resolveCanonicalStoreDomain(explicitUrl?: string): string {
  let domain = (explicitUrl || '').trim();

  if (!domain || domain.includes('localhost') || domain.includes('127.0.0.1')) {
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      domain = window.location.origin;
    } else {
      domain = 'https://ais-pre-jaojjujai65chcukwocmss-455970953521.asia-southeast1.run.app';
    }
  }

  // Convert development preview to public preview for external sharing
  if (domain.includes('ais-dev-')) {
    domain = domain.replace('ais-dev-', 'ais-pre-');
  }

  return domain.replace(/\/+$/, '');
}

/**
 * Gets or ensures an active shortCode for a product.
 * Returns product.shortCode, or extracts a short identifier from product.id, or generates a fresh one.
 */
export function getProductShortCode(product: Partial<Product> | null | undefined): string {
  if (!product) return generateShortCode();
  if (product.shortCode && product.shortCode.trim()) {
    return product.shortCode.trim().toLowerCase();
  }
  // If product.id is already a short token (e.g. prod-1234 or 8-char), return clean token
  if (product.id) {
    const cleanId = product.id.replace(/^prod[-_]/i, '').toLowerCase();
    if (cleanId.length >= 6 && cleanId.length <= 12 && /^[a-z0-9]+$/i.test(cleanId)) {
      return cleanId;
    }
  }
  return generateShortCode();
}

/**
 * Returns the short relative route path for a product (e.g., '/#/p/k7x9m2p1')
 */
export function getProductShortPath(product: { id: string; shortCode?: string; slug?: string }): string {
  const code = getProductShortCode(product);
  return `/#/p/${encodeURIComponent(code)}`;
}

/**
 * Returns the complete, canonical short URL for a product
 * (e.g., 'https://domain.com/#/p/k7x9m2p1')
 */
export function getProductShortUrl(
  product: { id: string; shortCode?: string; slug?: string },
  customDomain?: string
): string {
  const baseDomain = resolveCanonicalStoreDomain(customDomain);
  const code = getProductShortCode(product);
  return `${baseDomain}/#/p/${encodeURIComponent(code)}`;
}

/**
 * Matches a product from an array by shortCode, id, or slug (case-insensitive)
 */
export function findProductByIdentifier(
  products: Product[],
  identifier: string | null | undefined
): Product | undefined {
  if (!identifier) return undefined;
  const clean = decodeURIComponent(identifier).trim().toLowerCase();
  if (!clean) return undefined;

  return products.find(p => {
    if (p.shortCode && p.shortCode.toLowerCase() === clean) return true;
    if (p.id && p.id.toLowerCase() === clean) return true;
    if (p.slug && p.slug.toLowerCase() === clean) return true;
    // Also match stripped prefixes like prod-xyz vs xyz
    if (p.id && p.id.replace(/^prod[-_]/i, '').toLowerCase() === clean) return true;
    return false;
  });
}
