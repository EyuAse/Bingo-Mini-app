import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { telegramService } from '../../services/telegramService';

interface TelegramRegisterModalProps {
  isOpen: boolean;
  bonusAmount: number;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const TelegramRegisterModal: React.FC<TelegramRegisterModalProps> = ({
  isOpen,
  bonusAmount,
  isLoading,
  onConfirm,
  onClose
}) => {
  const { lang } = useLanguage();
  const { telegramUser } = useAuth();

  if (!isOpen) return null;

  const displayName = telegramUser
    ? `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || `@${telegramUser.username}`
    : 'Telegram Player';

  const displayHandle = telegramUser?.username
    ? `@${telegramUser.username}`
    : `ID: ${telegramUser?.id || 'Telegram User'}`;

  const handleConfirmClick = () => {
    telegramService.triggerHaptic('success');
    onConfirm();
  };

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-backdrop" onClick={onClose}></div>
      <div
        className="otp-modal-card tg-register-modal-card"
        style={{
          maxWidth: '390px',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '28px',
          padding: '26px 20px 22px 20px',
          border: '1.5px solid rgba(250, 204, 21, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(234, 179, 8, 0.25)',
          textAlign: 'center',
          boxSizing: 'border-box'
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

        {/* 3D Lemon Mascot with Crown */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef08a 0%, #facc15 50%, #eab308 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              boxShadow: '0 0 25px rgba(250, 204, 21, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
              margin: '0 auto'
            }}
          >
            🍋
          </div>
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-4px',
              fontSize: '22px'
            }}
          >
            👑
          </span>
        </div>

        {/* Modal Title */}
        <h3
          style={{
            fontSize: '22px',
            fontWeight: '900',
            margin: '0 0 4px 0',
            letterSpacing: '-0.3px',
            color: '#ffffff'
          }}
        >
          {lang === 'am' ? 'የሎሚ ቢንጎ መለያዎን ይፍጠሩ' : 'Create Your Lomi Account'}
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
          {lang === 'am'
            ? 'በቴሌግራም በአንድ ንክኪ ይመዝገቡ • ምንም ፎርም አያስፈልግም ⚡'
            : 'Instant 1-click registration via Telegram • No forms needed ⚡'}
        </p>

        {/* Bonus Award Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.2) 0%, rgba(202, 138, 4, 0.25) 100%)',
            border: '1.5px solid #eab308',
            borderRadius: '16px',
            padding: '14px 12px',
            marginBottom: '14px',
            backdropFilter: 'blur(8px)'
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
            🎁 {lang === 'am' ? 'የነፃ መመዝገቢያ ቦነስ' : 'FREE SIGN UP BONUS'}
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '900',
              color: '#facc15',
              margin: '2px 0',
              letterSpacing: '-0.5px'
            }}
          >
            +{bonusAmount}.00 <span style={{ fontSize: '16px', fontWeight: '700' }}>ETB</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#fde68a', fontWeight: '600' }}>
            {lang === 'am' ? 'በምዝገባ ወቅት ወዲያውኑ ይሰጣል' : 'Automatically credited to your wallet'}
          </div>
        </div>

        {/* Telegram Profile Details Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#ffffff',
              flexShrink: 0
            }}
          >
            <i className="fa-brands fa-telegram"></i>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>
              {displayHandle} • <span style={{ color: '#4ade80' }}>🟢 Verified</span>
            </div>
          </div>
        </div>

        {/* 1-Click Action Confirmation Button */}
        <button
          type="button"
          onClick={handleConfirmClick}
          disabled={isLoading}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
            color: '#0f172a',
            fontSize: '15.5px',
            fontWeight: '900',
            border: 'none',
            borderRadius: '999px',
            padding: '14px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(234, 179, 8, 0.45)',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            transition: 'all 0.15s ease'
          }}
        >
          {isLoading ? (
            <span>
              <i className="fa-solid fa-spinner fa-spin"></i>{' '}
              {lang === 'am' ? 'በመፍጠር ላይ...' : 'Creating Account...'}
            </span>
          ) : (
            <span>
              ⚡ {lang === 'am' ? 'መለያ ፍጠርና 10 ብር ተቀበል 🚀' : 'Create Account & Claim +10 ETB 🚀'}
            </span>
          )}
        </button>

        {/* Security badges at bottom */}
        <div
          style={{
            marginTop: '14px',
            fontSize: '11px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span style={{ color: '#22c55e' }}>🛡️</span>
          <span>
            {lang === 'am'
              ? '100% ነፃ • ፈጣን የቴሌብር ክፍያ'
              : '100% Free • Instant Telebirr Payouts'}
          </span>
        </div>
      </div>
    </div>
  );
};
