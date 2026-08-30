import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useBingo } from '../context/BingoContext.tsx';
import { ProfileHeader } from '../components/wallet/ProfileHeader.tsx';

export const ProfilePage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { lang, toggleLang } = useLanguage();
  const { isMuted, toggleMute } = useBingo();

  // Stateful Preferences & Notification Switches
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!isMuted);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);

  const [promoAlerts, setPromoAlerts] = useState<boolean>(true);
  const [gameAlerts, setGameAlerts] = useState<boolean>(true);
  const [txAlerts, setTxAlerts] = useState<boolean>(true);

  const handleSoundToggle = () => {
    setSoundEnabled(prev => !prev);
    toggleMute();
    showToast(!soundEnabled ? '🔊 Sound Effects Enabled' : '🔇 Sound Effects Muted');
  };

  const handleVibrationToggle = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    showToast(next ? '📳 Vibration Alerts Enabled' : '📴 Vibration Disabled');
  };

  const handlePromoToggle = () => {
    setPromoAlerts(prev => !prev);
    showToast(!promoAlerts ? '🎁 Promotion Alerts Turned ON' : 'Promotion Alerts Turned OFF');
  };

  const handleGameAlertsToggle = () => {
    setGameAlerts(prev => !prev);
    showToast(!gameAlerts ? '🔔 Game Alerts Turned ON' : 'Game Alerts Turned OFF');
  };

  const handleTxAlertsToggle = () => {
    setTxAlerts(prev => !prev);
    showToast(!txAlerts ? '👛 Transaction Alerts Turned ON' : 'Transaction Alerts Turned OFF');
  };

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

            {/* Change Password */}
            <div
              className="settings-row-item"
              onClick={() => showToast('🔒 Security PIN & Password change')}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-lock"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Change Password</strong>
                <span className="settings-row-sub">Keep your account secure</span>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron"></i>
            </div>

            {/* Security */}
            <div
              className="settings-row-item"
              onClick={() => showToast('🛡️ Two-factor authentication & active sessions')}
            >
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Security</strong>
                <span className="settings-row-sub">Two-factor authentication, device management</span>
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

            {/* Sound Effects */}
            <div className="settings-row-item">
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-volume-high"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Sound Effects</strong>
                <span className="settings-row-sub">Play sounds for actions and alerts</span>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={handleSoundToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Vibration */}
            <div className="settings-row-item">
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-mobile-screen"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Vibration</strong>
                <span className="settings-row-sub">Vibrate for notifications and alerts</span>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={handleVibrationToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* ============================================================
            CATEGORY 3: NOTIFICATIONS
            ============================================================ */}
        <div className="profile-category-group">
          <span className="category-section-title">NOTIFICATIONS</span>

          <div className="profile-settings-card">
            {/* Promotions */}
            <div className="settings-row-item">
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-gift"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Promotions</strong>
                <span className="settings-row-sub">Receive updates about bonuses and offers</span>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={promoAlerts}
                  onChange={handlePromoToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Game Alerts */}
            <div className="settings-row-item">
              <div className="settings-row-icon-circ">
                <i className="fa-regular fa-bell"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Game Alerts</strong>
                <span className="settings-row-sub">Important updates about your games</span>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={gameAlerts}
                  onChange={handleGameAlertsToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Deposit & Withdraw Alerts */}
            <div className="settings-row-item">
              <div className="settings-row-icon-circ">
                <i className="fa-solid fa-wallet"></i>
              </div>
              <div className="settings-row-text-col">
                <strong className="settings-row-title">Deposit & Withdraw Alerts</strong>
                <span className="settings-row-sub">Get notified about transactions</span>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={txAlerts}
                  onChange={handleTxAlertsToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* ============================================================
            CATEGORY 4: SUPPORT & ABOUT
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
