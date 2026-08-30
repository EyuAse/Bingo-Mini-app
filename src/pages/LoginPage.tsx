import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { LanguageDropdown } from '../components/common/LanguageDropdown.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';

export const LoginPage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { t } = useLanguage();
  const [username, setUsername] = useState('asefaeyob962@gmail.com');
  const [password, setPassword] = useState('••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Welcome back, ${username || 'Player'}!`);
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
              Welcome Back! <span className="title-lemon">🍋</span>
            </h1>
            <p className="auth-card-sub">Login to continue playing and winning</p>

            <form className="auth-fresh-form" onSubmit={handleSubmit}>
              {/* Field 1: Email or Phone */}
              <div className="auth-input-group">
                <label className="auth-input-label">Email or Phone</label>
                <div className="auth-input-pill">
                  <div className="input-icon-wrap yellow">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter phone or email"
                    required
                  />
                </div>
              </div>

              {/* Field 2: PIN */}
              <div className="auth-input-group">
                <label className="auth-input-label">PIN</label>
                <div className="auth-input-pill">
                  <div className="input-icon-wrap gold">
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter PIN"
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
                  <span className="remember-text">Remember me</span>
                </label>

                <div className="ssl-badge">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>SSL Secured</span>
                </div>
              </div>

              {/* Action Button: Login ➔ */}
              <button type="submit" className="btn-auth-golden-cta" id="login-submit-btn">
                <span>Login</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </form>

            {/* Divider: or continue with */}
            <div className="auth-or-divider">
              <span>or continue with</span>
            </div>

            {/* Social Logins: Google, Facebook, Apple */}
            <div className="auth-social-row">
              <button
                type="button"
                className="btn-social-pill google"
                onClick={() => {
                  showToast('🚀 Signed in with Google!');
                  switchPage('games');
                }}
              >
                <svg className="social-svg-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="btn-social-pill facebook"
                onClick={() => {
                  showToast('🚀 Signed in with Facebook!');
                  switchPage('games');
                }}
              >
                <i className="fa-brands fa-facebook-f social-fb-icon"></i>
                <span>Facebook</span>
              </button>

              <button
                type="button"
                className="btn-social-pill apple"
                onClick={() => {
                  showToast('🚀 Signed in with Apple!');
                  switchPage('games');
                }}
              >
                <i className="fa-brands fa-apple social-apple-icon"></i>
                <span>Apple</span>
              </button>
            </div>

            {/* Referral Code Box */}
            <div className="auth-referral-banner">
              <div className="ref-banner-left">
                <span className="ref-gift-emoji">🎁</span>
                <div className="ref-banner-text">
                  <strong>Have a referral code?</strong>
                  <span>Enter your code and get amazing rewards!</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-enter-code-mini"
                onClick={() => setShowReferralInput(prev => !prev)}
              >
                <span>Enter Code</span>
                <i className="fa-solid fa-user-plus"></i>
              </button>
            </div>

            {/* Inline Referral Input Box if clicked */}
            {showReferralInput && (
              <div className="inline-referral-input-box">
                <input
                  type="text"
                  placeholder="Enter Referral Code (e.g. LOMI-7842)"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                />
                <button type="button" className="btn-apply-ref" onClick={handleApplyReferral}>
                  Apply
                </button>
              </div>
            )}

            {/* Switch to Sign Up */}
            <div className="auth-switch-link-row">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="btn-switch-auth"
                onClick={() => switchPage('signup')}
              >
                Sign Up
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
