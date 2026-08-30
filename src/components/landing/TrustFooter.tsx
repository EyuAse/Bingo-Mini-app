import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const TrustFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="landing-fresh-trust-bar">
      <div className="trust-pillar-item">
        <div className="pillar-icon-box gold">
          <i className="fa-solid fa-shield-halved"></i>
        </div>
        <div className="pillar-text-group">
          <strong className="pillar-title">{t('landing.secureTitle')}</strong>
          <span className="pillar-sub">{t('landing.secureSub')}</span>
        </div>
      </div>

      <div className="trust-pillar-sep"></div>

      <div className="trust-pillar-item">
        <div className="pillar-icon-box gold">
          <i className="fa-solid fa-bolt"></i>
        </div>
        <div className="pillar-text-group">
          <strong className="pillar-title">{t('landing.payoutTitle')}</strong>
          <span className="pillar-sub">{t('landing.payoutSub')}</span>
        </div>
      </div>

      <div className="trust-pillar-sep"></div>

      <div className="trust-pillar-item">
        <div className="pillar-icon-box gold">
          <i className="fa-solid fa-headset"></i>
        </div>
        <div className="pillar-text-group">
          <strong className="pillar-title">{t('landing.supportTitle')}</strong>
          <span className="pillar-sub">{t('landing.supportSub')}</span>
        </div>
      </div>
    </footer>
  );
};
