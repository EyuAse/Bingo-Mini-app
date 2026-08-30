import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAdmin } from '../context/AdminContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';
import { LanguageDropdown } from '../components/common/LanguageDropdown.tsx';
import { SocialLoginRow } from '../components/auth/SocialLoginRow.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';

export const SignupPage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { t } = useLanguage();
  const { addUser, registerBonus } = useAdmin();
  const { addBonus } = useWallet();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('⚠️ PIN / Passwords do not match!');
      return;
    }

    // Register user in Admin system with 10 ETB free registration bonus
    addUser({
      name: fullName.trim() || 'Lomi Player',
      phone: phone.trim() || '+251 900 000 000',
      balance: 0,
      bonus: registerBonus,
      referralCount: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      status: 'active'
    });

    addBonus(registerBonus);
    showToast(`🎉 Welcome ${fullName || 'Player'}! +${registerBonus} Birr Free Registration Bonus Added!`);
    switchPage('games');
  };

  return (
    <div className="page active" id="page-signup">
      <div className="auth-page-wrapper">
        {/* Top Bar with Language Dropdown */}
        <div className="auth-top-bar">
          <button
            className="auth-back-btn"
            id="signup-back-btn"
            title={t('nav.back')}
            onClick={() => switchPage('landing')}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <LanguageDropdown />
        </div>

        {/* 3D BINGO Hero */}
        <div className="auth-hero-container">
          <img
            src="/assets/images/cards-balls-hero.svg"
            alt="3D BINGO Hero"
            className="auth-hero-img"
          />
        </div>

        {/* Glowing Signup Card */}
        <div className="auth-card">
          <h1 className="auth-heading">{t('auth.signupTitle')}</h1>
          <p className="auth-subheading">{t('auth.signupSub')}</p>

          <form className="auth-form" id="signup-form" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="signup-name">
                {t('auth.fullName')}
              </label>
              <div className="auth-input-box">
                <i className="fa-solid fa-user auth-input-icon"></i>
                <input
                  type="text"
                  id="signup-name"
                  placeholder={t('auth.fullNamePlaceholder')}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="signup-phone">
                {t('auth.phoneNumber')}
              </label>
              <div className="auth-input-box">
                <i className="fa-solid fa-phone auth-input-icon"></i>
                <input
                  type="tel"
                  id="signup-phone"
                  placeholder={t('auth.phonePlaceholder')}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="signup-password">
                {t('auth.password')}
              </label>
              <div className="auth-input-box">
                <i className="fa-solid fa-lock auth-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <i
                  className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} auth-eye-toggle`}
                  id="signup-pwd-toggle"
                  style={{ color: showPassword ? '#ec4899' : '' }}
                  onClick={() => setShowPassword(prev => !prev)}
                ></i>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="signup-confirm-password">
                {t('auth.confirmPassword')}
              </label>
              <div className="auth-input-box">
                <i className="fa-solid fa-shield-halved auth-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-confirm-password"
                  placeholder={t('auth.confirmPlaceholder')}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="auth-terms-row">
              <div
                className={`auth-checkbox ${!agreeTerms ? 'unchecked' : ''}`}
                id="terms-checkbox"
                onClick={() => setAgreeTerms(prev => !prev)}
              >
                <i className="fa-solid fa-check"></i>
              </div>
              <span className="auth-terms-text" onClick={() => setAgreeTerms(prev => !prev)}>
                {t('auth.agreeTerms')}
              </span>
            </div>

            {/* Submit CTA */}
            <button type="submit" className="auth-submit-btn" id="signup-submit-btn" disabled={!agreeTerms}>
              <span>{t('auth.signupBtn')}</span>
              <i className="fa-solid fa-bolt"></i>
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span>or register with</span>
            </div>

            {/* Social Logins */}
            <SocialLoginRow mode="signup" />

            {/* Already have account row */}
            <div className="auth-switch-row">
              <span>{t('auth.haveAccount')}</span>
              <button
                type="button"
                className="auth-switch-link"
                id="goto-login-link"
                onClick={() => switchPage('login')}
              >
                {t('auth.loginNow')}
              </button>
            </div>
          </form>
        </div>

        {/* Floating Ambient Balls */}
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
