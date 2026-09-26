/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface WhatsAppIconProps {
  className?: string;
  size?: number;
}

export const WhatsAppIcon: React.FC<WhatsAppIconProps> = ({ className = 'w-5 h-5', size }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <img
        src="/whatsapp.png"
        alt="WhatsApp"
        className={`inline-block shrink-0 object-contain ${className}`}
        style={size ? { width: size, height: size } : undefined}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // High-fidelity fallback SVG
  return (
    <svg
      viewBox="0 0 32 32"
      width={size || undefined}
      height={size || undefined}
      className={`inline-block shrink-0 ${className}`}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 2C8.268 2 2 8.268 2 16c0 2.68.75 5.188 2.062 7.322L2.148 29.13a.8.8 0 0 0 .972.972l5.808-1.914A13.926 13.926 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2Zm-1.442 7.02c.36-.8.72-.81 1.05-.83.27-.01.58-.01.88-.01.3 0 .8.11 1.22 1.02.43.93 1.3 3.16 1.41 3.39.12.23.2.51.04.82-.16.31-.24.51-.48.79-.24.28-.5.63-.72.84-.24.24-.49.5-.21.98.28.48 1.24 2.04 2.67 3.3 1.83 1.63 3.37 2.13 3.85 2.37.48.24.76.2 1.04-.12.28-.32 1.2-1.4 1.52-1.88.32-.48.64-.4 1.08-.24.44.16 2.8 1.33 3.28 1.57.48.24.8.36.92.56.12.2.12 1.16-.28 2.28-.4 1.12-2.32 2.2-3.2 2.28-.88.08-2 .12-6.48-1.64-5.4-2.12-8.85-7.61-9.12-7.97-.27-.36-2.2-2.93-2.2-5.59 0-2.66 1.4-3.97 1.9-4.52Z"
      />
    </svg>
  );
};
