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
 * Deterministically derives a valid 15 to 20-digit alphanumeric ID from any seed string (e.g. product.id).
 * Ensures that even if a product document doesn't have a stored shortCode yet, its generated ID
 * remains 100% consistent across renders, refreshes, and browsers instead of changing randomly.
 */
export function deriveDeterministicAlphanumericId(seed: string, length: number = 18): string {
  const targetLen = Math.max(15, Math.min(20, Math.floor(length)));
  const charsetLen = ALPHANUMERIC_CHARSET.length;
  const cleanSeed = (seed || 'xeeroo-default-product').trim();

  // Dual 32-bit hashes for strong distribution across the 18 characters
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < cleanSeed.length; i++) {
    const ch = cleanSeed.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b);
  }

  const chars: string[] = [];
  let state = (h1 ^ h2) >>> 0;
  for (let i = 0; i < targetLen; i++) {
    state = (Math.imul(state ^ (i + 1), 1664525) + 1013904223) >>> 0;
    const mixed = (state ^ ((h1 >>> (i % 16)) + Math.imul(i + 7, 2654435761))) >>> 0;
    chars.push(ALPHANUMERIC_CHARSET[mixed % charsetLen]);
  }

  // Guarantee at least one digit, one uppercase letter, and one lowercase letter deterministically
  let result = chars.join('');
  if (!/[0-9]/.test(result)) {
    chars[targetLen - 3] = '0123456789'[(state >>> 2) % 10];
    result = chars.join('');
  }
  if (!/[A-Z]/.test(result)) {
    chars[targetLen - 2] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(state >>> 5) % 26];
    result = chars.join('');
  }
  if (!/[a-z]/.test(result)) {
    chars[targetLen - 1] = 'abcdefghijklmnopqrstuvwxyz'[(state >>> 8) % 26];
    result = chars.join('');
  }

  return result;
}

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
 * Gets or guarantees a stable 15-20 digit alphanumeric ID for a product.
 * If product already has a valid 15-20 digit alphanumeric ID, preserves it.
 * Otherwise, derives a deterministic 18-digit alphanumeric ID from product.id / slug
 * so the product URL never changes unexpectedly across renders or refreshes.
 */
export function getProductShortCode(product: Partial<Product> | null | undefined): string {
  if (!product) return deriveDeterministicAlphanumericId('xeeroo-product', 18);

  const existing = (product.shortCode || (product as any).alphanumericId || '').trim();
  if (existing && isAlphanumericProductId(existing)) {
    return existing;
  }

  // Check if product.id is already a valid 15-20 char alphanumeric token
  if (product.id && isAlphanumericProductId(product.id)) {
    return product.id.trim();
  }

  const seed = product.id || product.slug || product.title || 'xeeroo-product';
  return deriveDeterministicAlphanumericId(seed, 18);
}

/**
 * Returns the short hash route path for a product (e.g., '/#/p/aB9xK1mQ8zL4pW7rT2')
 * Hash routing guarantees F5 browser refreshes never hit a 404 on static/Cloud Run hosting.
 */
export function getProductShortPath(product: { id: string; shortCode?: string; slug?: string }): string {
  const code = getProductShortCode(product);
  return `/#/p/${encodeURIComponent(code)}`;
}

/**
 * Returns the complete, canonical short URL for a product
 * (e.g., 'https://yourdomain.com/#/p/aB9xK1mQ8zL4pW7rT2')
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
 * Matches a product from an array by its unique 15-20 alphanumeric ID, derived shortCode, id, or legacy slug
 */
export function findProductByIdentifier(
  products: Product[],
  identifier: string | null | undefined
): Product | undefined {
  if (!identifier) return undefined;
  let decoded = identifier;
  try {
    decoded = decodeURIComponent(identifier);
  } catch {
    decoded = identifier;
  }
  const raw = decoded.trim();
  if (!raw) return undefined;
  const cleanLower = raw.toLowerCase();

  return (
    // Pass 1: Exact case match on stored shortCode or product.id
    products.find(
      p =>
        (p.shortCode && p.shortCode.trim() === raw) ||
        (p.id && p.id.trim() === raw)
    ) ||
    // Pass 2: Computed shortCode or case-insensitive / legacy slug / stripped prefix match
    products.find(p => {
      const computedCode = getProductShortCode(p);
      if (computedCode === raw || computedCode.toLowerCase() === cleanLower) return true;
      if (p.shortCode && p.shortCode.toLowerCase() === cleanLower) return true;
      if (p.id && p.id.toLowerCase() === cleanLower) return true;
      if (p.slug && p.slug.toLowerCase() === cleanLower) return true;
      if (p.id && p.id.replace(/^prod[-_]/i, '').toLowerCase() === cleanLower) return true;
      return false;
    })
  );
}
