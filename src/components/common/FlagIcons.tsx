import React from 'react';

interface FlagProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const EthiopiaFlag: React.FC<FlagProps> = ({
  width = 24,
  height = 16,
  className = '',
  style
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flag-svg-icon ${className}`}
      style={{
        borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style
      }}
    >
      <clipPath id="et-flag-clip">
        <rect width="36" height="24" rx="3" />
      </clipPath>
      <g clipPath="url(#et-flag-clip)">
        {/* Top Green Stripe */}
        <rect width="36" height="8" fill="#009a44" />
        {/* Middle Yellow Stripe */}
        <rect y="8" width="36" height="8" fill="#fed100" />
        {/* Bottom Red Stripe */}
        <rect y="16" width="36" height="8" fill="#e1251b" />

        {/* Central Blue Disc */}
        <circle cx="18" cy="12" r="5.5" fill="#0033a0" />

        {/* Golden Emblem / 5-Point Star with Rays */}
        {/* Radiating Rays */}
        <line x1="18" y1="7.2" x2="18" y2="8.8" stroke="#fed100" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="22.5" y1="10.5" x2="21" y2="11" stroke="#fed100" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="20.8" y1="15.8" x2="19.8" y2="14.5" stroke="#fed100" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="15.2" y1="15.8" x2="16.2" y2="14.5" stroke="#fed100" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="13.5" y1="10.5" x2="15" y2="11" stroke="#fed100" strokeWidth="0.7" strokeLinecap="round" />

        {/* 5-Point Star */}
        <polygon
          points="18,8.2 19.3,11.5 22.8,11.5 20,13.5 21,16.8 18,14.8 15,16.8 16,13.5 13.2,11.5 16.7,11.5"
          fill="#fed100"
        />
      </g>
    </svg>
  );
};

export const UKFlag: React.FC<FlagProps> = ({
  width = 24,
  height = 16,
  className = '',
  style
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flag-svg-icon ${className}`}
      style={{
        borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style
      }}
    >
      <clipPath id="uk-flag-clip">
        <rect width="36" height="24" rx="3" />
      </clipPath>
      <g clipPath="url(#uk-flag-clip)">
        {/* Navy Blue Background */}
        <rect width="36" height="24" fill="#012169" />

        {/* White Saltire (Diagonals) */}
        <polygon points="0,0 4,0 36,20 36,24 32,24 0,4" fill="#ffffff" />
        <polygon points="36,0 32,0 0,20 0,24 4,24 36,4" fill="#ffffff" />

        {/* Red Saltire */}
        <polygon points="0,24 2,24 16,14 14,14" fill="#C8102E" />
        <polygon points="0,0 2,0 16,10 14,10" fill="#C8102E" transform="rotate(180 18 12)" />
        <polygon points="36,0 34,0 20,10 22,10" fill="#C8102E" />
        <polygon points="36,24 34,24 20,14 22,14" fill="#C8102E" transform="rotate(180 18 12)" />

        {/* Broad White St George Cross */}
        <rect x="14" y="0" width="8" height="24" fill="#ffffff" />
        <rect x="0" y="8" width="36" height="8" fill="#ffffff" />

        {/* Red St George Cross */}
        <rect x="15.5" y="0" width="5" height="24" fill="#C8102E" />
        <rect x="0" y="9.5" width="36" height="5" fill="#C8102E" />
      </g>
    </svg>
  );
};
