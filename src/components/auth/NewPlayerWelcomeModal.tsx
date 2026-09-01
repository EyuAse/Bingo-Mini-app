import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { User } from '../../types/auth';
import { telegramService } from '../../services/telegramService';

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
    telegramService.triggerHaptic('success');
    onClose();
    switchPage('games');
  };

  const displayName = user.fullName || 'Lomi Player';
  const displayUsername = user.telegramUsername ? `@${user.telegramUsername}` : 'Verified Player';

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-backdrop" onClick={onClose}></div>
      <div
        className="otp-modal-card hk-welcome-card"
        style={{
          maxWidth: '390px',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '28px',
          padding: '28px 20px 22px 20px',
          border: '1.5px solid rgba(250, 204, 21, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(234, 179, 8, 0.25)',
          textAlign: 'center'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          className="btn-otp-modal-close"
          onClick={onClose}
          title="Close"
          style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* 3D Crowned Lemon Transparent Badge */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
          <div
            style={{
              width: '90px',
              height: '90px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              filter: 'drop-shadow(0 10px 25px rgba(250, 204, 21, 0.5))'
            }}
          >
            <img
              src="/assets/images/lomi_crowned_lemon_badge.png"
              alt="Lomi Crowned Lemon"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Level 1 Badge */}
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(250, 204, 21, 0.15)',
            border: '1px solid #facc15',
            borderRadius: '999px',
            padding: '3px 12px',
            fontSize: '11px',
            fontWeight: '800',
            color: '#fde047',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}
        >
          ⭐ LVL 1 • {lang === 'am' ? 'ጀማሪ ተጫዋች' : 'ROOKIE BINGO MASTER'}
        </div>

        {/* Player Greeting */}
        <h3
          style={{
            fontSize: '22px',
            fontWeight: '900',
            margin: '0 0 4px 0',
            letterSpacing: '-0.3px',
            color: '#ffffff'
          }}
        >
          {lang === 'am' ? `እንኳን ደህና መጡ፣ ${displayName}!` : `Welcome, ${displayName}!`}
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
          {displayUsername} • <span style={{ color: '#22c55e' }}>🟢 {lang === 'am' ? 'መለያዎ ተረጋግጧል' : 'Account Verified'}</span>
        </p>

        {/* Hamster Kombat Style +10 ETB Reward Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.2) 0%, rgba(202, 138, 4, 0.25) 100%)',
            border: '1.5px solid #eab308',
            borderRadius: '20px',
            padding: '16px 14px',
            marginBottom: '18px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#fef08a'
            }}
          >
            🎁 {lang === 'am' ? 'የመጀመሪያ መመዝገቢያ ቦነስ' : 'FREE SIGN UP BONUS'}
          </div>
          <div
            style={{
              fontSize: '34px',
              fontWeight: '900',
              color: '#facc15',
              margin: '4px 0',
              letterSpacing: '-0.5px',
              textShadow: '0 2px 10px rgba(250, 204, 21, 0.5)'
            }}
          >
            +{bonusAmount}.00 <span style={{ fontSize: '18px', fontWeight: '700' }}>ETB</span>
          </div>
          <div style={{ fontSize: '12px', color: '#fde68a', fontWeight: '600' }}>
            {lang === 'am'
              ? 'ወደ ቦርሳዎ ገቢ ተደርጓል • አሁኑኑ መጫወት ይችላሉ!'
              : 'Added to your wallet • Ready for live games!'}
          </div>
        </div>

        {/* Big CTA Action Button */}
        <button
          type="button"
          onClick={handleStartPlaying}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
            color: '#0f172a',
            fontSize: '16px',
            fontWeight: '900',
            border: 'none',
            borderRadius: '999px',
            padding: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(234, 179, 8, 0.45)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 0.15s ease'
          }}
        >
          <i className="fa-solid fa-play"></i>{' '}
          {lang === 'am' ? 'አሁኑኑ ጨዋታ ጀምር 🚀' : 'TAP TO PLAY LIVE BINGO 🚀'}
        </button>
      </div>
    </div>
  );
};
