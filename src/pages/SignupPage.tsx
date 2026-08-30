import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAdmin } from '../context/AdminContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';
import { LanguageDropdown } from '../components/common/LanguageDropdown.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';

export const SignupPage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { t, lang } = useLanguage();
  const { addUser, registerBonus } = useAdmin();
  const { addBonus } = useWallet();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      showToast('⚠️ Please enter a valid phone number or email.');
      return;
    }

    // Register user in Admin system with 10 ETB free registration bonus
    addUser({
      name: fullName.trim() || 'Lomi Player',
      phone: phone.trim(),
      balance: 0,
      bonus: registerBonus,
      referralCount: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      status: 'active'
    });

    addBonus(registerBonus);
    showToast(`🎉 ${lang === 'am' ? `እንኳን ደህና መጡ ${fullName || 'ተጫዋች'}! የ10 ብር ነፃ ቦነስ ተጨምሯል!` : `Welcome ${fullName || 'Player'}! +${registerBonus} Birr Free Registration Bonus Added!`}`);
    switchPage('games');
  };

  return (
    <div className="page active page-auth-fresh" id="page-signup">
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
            id="signup-back-btn"
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
              {t('auth.signupTitle')} <span className="title-lemon">🍋</span>
            </h1>
            <p className="auth-card-sub">{t('auth.signupSub')}</p>

            <form className="auth-fresh-form" onSubmit={handleSubmit}>
              {/* Field 1: Full Name */}
              <div className="auth-input-group">
                <label className="auth-input-label">{t('auth.fullName')}</label>
                <div className="auth-input-pill">
                  <div className="input-icon-wrap blue">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    required
                  />
                </div>
              </div>

              {/* Field 2: Email or Phone */}
              <div className="auth-input-group">
                <label className="auth-input-label">{t('auth.phoneNumber')}</label>
                <div className="auth-input-pill">
                  <div className="input-icon-wrap yellow">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t('auth.phonePlaceholder')}
                    required
                  />
                </div>
              </div>

              {/* Field 3: Create PIN */}
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

              {/* Field 4: Referral Code (Optional) */}
              <div className="auth-input-group">
                <label className="auth-input-label">
                  {lang === 'am' ? 'የመጋበዣ ኮድ (አስገዳጅ አይደለም)' : 'Referral Code (Optional)'}
                </label>
                <div className="auth-input-pill">
                  <div className="input-icon-wrap green">
                    <i className="fa-solid fa-gift"></i>
                  </div>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value)}
                    placeholder="e.g. LOMI-7842"
                  />
                </div>
              </div>

              {/* Terms & SSL Secured */}
              <div className="auth-meta-row">
                <label className="remember-checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                  />
                  <span className="custom-check-box">
                    <i className="fa-solid fa-check"></i>
                  </span>
                  <span className="remember-text">{t('auth.agreeTerms')}</span>
                </label>

                <div className="ssl-badge">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>SSL Secured</span>
                </div>
              </div>

              {/* Action Button: Sign Up ➔ */}
              <button type="submit" className="btn-auth-golden-cta" id="signup-submit-btn">
                <span>{t('auth.signupBtn')}</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </form>

            {/* Switch to Login */}
            <div className="auth-switch-link-row">
              <span>{t('auth.haveAccount')} </span>
              <button
                type="button"
                className="btn-switch-auth"
                onClick={() => switchPage('login')}
              >
                {t('auth.loginNow')}
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
