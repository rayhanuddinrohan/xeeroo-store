/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DiscountInfo {
  hasDiscount: boolean;
  discountPercent: number;
  savingsAmount: number;
  sellingPrice: number;
  currentPrice: number;
}

/**
 * Automatically calculates discount percentage using formula:
 * Math.round(((Selling Price - Current Price) / Selling Price) * 100)
 * Only returns a discount if Current Price < Selling Price.
 */
export function calculateDiscount(
  sellingPrice?: number | null,
  currentPrice?: number | null
): DiscountInfo {
  const reg = Number(sellingPrice) || 0;
  const curr = Number(currentPrice) || 0;

  if (reg > 0 && curr > 0 && curr < reg) {
    const discountPercent = Math.round(((reg - curr) / reg) * 100);
    const savingsAmount = Math.max(0, reg - curr);

    return {
      hasDiscount: discountPercent > 0,
      discountPercent,
      savingsAmount,
      sellingPrice: reg,
      currentPrice: curr,
    };
  }

  return {
    hasDiscount: false,
    discountPercent: 0,
    savingsAmount: 0,
    sellingPrice: reg,
    currentPrice: curr,
  };
}
