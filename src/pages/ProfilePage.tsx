import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ProfileHeader } from '../components/wallet/ProfileHeader.tsx';

export const ProfilePage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { lang, toggleLang } = useLanguage();

  // Stateful Theme Toggle (Light / Dark)
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');

  const handleLogout = () => {
    showToast('👋 You have been logged out.');
    switchPage('landing');
  };

  return (
    <div className="page active page-profile-fresh" id="page-profile">
      {/* 1. User Profile Banner Card (Image 1) */}
      <ProfileHeader />

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
              onClick={() => showToast('👤 Name: Eyu Ase | Phone: 251983624574')}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-regular fa-user"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Account Information</strong>
                <span className="settings-row-sub">View and update your personal info</span>
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
              onClick={() => showToast('🎧 24/7 Live Support via Telegram @LomiBingoHelp')}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-headset"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Help Center</strong>
                <span className="settings-row-sub">Get help and support</span>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron"></i>
            </div>

            {/* About Lomii Bingo */}
            <div
              className="settings-row-item"
              onClick={() => showToast('🍋 Lomi Bingo v3.4.0 • 75-Ball Express Game Engine')}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-circle-info"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">About Lomii Bingo</strong>
                <span className="settings-row-sub">App version, terms and policies</span>
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
    </div>
  );
};
