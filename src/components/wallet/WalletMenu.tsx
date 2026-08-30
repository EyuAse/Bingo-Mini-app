import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const WalletMenu: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { t } = useLanguage();

  return (
    <>
      <div className="menu-section">
        <div className="menu-grid">
          {/* Leaderboard */}
          <div
            className="menu-item"
            id="menu-leaderboard"
            onClick={() => switchPage('leader')}
          >
            <div className="menu-item-icon">
              <i className="fa-solid fa-chart-simple"></i>
            </div>
            <span className="menu-item-text">{t('nav.leaderboard')}</span>
            <i className="fa-solid fa-chevron-right menu-item-arrow"></i>
          </div>

          {/* More Gifts */}
          <div
            className="menu-item more-gifts"
            id="menu-gifts"
            onClick={() => showToast('🎁 Free spins and bonuses credited daily!')}
          >
            <i className="fa-solid fa-gift gifts-icon"></i>
            <span className="gifts-text">{t('nav.bonus')}</span>
          </div>

          {/* Affiliate */}
          <div
            className="menu-item"
            id="menu-affiliate"
            onClick={() => showToast('👥 Invite friends and earn up to 500 ETB!')}
          >
            <div className="menu-item-icon">
              <i className="fa-solid fa-people-group"></i>
            </div>
            <span className="menu-item-text">Affiliate</span>
            <i className="fa-solid fa-chevron-right menu-item-arrow"></i>
          </div>

          {/* Promotion */}
          <div
            className="menu-item"
            id="menu-promotion"
            onClick={() => showToast('🔥 200% Bonus promotion is active on your next deposit!')}
          >
            <div className="menu-item-icon">
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <span className="menu-item-text">Promotion</span>
            <i className="fa-solid fa-chevron-right menu-item-arrow"></i>
          </div>
        </div>
      </div>

      {/* Profile Row */}
      <div className="profile-row" id="profile-row" onClick={() => switchPage('profile')}>
        <i className="fa-regular fa-user profile-row-icon"></i>
        <span className="profile-row-text">{t('nav.profile')}</span>
        <i className="fa-solid fa-chevron-right profile-row-arrow"></i>
      </div>

      {/* Support Row */}
      <div
        className="support-row"
        id="support-row"
        onClick={() => showToast('🎧 Support team is available 24/7 via live chat!')}
      >
        <i className="fa-solid fa-headset support-row-icon"></i>
        <span className="support-row-text">{t('profile.support')}</span>
        <i className="fa-solid fa-chevron-right support-row-arrow"></i>
      </div>
    </>
  );
};
