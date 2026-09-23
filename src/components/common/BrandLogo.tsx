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
    xs: 'w-4 h-4 rounded-md',
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl',
  };

  const textDimensions = {
    xs: 'text-xs tracking-wider',
    sm: 'text-base tracking-widest',
    md: 'text-2xl tracking-widest',
    lg: 'text-3xl tracking-widest',
    xl: 'text-4xl tracking-widest',
  };

  const logoSource = customLogoUrl || XEEROO_CONTACT.logoUrl;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon / Logo Graphic */}
      <div
        className={`relative shrink-0 overflow-hidden flex items-center justify-center bg-slate-950 shadow-sm border border-slate-800 ${iconDimensions[size]}`}
      >
        {logoSource && !imageFailed ? (
          <img
            src={logoSource}
            alt="XEEROO Official Logo"
            className="w-full h-full object-contain p-1"
            onError={() => setImageFailed(true)}
          />
        ) : (
          /* High-fidelity Vector XEEROO Logo Emblem */
          <svg
            viewBox="0 0 64 64"
            className="w-full h-full p-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`grad1-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id={`grad2-${size}`} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="60%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>
            </defs>
            <path
              d="M13 14 L21 14 L51 50 L43 50 Z"
              fill={`url(#grad1-${size})`}
            />
            <path
              d="M43 14 L51 14 L37 30 L30 23 Z"
              fill={`url(#grad2-${size})`}
            />
            <path
              d="M27 37 L34 44 L21 50 L13 50 Z"
              fill={`url(#grad2-${size})`}
            />
            <polygon
              points="32,27 37,32 32,37 27,32"
              fill="#e0f2fe"
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
