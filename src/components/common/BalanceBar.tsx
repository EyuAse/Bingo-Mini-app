import React from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const BalanceBar: React.FC = () => {
  const { balance, isBalanceVisible, toggleBalanceVisibility } = useWallet();
  const { switchPage } = useApp();
  const { t } = useLanguage();

  return (
    <div className="lobby-balance-bar-wrapper">
      <div className="lobby-fresh-balance-bar">
        {/* Left: Bright Yellow Circle with White Wallet Icon */}
        <div className="balance-wallet-icon-circle">
          <i className="fa-solid fa-wallet"></i>
        </div>

        {/* Center: Amount & Eye Toggle */}
        <div className="balance-amount-center">
          <span className="balance-val-text">
            {isBalanceVisible ? `${balance.toFixed(2)} ETB` : '•••••• ETB'}
          </span>
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
