import React from 'react';
import { LomiLogo } from './LomiLogo';
import { useLanguage } from '../../context/LanguageContext';

export const AppSplashScreen: React.FC = () => {
  const { lang } = useLanguage();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, #fffdf8 0%, #fefce8 50%, #fef9c3 100%)',
        color: '#0f172a',
        padding: '24px',
        textAlign: 'center',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Brand Logo */}
      <div
        style={{
          transform: 'scale(1.3)',
          marginBottom: '28px',
          filter: 'drop-shadow(0 10px 25px rgba(234, 179, 8, 0.3))'
        }}
      >
        <LomiLogo size="lg" />
      </div>

      {/* Brand Subtitle Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 800,
          color: '#854d0e',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <span>🇪🇹</span>
        <span>{lang === 'am' ? 'የቀጥታ 75-ኳስ ቢንጎ' : 'Live 75-Ball Bingo'}</span>
      </div>

      {/* Modern Circular Spinner */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid rgba(234, 179, 8, 0.2)',
          borderTopColor: '#16a34a',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px'
        }}
      />

      {/* Friendly Status Label */}
      <div
        style={{
          fontSize: '13.5px',
          fontWeight: 700,
          color: '#334155',
          letterSpacing: '0.2px'
        }}
      >
        {lang === 'am' ? 'እንኳን ደህና መጡ! በመገናኘት ላይ...' : 'Welcome! Connecting...'}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
