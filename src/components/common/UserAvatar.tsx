/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, UserGender } from '../../types';

interface UserAvatarProps {
  user?: Partial<User> | null;
  gender?: UserGender;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSignBadge?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const badgeSizeClasses = {
  xs: 'w-2.5 h-2.5 text-[8px] -bottom-0.5 -right-0.5',
  sm: 'w-3.5 h-3.5 text-[9px] -bottom-0.5 -right-0.5',
  md: 'w-4 h-4 text-[10px] -bottom-0.5 -right-0.5',
  lg: 'w-5 h-5 text-xs -bottom-1 -right-1',
  xl: 'w-6 h-6 text-sm -bottom-1 -right-1',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  gender: propGender,
  size = 'md',
  className = '',
  showSignBadge = true,
}) => {
  const gender: UserGender | undefined = propGender || user?.gender;
  const fullName = user?.fullName || 'User';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  // If female
  if (gender === 'female') {
    return (
      <div className={`relative shrink-0 inline-flex select-none ${className}`}>
        <div
          className={`${sizeClasses[size]} rounded-full bg-linear-to-tr from-pink-500 via-rose-500 to-purple-500 text-white font-bold flex items-center justify-center shadow-xs ring-2 ring-pink-100 overflow-hidden`}
          title={`${fullName} (Female)`}
        >
          {/* Female Silhouette / Styling */}
          <svg
            className="w-[65%] h-[65%] text-white drop-shadow-xs"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Woman head with hair curve */}
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21c0-4 3-7 6.5-7s6.5 3 6.5 7" />
            <path d="M8 8c0 3 1.8 4 4 4s4-1 4-4" />
          </svg>
        </div>

        {showSignBadge && (
          <span
            className={`absolute ${badgeSizeClasses[size]} rounded-full bg-pink-600 text-white font-black flex items-center justify-center border-2 border-white shadow-xs`}
            title="Female (মহিলা)"
          >
            ♀
          </span>
        )}
      </div>
    );
  }

  // If male
  if (gender === 'male') {
    return (
      <div className={`relative shrink-0 inline-flex select-none ${className}`}>
        <div
          className={`${sizeClasses[size]} rounded-full bg-linear-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-bold flex items-center justify-center shadow-xs ring-2 ring-blue-100 overflow-hidden`}
          title={`${fullName} (Male)`}
        >
          {/* Male Silhouette / Styling */}
          <svg
            className="w-[65%] h-[65%] text-white drop-shadow-xs"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Man head with neat hairline */}
            <circle cx="12" cy="7" r="4" />
            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          </svg>
        </div>

        {showSignBadge && (
          <span
            className={`absolute ${badgeSizeClasses[size]} rounded-full bg-blue-600 text-white font-black flex items-center justify-center border-2 border-white shadow-xs`}
            title="Male (পুরুষ)"
          >
            ♂
          </span>
        )}
      </div>
    );
  }

  // Neutral / Not specified yet
  return (
    <div className={`relative shrink-0 inline-flex select-none ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full bg-linear-to-tr from-slate-700 via-slate-800 to-slate-900 text-white font-bold flex items-center justify-center shadow-xs ring-2 ring-slate-100 overflow-hidden`}
        title={fullName}
      >
        <span className="font-mono tracking-wider">{initials}</span>
      </div>
    </div>
  );
};
