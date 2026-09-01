import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { User } from '../../types/auth';

interface NewPlayerWelcomeModalProps {
  isOpen: boolean;
  user: User | null;
  bonusAmount: number;
  onClose: () => void;
}

export const NewPlayerWelcomeModal: React.FC<NewPlayerWelcomeModalProps> = ({
  isOpen,
  user,
  bonusAmount,
  onClose
}) => {
  const { lang } = useLanguage();
  const { switchPage } = useApp();

  if (!isOpen || !user) return null;

  const handleStartPlaying = () => {
    onClose();
    switchPage('games');
  };

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-backdrop" onClick={onClose}></div>
      <div className="otp-modal-card welcome-player-card" style={{ maxWidth: '400px' }}>
        {/* Close Button */}
        <button type="button" className="btn-otp-modal-close" onClick={onClose} title="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Celebration Header Artwork */}
        <div className="otp-icon-header">
          <div className="otp-sms-icon-bubble gold" style={{ width: '68px', height: '68px', fontSize: '32px' }}>
            🍋
          </div>
        </div>

        <h3 className="otp-modal-title" style={{ fontSize: '22px' }}>
          {lang === 'am' ? '🎉 እንኳን ደህና መጡ!' : '🎉 Welcome to Lomi Bingo!'}
        </h3>
        <p className="otp-modal-sub" style={{ fontSize: '13.5px', color: '#475569', marginBottom: '16px' }}>
          {lang === 'am'
            ? `ሰላም ${user.fullName}፣ መለያዎ በቴሌግራም በተሳካ ሁኔታ ተፈጥሯል!`
            : `Hello ${user.fullName}, your account is successfully connected via Telegram!`}
        </p>

        {/* Bonus Reward Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fef08a 0%, #fde047 50%, #eab308 100%)',
            borderRadius: '16px',
            padding: '16px 14px',
            marginBottom: '16px',
            color: '#713f12',
            boxShadow: '0 4px 14px rgba(234, 179, 8, 0.3)',
            border: '1.5px solid #ca8a04'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {lang === 'am' ? '🎁 የነፃ መመዝገቢያ ቦነስ' : '🎁 FREE WELCOME BONUS'}
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', margin: '4px 0', letterSpacing: '-0.5px' }}>
            +{bonusAmount} ETB
          </div>
          <div style={{ fontSize: '11.5px', fontWeight: '600' }}>
            {lang === 'am'
              ? 'ወዲያውኑ ወደ የኪስ ቦርሳዎ ገቢ ተደርጓል!'
              : 'Credited directly to your wallet to play!'}
          </div>
        </div>

        {/* Account Details Box */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '18px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Player ID:</span>
            <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{user.id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Telegram:</span>
            <strong style={{ color: '#2563eb' }}>@{user.telegramUsername || 'connected'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Status:</span>
            <strong style={{ color: '#16a34a' }}>🟢 Active & Verified</strong>
          </div>
        </div>

        {/* Start Playing CTA */}
        <button
          type="button"
          className="btn-confirm-otp-cta"
          onClick={handleStartPlaying}
          style={{ width: '100%', fontSize: '15px' }}
        >
          <i className="fa-solid fa-play"></i>{' '}
          {lang === 'am' ? 'አሁኑኑ መጫወት ጀምር' : 'Start Playing Live Bingo!'}
        </button>
      </div>
    </div>
  );
};
