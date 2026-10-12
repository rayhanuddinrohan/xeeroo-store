/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, UserGender, UserRole } from '../../types';

interface UserAvatarProps {
  user?: Partial<User> | null;
  gender?: UserGender;
  role?: UserRole;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSignBadge?: boolean;
}

const sizeClasses: Record<string, { container: string; icon: string; badge: string; signText: string }> = {
  xs: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 text-[8px]', signText: 'text-[8px]' },
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5 text-[9px]', signText: 'text-[9px]' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', badge: 'w-4 h-4 -bottom-0.5 -right-0.5 text-[10px]', signText: 'text-[10px]' },
  lg: { container: 'w-14 h-14', icon: 'w-7 h-7', badge: 'w-5 h-5 -bottom-1 -right-1 text-xs', signText: 'text-xs' },
  xl: { container: 'w-20 h-20', icon: 'w-10 h-10', badge: 'w-6 h-6 -bottom-1 -right-1 text-sm', signText: 'text-sm' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  gender: propGender,
  role: propRole,
  size = 'md',
  className = '',
  showSignBadge = true,
}) => {
  const activeGender = propGender || user?.gender || 'male';
  const activeRole = propRole || user?.role || 'customer';
  const customAvatar = user?.avatarUrl && !user.avatarUrl.includes('unsplash.com') ? user.avatarUrl : null;
  const { container, icon, badge, signText } = sizeClasses[size] || sizeClasses.md;

  // Ring color depending on role
  const roleRing =
    activeRole === 'admin'
      ? 'ring-purple-500'
      : activeRole === 'moderator'
      ? 'ring-amber-500'
      : 'ring-blue-500';

  // Palette based on gender
  const isFemale = activeGender === 'female';
  const isMale = activeGender === 'male';

  const bgGradient = isFemale
    ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-pink-500/20'
    : isMale
    ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/20'
    : 'bg-gradient-to-tr from-slate-600 to-slate-500 text-white shadow-slate-500/20';

  const badgeBg = isFemale
    ? 'bg-pink-600 text-white border-white ring-1 ring-pink-300'
    : isMale
    ? 'bg-blue-600 text-white border-white ring-1 ring-blue-300'
    : 'bg-slate-700 text-white border-white ring-1 ring-slate-400';

  const genderSignSymbol = isFemale ? '♀' : isMale ? '♂' : '👤';

  return (
    <div className={`relative inline-flex shrink-0 select-none ${container} ${className}`}>
      {customAvatar ? (
        <img
          src={customAvatar}
          alt={user?.fullName || 'User'}
          className={`w-full h-full rounded-full object-cover ring-2 ${roleRing}`}
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-bold shadow-xs ring-2 ${roleRing} ${bgGradient}`}
          title={`${user?.fullName || 'User'} (${activeGender === 'female' ? 'Female ♀' : activeGender === 'male' ? 'Male ♂' : 'Other'})`}
        >
          {/* Gender-specific Avatar Vector SVG */}
          {isFemale ? (
            <svg
              className={`${icon} fill-current`}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Female Silhouette */}
              <circle cx="12" cy="7" r="4" />
              <path d="M12 13c-3.87 0-7 2.13-7 4.75V20h14v-2.25c0-2.62-3.13-4.75-7-4.75z" />
            </svg>
          ) : isMale ? (
            <svg
              className={`${icon} fill-current`}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Male Silhouette */}
              <circle cx="12" cy="7" r="4" />
              <path d="M12 13c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5z" />
            </svg>
          ) : (
            <svg
              className={`${icon} fill-current`}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="7" r="4" />
              <path d="M12 13c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5z" />
            </svg>
          )}
        </div>
      )}

      {/* Gender Sign Badge Overlay (♂ Male / ♀ Female) */}
      {showSignBadge && (
        <span
          className={`absolute flex items-center justify-center rounded-full font-black border-2 leading-none shadow-xs transition-transform ${badge} ${badgeBg}`}
          title={isFemale ? 'Female ♀' : isMale ? 'Male ♂' : 'User'}
        >
          <span className={`${signText} font-serif leading-none select-none`}>
            {genderSignSymbol}
          </span>
        </span>
      )}
    </div>
  );
};
