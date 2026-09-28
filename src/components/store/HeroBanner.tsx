/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BannerCarousel } from './BannerCarousel';

export const HeroBanner: React.FC = () => {
  return (
    <div className="hidden md:block">
      <BannerCarousel />
    </div>
  );
};

