import React from 'react';

export const TelebirrLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <img
    src="/images/telebirr_logo.png"
    alt="Telebirr"
    style={{ height: `${size}px`, width: 'auto', objectFit: 'contain', display: 'block' }}
    className={className}
    onError={(e) => {
      // Fallback SVG if image fails
      const target = e.currentTarget;
      target.style.display = 'none';
    }}
  />
);

export const CBELogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <img
    src="/images/cbe_logo.png"
    alt="Commercial Bank of Ethiopia"
    style={{ height: `${size}px`, width: 'auto', objectFit: 'contain', display: 'block' }}
    className={className}
    onError={(e) => {
      const target = e.currentTarget;
      target.style.display = 'none';
    }}
  />
);
