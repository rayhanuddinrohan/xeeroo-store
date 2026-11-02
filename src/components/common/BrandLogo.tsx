/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { XEEROO_CONTACT } from '../../data/mockData';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  className?: string;
  customLogoUrl?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = false,
  textColor = 'text-gray-950',
  className = '',
  customLogoUrl,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Size dimensions
  const iconDimensions = {
    xs: 'w-5 h-5 rounded-md',
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
    xl: 'w-14 h-14 rounded-2xl',
  };

  const textDimensions = {
    xs: 'text-xs tracking-wider',
    sm: 'text-base tracking-widest',
    md: 'text-2xl tracking-widest',
    lg: 'text-3xl tracking-widest',
    xl: 'text-4xl tracking-widest',
  };

  const logoSource = customLogoUrl || XEEROO_CONTACT.logoUrl || '/xeeroo.jpg';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon / Logo Graphic */}
      <div
        className={`relative shrink-0 overflow-hidden flex items-center justify-center shadow-xs ${iconDimensions[size]}`}
      >
        {!imageFailed ? (
          <img
            src={logoSource}
            alt="XEEROO Logo"
            className="w-full h-full object-cover"
            onError={() => {
              // Try favicon.png fallback before falling back to SVG
              if (logoSource !== '/favicon.png') {
                const img = new Image();
                img.onload = () => {
                  setImageFailed(false);
                };
                img.onerror = () => {
                  setImageFailed(true);
                };
                img.src = '/favicon.png';
              } else {
                setImageFailed(true);
              }
            }}
          />
        ) : (
          /* High-fidelity Vector Yellow/Black XEEROO Logo Emblem matching xeeroo.jpg */
          <svg
            viewBox="0 0 64 64"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="64" height="64" rx="16" fill="#facc15" />
            {/* Stylized Black X matching the authentic XEEROO branding */}
            <path
              d="M17 17 L25 17 L47 47 L39 47 Z"
              fill="#09090b"
            />
            <path
              d="M39 17 L47 17 L17 47 L25 47 Z"
              fill="#09090b"
            />
          </svg>
        )}
      </div>

      {/* Brand Wordmark (Optional) */}
      {showText && (
        <span
          className={`font-black font-sans leading-none block select-none ${textDimensions[size]} ${textColor}`}
        >
          XEEROO
        </span>
      )}
    </div>
  );
};
