import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { LanguageDropdown } from '../components/common/LanguageDropdown.tsx';
import { SocialLoginRow } from '../components/auth/SocialLoginRow.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';

export const LoginPage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Welcome back, ${username || 'Player'}!`);
    switchPage('games');
  };

  return (
    <div className="page active" id="page-login">
      <div className="auth-page-wrapper">
        {/* Top Bar: Back button & Language dropdown */}
        <div className="auth-top-bar">
          <button
            className="auth-back-btn"
            id="login-back-btn"
            title={t('nav.back')}
            onClick={() => switchPage('landing')}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <LanguageDropdown />
        </div>

        {/* 3D BINGO Hero Visual */}
        <div className="auth-hero-container">
          <img
            src="/assets/images/cards-balls-hero.svg"
            alt="3D BINGO Hero"
            className="auth-hero-img"
          />
        </div>

        {/* Glowing Auth Card */}
        <div className="auth-card">
          <h1 className="auth-heading">{t('auth.loginTitle')}</h1>
          <p className="auth-subheading">{t('auth.loginSub')}</p>

          <form className="auth-form" id="login-form" onSubmit={handleSubmit}>
            {/* Phone Number / Username */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="login-username">
                {t('auth.phoneNumber')}
              </label>
              <div className="auth-input-box">
                <i className="fa-solid fa-phone auth-input-icon"></i>
                <input
                  type="text"
                  id="login-username"
                  placeholder={t('auth.phonePlaceholder')}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="login-password">
                  {t('auth.password')}
                </label>
              </div>
              <div className="auth-input-box">
                <i className="fa-solid fa-lock auth-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <i
                  className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} auth-eye-toggle`}
                  id="pwd-toggle"
                  style={{ color: showPassword ? '#ec4899' : '' }}
                  onClick={() => setShowPassword(prev => !prev)}
                ></i>
              </div>
            </div>

            {/* Remember me & Secure Login */}
            <div className="auth-options-row">
              <div
                className="auth-remember-label"
                id="remember-row"
                onClick={() => setRememberMe(prev => !prev)}
              >
                <div
                  className={`auth-checkbox ${!rememberMe ? 'unchecked' : ''}`}
                  id="remember-checkbox"
                >
                  <i className="fa-solid fa-check"></i>
                </div>
                <span>Remember me</span>
              </div>
              <div className="secure-login-badge">
                <i className="fa-solid fa-shield-halved"></i>
                <span>SSL Secured</span>
              </div>
            </div>

            {/* Submit CTA */}
            <button type="submit" className="auth-submit-btn" id="login-btn">
              <span>{t('auth.loginBtn')}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            {/* Social Logins */}
            <SocialLoginRow mode="login" />

            {/* "New here?" Sub-Card Box */}
            <div className="new-here-card">
              <img
                src="/assets/images/auth-gift.jpg"
                alt="Gift Box"
                className="new-here-gift-img"
              />
              <div className="new-here-text">
                <h3 className="new-here-title">{t('auth.noAccount')}</h3>
                <p className="new-here-subtitle">{t('auth.signupSub')}</p>
              </div>
              <button
                type="button"
                className="new-here-btn"
                id="goto-signup-btn"
                onClick={() => switchPage('signup')}
              >
                <span>{t('auth.registerNow')}</span>
                <i className="fa-solid fa-user-plus"></i>
              </button>
            </div>
          </form>
        </div>

        {/* Floating Ambient Balls (3 and 9) */}
        <div className="floating-balls-container">
          <img src="/assets/images/ball-3.jpg" alt="Ball 3" className="floating-ball ball-left" />
          <img src="/assets/images/ball-9.jpg" alt="Ball 9" className="floating-ball ball-right" />
        </div>

        {/* Trust Footer Bar */}
        <TrustFooter />
      </div>
    </div>
  );
};
