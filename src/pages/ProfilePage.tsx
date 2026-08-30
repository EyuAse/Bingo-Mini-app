import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';

export const ProfilePage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { balance } = useWallet();
  const { lang, toggleLang, t } = useLanguage();

  return (
    <div className="page active" id="page-profile" style={{ padding: '16px' }}>
      {/* Profile Header */}
      <div
        style={{
          background: '#0d122b',
          border: '1.5px solid rgba(255,255,255,0.1)',
          borderRadius: '18px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px'
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            color: '#ffffff',
            fontWeight: 900
          }}
        >
          AK
        </div>
        <div>
          <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>Abebe Kebede</h3>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>+251 91 123 4567</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#22c55e', fontSize: '0.8rem' }}></i>
            <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>{t('profile.verified')}</span>
          </div>
        </div>
      </div>

      {/* Balance Summary Box */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(202,138,4,0.05))',
          border: '1.5px solid rgba(234,179,8,0.4)',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}
      >
        <span style={{ color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600 }}>{t('nav.balance')}:</span>
        <span style={{ color: '#fbbf24', fontSize: '1.25rem', fontWeight: 900 }}>{balance.toFixed(2)} ETB</span>
      </div>

      {/* Profile Settings Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Language Switcher Row */}
        <div
          onClick={toggleLang}
          style={{
            background: '#0d122b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fa-solid fa-globe" style={{ color: '#38bdf8', fontSize: '1.1rem' }}></i>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>Language / ቋንቋ</span>
          </div>
          <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem' }}>
            {lang === 'am' ? '🇪🇹 አማርኛ' : '🇬🇧 English'}
          </span>
        </div>

        {/* Security */}
        <div
          onClick={() => showToast('🔒 Security settings & PIN change')}
          style={{
            background: '#0d122b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#a855f7', fontSize: '1.1rem' }}></i>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>{t('profile.security')}</span>
          </div>
          <i className="fa-solid fa-chevron-right" style={{ color: '#64748b', fontSize: '0.8rem' }}></i>
        </div>

        {/* Responsible Gaming */}
        <div
          onClick={() => showToast('🛡️ 21+ Only. Please play responsibly.')}
          style={{
            background: '#0d122b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fa-solid fa-scale-balanced" style={{ color: '#22c55e', fontSize: '1.1rem' }}></i>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>{t('profile.responsibleGaming')}</span>
          </div>
          <i className="fa-solid fa-chevron-right" style={{ color: '#64748b', fontSize: '0.8rem' }}></i>
        </div>

        {/* Log Out */}
        <div
          onClick={() => {
            showToast('👋 You have been logged out.');
            switchPage('landing');
          }}
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fa-solid fa-arrow-right-from-bracket" style={{ color: '#ef4444', fontSize: '1.1rem' }}></i>
            <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.9rem' }}>{t('nav.logout')}</span>
          </div>
          <i className="fa-solid fa-chevron-right" style={{ color: '#ef4444', fontSize: '0.8rem' }}></i>
        </div>
      </div>
    </div>
  );
};
