/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CURRENCY_SYMBOL = '৳';

/**
 * Format a number as Bangladeshi Taka (BDT) with symbol ৳
 * Example: 349 -> "৳349", 12500.5 -> "৳12,500.50"
 */
export const formatBDT = (amount: number, showDecimals: boolean = false): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '৳0';
  }
  
  if (showDecimals && amount % 1 !== 0) {
    return `৳${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  
  return `৳${Math.round(amount).toLocaleString('en-US')}`;
};
