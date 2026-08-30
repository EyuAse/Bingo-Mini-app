import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ProfileHeader } from '../components/wallet/ProfileHeader.tsx';
import { AccountInfoModal } from '../components/profile/AccountInfoModal.tsx';
import { HelpCenterModal } from '../components/profile/HelpCenterModal.tsx';
import { AboutLomiModal } from '../components/profile/AboutLomiModal.tsx';

export const ProfilePage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { lang, toggleLang } = useLanguage();

  // Stateful Theme Toggle (Light / Dark)
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');

  // Modal Visibility States
  const [isAccountInfoOpen, setIsAccountInfoOpen] = useState<boolean>(false);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState<boolean>(false);
  const [isAboutLomiOpen, setIsAboutLomiOpen] = useState<boolean>(false);

  const handleLogout = () => {
    showToast('👋 You have been logged out.');
    switchPage('landing');
  };

  return (
    <div className="page active page-profile-fresh" id="page-profile">
      {/* 1. User Profile Banner Card (Image 1) */}
      <ProfileHeader onEditClick={() => setIsAccountInfoOpen(true)} />

      <div className="profile-settings-content-scroll">
        {/* ============================================================
            CATEGORY 1: GENERAL SETTINGS
            ============================================================ */}
        <div className="profile-category-group">
          <span className="category-section-title">GENERAL SETTINGS</span>

          <div className="profile-settings-card">
            {/* Account Information */}
            <div
              className="settings-row-item"
              onClick={() => setIsAccountInfoOpen(true)}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-regular fa-user"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Account Information</strong>
                <span className="settings-row-sub">Identity, attached payout accounts & KYC</span>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron"></i>
            </div>
          </div>
        </div>

        {/* ============================================================
            CATEGORY 2: PREFERENCES
            ============================================================ */}
        <div className="profile-category-group">
          <span className="category-section-title">PREFERENCES</span>

          <div className="profile-settings-card">
            {/* Language */}
            <div className="settings-row-item" onClick={toggleLang}>
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-globe"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Language</strong>
                <span className="settings-row-sub">Choose your preferred language</span>
              </div>
              <div className="settings-lang-pill-wrap">
                <span className="lang-preview-pill">
                  <span className="pill-flag">🇪🇹</span>
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
                <strong className="settings-row-title">Theme</strong>
                <span className="settings-row-sub">Choose your app appearance</span>
              </div>
              <div className="theme-segmented-pill">
                <button
                  type="button"
                  className={`theme-segment-btn ${selectedTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setSelectedTheme('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`theme-segment-btn ${selectedTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTheme('dark');
                    showToast('🌙 Dark mode is coming soon!');
                  }}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            CATEGORY 3: SUPPORT & ABOUT
            ============================================================ */}
        <div className="profile-category-group">
          <span className="category-section-title">SUPPORT & ABOUT</span>

          <div className="profile-settings-card">
            {/* Help Center */}
            <div
              className="settings-row-item"
              onClick={() => setIsHelpCenterOpen(true)}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-headset"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Help Center</strong>
                <span className="settings-row-sub">24/7 Telegram support & FAQs</span>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron"></i>
            </div>

            {/* About Lomii Bingo */}
            <div
              className="settings-row-item"
              onClick={() => setIsAboutLomiOpen(true)}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-circle-info"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">About Lomii Bingo</strong>
                <span className="settings-row-sub">NLA license, RNG fairness & version</span>
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
                <strong className="settings-row-title logout-txt">Logout</strong>
                <span className="settings-row-sub">Sign out from your account</span>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Production-Grade Modals */}
      <AccountInfoModal
        isOpen={isAccountInfoOpen}
        onClose={() => setIsAccountInfoOpen(false)}
      />

      <HelpCenterModal
        isOpen={isHelpCenterOpen}
        onClose={() => setIsHelpCenterOpen(false)}
      />

      <AboutLomiModal
        isOpen={isAboutLomiOpen}
        onClose={() => setIsAboutLomiOpen(false)}
      />
    </div>
  );
};
