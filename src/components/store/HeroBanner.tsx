/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BannerCarousel } from './BannerCarousel';

export const HeroBanner: React.FC = () => {
  // Mobile: completely turned off / hidden as explicitly requested ("movile veiw er jonno off koro")
  // Desktop: replaced with rotating banner carousel supporting up to 10 staff-added banners with auto switch
  return <BannerCarousel />;
};
