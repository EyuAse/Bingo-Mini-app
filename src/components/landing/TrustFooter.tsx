import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const TrustFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="landing-fresh-trust-bar">
      {/* 1. 100% Secure */}
      <div className="trust-pillar-item">
        <div className="pillar-icon-box gold">
          <svg viewBox="0 0 24 24" fill="none" className="trust-pillar-svg">
            <path
              d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z"
              fill="url(#shield-grad)"
              stroke="#ca8a04"
              strokeWidth="1.2"
            />
            <path
              d="M9 11.5L11 13.5L15 9.5"
              stroke="#854d0e"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="shield-grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="1" stopColor="#facc15" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="pillar-text-group">
          <strong className="pillar-title">{t('landing.secureTitle')}</strong>
          <span className="pillar-sub">{t('landing.secureSub')}</span>
        </div>
      </div>

      <div className="trust-pillar-sep"></div>

      {/* 2. Instant Payouts */}
      <div className="trust-pillar-item">
        <div className="pillar-icon-box gold">
          <svg viewBox="0 0 24 24" fill="none" className="trust-pillar-svg">
            <path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill="url(#bolt-grad)"
              stroke="#ca8a04"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="bolt-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="1" stopColor="#facc15" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="pillar-text-group">
          <strong className="pillar-title">{t('landing.payoutTitle')}</strong>
          <span className="pillar-sub">{t('landing.payoutSub')}</span>
        </div>
      </div>

      <div className="trust-pillar-sep"></div>

      {/* 3. 24/7 Support */}
      <div className="trust-pillar-item">
        <div className="pillar-icon-box gold">
          <svg viewBox="0 0 24 24" fill="none" className="trust-pillar-svg">
            <path
              d="M3 18V12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12V18"
              stroke="#ca8a04"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <rect x="2" y="12" width="4" height="7" rx="2" fill="url(#headset-grad)" stroke="#ca8a04" strokeWidth="1" />
            <rect x="18" y="12" width="4" height="7" rx="2" fill="url(#headset-grad)" stroke="#ca8a04" strokeWidth="1" />
            <path
              d="M20 19C20 20.1 19.1 21 18 21H14"
              stroke="#ca8a04"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="headset-grad" x1="2" y1="12" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="1" stopColor="#facc15" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="pillar-text-group">
          <strong className="pillar-title">{t('landing.supportTitle')}</strong>
          <span className="pillar-sub">{t('landing.supportSub')}</span>
        </div>
      </div>
    </footer>
  );
};
