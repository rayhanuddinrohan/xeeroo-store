/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dhaka outskirts / sub-urban thanas where delivery charge is 130 TK
 */
export const DHAKA_SUBURBAN_THANAS = [
  'savar',
  'dhamrai',
  'dohar',
  'keraniganj',
  'nawabganj',
];

export interface ShippingZoneInfo {
  charge: number;
  label: string;
  zone: 'inside_dhaka' | 'suburban_dhaka' | 'outside_dhaka';
  description: string;
}

/**
 * Calculate dynamic shipping charge based on customer location:
 * - City inside Dhaka: 80 TK
 * - Sub-urban Dhaka (Savar, Dhamrai, Dohar, Keraniganj, Nawabganj): 130 TK
 * - Outside Dhaka (all other districts): 130 TK
 */
export const getShippingZoneInfo = (
  district?: string,
  thana?: string
): ShippingZoneInfo => {
  if (!district || !district.trim()) {
    // Default inside Dhaka city
    return {
      charge: 80,
      label: 'Inside Dhaka City',
      zone: 'inside_dhaka',
      description: 'Standard City Delivery (80 ৳)',
    };
  }

  const cleanDist = district.trim().toLowerCase();
  const cleanThana = (thana || '').trim().toLowerCase();

  if (cleanDist === 'dhaka') {
    const isSuburban = DHAKA_SUBURBAN_THANAS.some((sub) =>
      cleanThana.includes(sub)
    );
    if (isSuburban) {
      return {
        charge: 130,
        label: 'Sub-urban Dhaka',
        zone: 'suburban_dhaka',
        description: 'Dhaka Sub-urban Area (130 ৳)',
      };
    }
    return {
      charge: 80,
      label: 'Inside Dhaka City',
      zone: 'inside_dhaka',
      description: 'Dhaka Metropolitan City Area (80 ৳)',
    };
  }

  return {
    charge: 130,
    label: 'Outside Dhaka',
    zone: 'outside_dhaka',
    description: 'National Courier Delivery (130 ৳)',
  };
};

export const calculateShippingCharge = (
  district?: string,
  thana?: string
): number => {
  return getShippingZoneInfo(district, thana).charge;
};

/**
 * Validates Bangladeshi 11-digit mobile phone numbers.
 * Valid operator prefixes: 013, 014, 015, 016, 017, 018, 019
 * Format: 11 digits starting with 01[3-9]
 */
export const isValidBDPhone = (phone: string): boolean => {
  if (!phone) return false;
  const digits = phone.replace(/[\s\-\+]/g, '').replace(/^88/, '');
  return /^01[3-9]\d{8}$/.test(digits);
};

/**
 * Normalizes a Bangladeshi phone number to standard 11 digits: 01XXXXXXXXX
 */
export const normalizeBDPhone = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/[\s\-\+]/g, '').replace(/^88/, '');
  return digits;
};
