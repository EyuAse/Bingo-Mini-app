import React from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const BalanceCard: React.FC = () => {
  const { balance, bonus } = useWallet();
  const { switchPage } = useApp();
  const { t, lang } = useLanguage();

  const totalPlayable = balance + bonus;

  return (
    <>
      {/* 2-Column Balance Overview Card */}
      <div className="fresh-balance-overview-card">
        {/* Column 1: Real Cash Balance */}
        <div className="balance-overview-col">
          <div className="overview-icon-circ yellow">
            <i className="fa-solid fa-wallet"></i>
          </div>
          <div className="overview-col-text">
            <span className="overview-col-lbl">{t('wallet.totalBalance')}</span>
            <strong className="overview-col-val">{balance.toFixed(2)} ETB</strong>
          </div>
        </div>

        {bonus > 0 && (
          <>
            <div className="overview-col-divider"></div>

            {/* Column 2: Welcome Bonus Balance */}
            <div className="balance-overview-col">
              <div className="overview-icon-circ green">
                <i className="fa-solid fa-gift"></i>
              </div>
              <div className="overview-col-text">
                <span className="overview-col-lbl">{t('wallet.bonusBalance')}</span>
                <strong className="overview-col-val" style={{ color: '#22c55e' }}>{bonus.toFixed(2)} ETB</strong>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Playable Summary Bar if Bonus is active */}
      {bonus > 0 && (
        <div
          style={{
            margin: '-6px 16px 12px',
            padding: '8px 14px',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}
        >
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#22c55e' }}></i>
            {lang === 'am' ? 'ለመጫወት ዝግጁ የሆነ ጠቅላላ ቀሪ ሂሳብ' : 'Total Playable Balance'}
          </span>
          <strong style={{ color: '#ffffff', fontWeight: 800 }}>{totalPlayable.toFixed(2)} ETB</strong>
        </div>
      )}

      {/* 2 Quick Action Buttons: Withdraw & Deposit Now -> Dedicated Pages */}
      <div className="fresh-wallet-action-row">
        <button
          type="button"
          className="btn-wallet-action-white"
          id="withdraw-btn"
          onClick={() => switchPage('withdraw')}
        >
          <i className="fa-solid fa-arrow-up-from-bracket"></i>
          <span>{t('wallet.withdrawBtn')}</span>
        </button>

        <button
          type="button"
          className="btn-wallet-action-gold"
          id="deposit-btn"
          onClick={() => switchPage('deposit')}
        >
          <i className="fa-solid fa-arrow-down"></i>
          <span>{t('wallet.depositNowBtn')}</span>
        </button>
      </div>
    </>
  );
};
