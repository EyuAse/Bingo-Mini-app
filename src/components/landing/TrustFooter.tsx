import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const TrustFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="trust-footer-bar">
      <div className="trust-item">
        <div className="trust-icon-circle icon-shield">
          <i className="fa-solid fa-shield-halved"></i>
        </div>
        <div className="trust-text">
          <span className="trust-title">{t('landing.fairCertified')}</span>
        </div>
      </div>

      <div className="trust-item">
        <div className="trust-icon-circle icon-support">
          <i className="fa-solid fa-bolt"></i>
        </div>
        <div className="trust-text">
          <span className="trust-title">{t('landing.instantTelebirr')}</span>
        </div>
      </div>

      <div className="trust-item">
        <div className="trust-icon-circle icon-offers">
          <i className="fa-solid fa-users"></i>
        </div>
        <div className="trust-text">
          <span className="trust-title">{t('landing.live247')}</span>
        </div>
      </div>
    </footer>
  );
};
