import React from 'react';

export const TelebirrLogo: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="48" height="48" rx="12" fill="#0284C7" />
    <path
      d="M14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24C34 29.5228 29.5228 34 24 34"
      stroke="#38BDF8"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M20 24C20 21.7909 21.7909 20 24 20C26.2091 20 28 21.7909 28 24C28 26.2091 26.2091 28 24 28"
      stroke="#FACC15"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />
    <path
      d="M24 34V37M21 37H27"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const CBELogo: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="48" height="48" rx="12" fill="#4C1D95" />
    <circle cx="24" cy="24" r="16" stroke="#FACC15" strokeWidth="2.5" />
    <path
      d="M16 28L24 16L32 28H16Z"
      fill="#FACC15"
    />
    <path
      d="M21 28L24 22L27 28H21Z"
      fill="#4C1D95"
    />
    <circle cx="24" cy="19" r="1.5" fill="#4C1D95" />
  </svg>
);
