import React from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const BalanceBar: React.FC = () => {
  const { balance, bonus, isBalanceVisible, toggleBalanceVisibility } = useWallet();
  const { switchPage } = useApp();
  const { t } = useLanguage();

  const totalPlayable = balance + bonus;

  return (
    <div className="lobby-balance-bar-wrapper">
      <div className="lobby-fresh-balance-bar">
        {/* Left: Bright Yellow Circle with White Wallet Icon */}
        <div className="balance-wallet-icon-circle">
          <i className="fa-solid fa-wallet"></i>
        </div>

        {/* Center: Total Playable Amount, Welcome Bonus & Eye Toggle */}
        <div className="balance-amount-center">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="balance-val-text">
              {isBalanceVisible ? `${totalPlayable.toFixed(2)} ETB` : '•••••• ETB'}
            </span>
            {isBalanceVisible && bonus > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '1px 5px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title={`Playable: ${totalPlayable.toFixed(2)} ETB (Cash: ${balance.toFixed(2)} ETB + Bonus: ${bonus.toFixed(2)} ETB)`}
              >
                <i className="fa-solid fa-gift" style={{ fontSize: '8px' }}></i>
                {bonus.toFixed(0)} BONUS
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn-balance-eye-toggle"
            onClick={toggleBalanceVisibility}
            title={isBalanceVisible ? 'Hide Balance' : 'Show Balance'}
          >
            <i className={`fa-regular ${isBalanceVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>

        {/* Right: + Deposit Green Pill Button -> Navigates to dedicated page */}
        <button
          type="button"
          className="btn-fresh-deposit"
          id="header-deposit"
          onClick={() => switchPage('deposit')}
        >
          <i className="fa-solid fa-circle-plus"></i>
          <span>{t('common.deposit')}</span>
        </button>
      </div>
    </div>
  );
};
