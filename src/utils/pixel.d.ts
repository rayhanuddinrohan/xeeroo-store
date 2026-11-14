/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export declare const DEFAULT_META_PIXEL_ID: string;

export interface PixelProductLike {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  currentPrice?: number;
}

export interface PurchaseEventPayload {
  value: number;
  contentIds: string[];
  orderId?: string;
}

export declare function getMetaPixelId(): string;
export declare function isPixelAvailable(): boolean;
export declare function initMetaPixel(explicitPixelId?: string): boolean;
export declare function trackPageView(): boolean;
export declare function trackViewContent(product: PixelProductLike): boolean;
export declare function trackAddToCart(product: PixelProductLike, quantity?: number): boolean;
export declare function trackInitiateCheckout(totalAmount: number, contentIds?: string[]): boolean;
export declare function trackPurchase(payload: PurchaseEventPayload): boolean;
