import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { LanguageDropdown } from '../components/common/LanguageDropdown.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';

export const LoginPage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { t, lang } = useLanguage();
  const [username, setUsername] = useState('asefaeyob962@gmail.com');
  const [password, setPassword] = useState('••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(lang === 'am' ? `እንኳን ደህና መጡ፣ ${username || 'ተጫዋች'}!` : `Welcome back, ${username || 'Player'}!`);
    switchPage('games');
  };

  const handleApplyReferral = () => {
    if (referralCode.trim()) {
      showToast(`🎁 Referral code ${referralCode.toUpperCase()} applied!`);
      setShowReferralInput(false);
    } else {
      showToast('⚠️ Please enter a referral code.');
    }
  };

  return (
    <div className="page active page-auth-fresh" id="page-login">
      {/* Background Floating Lemon Slices */}
      <div className="bg-floating-lemon-slice lemon-auth-left"></div>
      <div className="bg-floating-lemon-slice lemon-auth-right"></div>
      <div className="bg-floating-leaf leaf-auth-top"></div>
      <div className="bg-floating-leaf leaf-auth-bottom"></div>

      <div className="auth-fresh-container">
        {/* 1. Top Navigation Bar */}
        <div className="auth-fresh-topbar">
          <button
            type="button"
            className="btn-auth-back-square"
            id="login-back-btn"
            onClick={() => switchPage('landing')}
            title="Back"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <LanguageDropdown />
        </div>

        {/* 2. 3D Header Graphic (Cartelas + Balls B, 75, 6) */}
        <div className="auth-header-artwork-wrap">
          <img
            src="/assets/images/auth-header-75.jpg"
            alt="Bingo Cartelas and Balls"
            className="auth-header-art-img"
          />
        </div>

        {/* 3. Main White Auth Card with Flanking Balls */}
        <div className="auth-card-relative-shell">
          {/* Left Flanking Ball (Yellow 3) */}
          <div className="flanking-ball-ornament ball-left-yellow">
            <span className="ball-num">3</span>
          </div>

          {/* Right Flanking Ball (Green 9) */}
          <div className="flanking-ball-ornament ball-right-green">
            <span className="ball-num">9</span>
          </div>

          <div className="auth-fresh-card">
            <h1 className="auth-card-title">
              {t('auth.loginTitle')} <span className="title-lemon">🍋</span>
            </h1>
            <p className="auth-card-sub">{t('auth.loginSub')}</p>

            <form className="auth-fresh-form" onSubmit={handleSubmit}>
              {/* Field 1: Email or Phone */}
              <div className="auth-input-group">
                <label className="auth-input-label">{t('auth.phoneNumber')}</label>
                <div className="auth-input-pill">
                  <div className="input-icon-wrap yellow">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={t('auth.phonePlaceholder')}
                    required
                  />
                </div>
              </div>

              {/* Field 2: PIN */}
              <div className="auth-input-group">
                <label className="auth-input-label">{t('auth.password')}</label>
                <div className="auth-input-pill">
                  <div className="input-icon-wrap gold">
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                  />
                  <button
                    type="button"
                    className="btn-eye-toggle"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Remember Me & SSL Secured */}
              <div className="auth-meta-row">
                <label className="remember-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span className="custom-check-box">
                    <i className="fa-solid fa-check"></i>
                  </span>
                  <span className="remember-text">
                    {lang === 'am' ? 'አስታውሰኝ' : 'Remember me'}
                  </span>
                </label>

                <div className="ssl-badge">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>SSL Secured</span>
                </div>
              </div>

              {/* Action Button: Login ➔ */}
              <button type="submit" className="btn-auth-golden-cta" id="login-submit-btn">
                <span>{t('auth.loginBtn')}</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </form>

            {/* Switch to Sign Up */}
            <div className="auth-switch-link-row">
              <span>{t('auth.noAccount')} </span>
              <button
                type="button"
                className="btn-switch-auth"
                onClick={() => switchPage('signup')}
              >
                {t('auth.registerNow')}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Bottom 3-Pillar Trust Footer */}
        <TrustFooter />
      </div>
    </div>
  );
};
