/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

/**
 * Full alphanumeric character set (digits 0-9, uppercase A-Z, lowercase a-z).
 * Total 62 characters providing maximum collision resistance and concise URLs.
 */
const ALPHANUMERIC_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generates a random 15 to 20-digit alphanumeric string (mix of uppercase, lowercase letters, and numbers)
 * Example: 'aB9xK1mQ8zL4pW7rT2v'
 */
export function generateAlphanumericId(length: number = 18): string {
  const targetLen = Math.max(15, Math.min(20, Math.floor(length)));
  const charsetLen = ALPHANUMERIC_CHARSET.length;
  let result = '';

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(targetLen);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < targetLen; i++) {
      result += ALPHANUMERIC_CHARSET[bytes[i] % charsetLen];
    }
  } else {
    for (let i = 0; i < targetLen; i++) {
      result += ALPHANUMERIC_CHARSET[Math.floor(Math.random() * charsetLen)];
    }
  }

  // Ensure true mix of uppercase letters, lowercase letters, and numbers
  const hasUpper = /[A-Z]/.test(result);
  const hasLower = /[a-z]/.test(result);
  const hasDigit = /[0-9]/.test(result);

  if (!hasUpper || !hasLower || !hasDigit) {
    return generateAlphanumericId(targetLen);
  }

  return result;
}

// Alias for backward compatibility
export const generateShortCode = generateAlphanumericId;

/**
 * Validates if a string is a 15 to 20-digit alphanumeric ID
 */
export function isAlphanumericProductId(val?: string | null): boolean {
  if (!val) return false;
  const clean = val.trim();
  return /^[a-zA-Z0-9]{15,20}$/.test(clean);
}

/**
 * Resolves a canonical, publicly accessible store domain.
 * Converts internal dev domain (ais-dev-) to public preview domain (ais-pre-)
 * so that shared short URLs work for external visitors, social media crawlers, and Facebook.
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
 * Gets or guarantees an active 15-20 digit alphanumeric ID for a product.
 * If product already has a valid 15-20 digit alphanumeric ID, preserves it.
 * Otherwise, generates a new 15-20 digit alphanumeric ID.
 */
export function getProductShortCode(product: Partial<Product> | null | undefined): string {
  if (!product) return generateAlphanumericId(18);

  const existing = (product.shortCode || (product as any).alphanumericId || '').trim();
  if (existing && isAlphanumericProductId(existing)) {
    return existing;
  }

  // Check if product.id is already a valid 15-20 char alphanumeric token
  if (product.id && isAlphanumericProductId(product.id)) {
    return product.id.trim();
  }

  return generateAlphanumericId(18);
}

/**
 * Returns the short relative route path for a product (e.g., '/p/aB9xK1mQ8zL4pW7rT2v')
 * Long title slugs are completely omitted from product routing.
 */
export function getProductShortPath(product: { id: string; shortCode?: string; slug?: string }): string {
  const code = getProductShortCode(product);
  return `/p/${encodeURIComponent(code)}`;
}

/**
 * Returns the complete, canonical short URL for a product
 * (e.g., 'https://yourdomain.com/p/aB9xK1mQ8zL4pW7rT2v')
 */
export function getProductShortUrl(
  product: { id: string; shortCode?: string; slug?: string },
  customDomain?: string
): string {
  const baseDomain = resolveCanonicalStoreDomain(customDomain);
  const code = getProductShortCode(product);
  return `${baseDomain}/p/${encodeURIComponent(code)}`;
}

/**
 * Matches a product from an array by its unique 15-20 alphanumeric ID, id, or legacy slug
 */
export function findProductByIdentifier(
  products: Product[],
  identifier: string | null | undefined
): Product | undefined {
  if (!identifier) return undefined;
  const raw = decodeURIComponent(identifier).trim();
  if (!raw) return undefined;
  const cleanLower = raw.toLowerCase();

  return products.find(p => {
    // 1. Direct match on alphanumeric shortCode (exact case first, then case-insensitive)
    if (p.shortCode && (p.shortCode === raw || p.shortCode.toLowerCase() === cleanLower)) return true;
    // 2. Direct match on product.id
    if (p.id && (p.id === raw || p.id.toLowerCase() === cleanLower)) return true;
    // 3. Fallback match for legacy slug (to avoid breaking old bookmarks)
    if (p.slug && p.slug.toLowerCase() === cleanLower) return true;
    // 4. Fallback match for stripped prefix (prod-xyz)
    if (p.id && p.id.replace(/^prod[-_]/i, '').toLowerCase() === cleanLower) return true;
    return false;
  });
}
