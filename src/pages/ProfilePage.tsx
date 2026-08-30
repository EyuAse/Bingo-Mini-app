import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ProfileHeader } from '../components/wallet/ProfileHeader.tsx';

export const ProfilePage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { lang, toggleLang, t } = useLanguage();

  // Stateful Theme Toggle (Light / Dark)
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');

  const handleLogout = () => {
    showToast('👋 You have been logged out.');
    switchPage('landing');
  };

  return (
    <div className="page active page-profile-fresh" id="page-profile">
      {/* 1. User Profile Banner Card (Image 1) */}
      <ProfileHeader onEditClick={() => switchPage('account-info')} />

      <div className="profile-settings-content-scroll">
        {/* ============================================================
            CATEGORY 1: GENERAL SETTINGS
            ============================================================ */}
        <div className="profile-category-group">
          <span className="category-section-title">{t('profile.generalSettings')}</span>

          <div className="profile-settings-card">
            {/* Account Information */}
            <div
              className="settings-row-item"
              onClick={() => switchPage('account-info')}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-regular fa-user"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">{t('profile.accountInfo')}</strong>
                <span className="settings-row-sub">{t('profile.accountInfoSub')}</span>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron"></i>
            </div>
          </div>
        </div>

        {/* ============================================================
            CATEGORY 2: PREFERENCES
            ============================================================ */}
        <div className="profile-category-group">
          <span className="category-section-title">{t('profile.preferences')}</span>

          <div className="profile-settings-card">
            {/* Language */}
            <div className="settings-row-item" onClick={toggleLang}>
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-globe"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">{t('profile.language')}</strong>
                <span className="settings-row-sub">
                  {lang === 'am' ? 'የመተግበሪያውን ቋንቋ ይቀይሩ' : 'Choose your preferred language'}
                </span>
              </div>
              <div className="settings-lang-pill-wrap">
                <span className="lang-preview-pill">
                  <span className="pill-flag">{lang === 'am' ? '🇪🇹' : '🇬🇧'}</span>
                  <span>{lang === 'am' ? 'አማርኛ' : 'English'}</span>
                </span>
                <i className="fa-solid fa-chevron-right settings-chevron"></i>
              </div>
            </div>

            {/* Theme */}
            <div className="settings-row-item">
              <div className="settings-row-icon-circ">
                <i className="fa-regular fa-moon"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">{t('profile.theme')}</strong>
                <span className="settings-row-sub">
                  {lang === 'am' ? 'የመተግበሪያውን ገጽታ ይምረጡ' : 'Choose your app appearance'}
                </span>
              </div>
              <div className="theme-segmented-pill">
                <button
                  type="button"
                  className={`theme-segment-btn ${selectedTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setSelectedTheme('light')}
                >
                  {t('profile.light')}
                </button>
                <button
                  type="button"
                  className={`theme-segment-btn ${selectedTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTheme('dark');
                    showToast('🌙 Dark mode is coming soon!');
                  }}
                >
                  {t('profile.dark')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            CATEGORY 3: SUPPORT & ABOUT
            ============================================================ */}
        <div className="profile-category-group">
          <span className="category-section-title">{t('profile.supportAbout')}</span>

          <div className="profile-settings-card">
            {/* Help Center */}
            <div
              className="settings-row-item"
              onClick={() => switchPage('help')}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-headset"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">{t('profile.helpCenter')}</strong>
                <span className="settings-row-sub">{t('profile.helpCenterSub')}</span>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron"></i>
            </div>

            {/* About Lomii Bingo */}
            <div
              className="settings-row-item"
              onClick={() => switchPage('about')}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-circle-info"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">{t('profile.aboutLomi')}</strong>
                <span className="settings-row-sub">{t('profile.aboutLomiSub')}</span>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron"></i>
            </div>

            {/* Logout */}
            <div
              className="settings-row-item logout-row"
              onClick={handleLogout}
            >
              <div className="settings-row-icon-circ red-logout">
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title logout-txt">{t('profile.logout')}</strong>
                <span className="settings-row-sub">{t('profile.logoutSub')}</span>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
