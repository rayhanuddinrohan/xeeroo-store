/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_META_PIXEL_ID = '2578729145962620';

/**
 * Resolves the active Meta Pixel ID from Vite env or the default store Pixel ID.
 */
export const getMetaPixelId = () => {
  try {
    const envId =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_META_PIXEL_ID
        ? String(import.meta.env.VITE_META_PIXEL_ID).trim()
        : '';
    return envId || DEFAULT_META_PIXEL_ID;
  } catch {
    return DEFAULT_META_PIXEL_ID;
  }
};

/**
 * Safely checks whether Meta Pixel's global `fbq` function is available.
 * Prevents crashes when ad-blockers or strict privacy browsers block fbevents.js.
 */
export const isPixelAvailable = () => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.fbq !== 'undefined' &&
      typeof window.fbq === 'function'
    );
  } catch {
    return false;
  }
};

/**
 * Invokes `window.fbq` safely without ever throwing if blocked or unavailable.
 */
const safeFbq = (...args) => {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq !== 'undefined') {
      window.fbq(...args);
      return true;
    }
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Meta Pixel call skipped safely:', err);
    }
  }
  return false;
};

/**
 * Initializes Meta Pixel with the configured Pixel ID if not already initialized.
 */
export const initMetaPixel = (explicitPixelId) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const pixelId = String(explicitPixelId || getMetaPixelId()).trim();
  if (!pixelId) return false;

  try {
    if (typeof window.fbq === 'undefined') {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod
            ? n.callMethod.apply(n, arguments)
            : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        if (s && s.parentNode) {
          s.parentNode.insertBefore(t, s);
        } else if (b.head) {
          b.head.appendChild(t);
        }
      })(
        window,
        document,
        'script',
        'https://connect.facebook.net/en_US/fbevents.js'
      );
    }

    if (window.__xeerooPixelInitId !== pixelId) {
      safeFbq('init', pixelId);
      window.__xeerooPixelInitId = pixelId;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Tracks a Meta Pixel PageView event safely.
 */
export const trackPageView = () => {
  return safeFbq('track', 'PageView');
};

/**
 * Tracks Meta Pixel ViewContent when a customer opens a product details page.
 */
export const trackViewContent = (product) => {
  if (!product || !product.id) return false;
  const priceValue = Number(
    product.currentPrice !== undefined && product.currentPrice !== null
      ? product.currentPrice
      : product.price || 0
  );

  return safeFbq('track', 'ViewContent', {
    content_ids: [String(product.id)],
    content_name: String(product.title || product.name || 'Product'),
    content_type: 'product',
    value: Number.isFinite(priceValue) ? priceValue : 0,
    currency: 'BDT',
  });
};

/**
 * Tracks Meta Pixel AddToCart when an item is added to the cart.
 */
export const trackAddToCart = (product, quantity = 1) => {
  if (!product || !product.id) return false;
  const unitPrice = Number(
    product.currentPrice !== undefined && product.currentPrice !== null
      ? product.currentPrice
      : product.price || 0
  );
  const safeQty = Math.max(1, Number(quantity) || 1);
  const totalValue = Number.isFinite(unitPrice) ? unitPrice * safeQty : 0;

  return safeFbq('track', 'AddToCart', {
    content_ids: [String(product.id)],
    content_name: String(product.title || product.name || 'Product'),
    content_type: 'product',
    value: totalValue,
    currency: 'BDT',
  });
};

/**
 * Tracks Meta Pixel InitiateCheckout when opening the checkout form.
 */
export const trackInitiateCheckout = (totalAmount, contentIds = []) => {
  const numericValue = Number(totalAmount);
  const payload = {
    value: Number.isFinite(numericValue) ? numericValue : 0,
    currency: 'BDT',
  };

  if (Array.isArray(contentIds) && contentIds.length > 0) {
    payload.content_ids = contentIds.map(id => String(id));
    payload.content_type = 'product';
  }

  return safeFbq('track', 'InitiateCheckout', payload);
};

/**
 * Tracks Meta Pixel Purchase strictly upon successful Firebase order submission.
 */
export const trackPurchase = ({ value, contentIds = [], orderId } = {}) => {
  const numericValue = Number(value);
  const payload = {
    value: Number.isFinite(numericValue) ? numericValue : 0,
    currency: 'BDT',
    content_ids: Array.isArray(contentIds) ? contentIds.map(id => String(id)) : [],
    content_type: 'product',
  };

  if (orderId) {
    payload.order_id = String(orderId);
  }

  return safeFbq('track', 'Purchase', payload);
};
