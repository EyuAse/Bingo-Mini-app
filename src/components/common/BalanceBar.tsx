import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { DepositModal } from '../wallet/DepositModal.tsx';

export const BalanceBar: React.FC = () => {
  const { balance, isBalanceVisible, toggleBalanceVisibility, refreshBalance, isRefreshing } = useWallet();
  const { t } = useLanguage();
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  return (
    <>
      <div className="balance-bar">
        <div className="balance-logo">
          <i className="fa-solid fa-globe"></i>
        </div>
        <div className="balance-info">
          <i
            className="fa-solid fa-rotate refresh-icon"
            id="refresh-balance"
            onClick={refreshBalance}
            style={{
              transform: isRefreshing ? 'rotate(360deg)' : 'none',
              transition: isRefreshing ? 'transform 0.5s ease' : 'none'
            }}
            title="Refresh"
          ></i>
          <span className="balance-text">
            {isBalanceVisible ? `${balance.toFixed(2)} ETB` : '•••• ETB'}
          </span>
          <i
            className={`fa-solid ${isBalanceVisible ? 'fa-eye-slash' : 'fa-eye'} eye-icon`}
            id="toggle-balance"
            onClick={toggleBalanceVisibility}
            title={isBalanceVisible ? 'Hide' : 'Show'}
          ></i>
        </div>
        <button
          className="deposit-btn"
          id="header-deposit"
          onClick={() => setIsDepositOpen(true)}
        >
          <i className="fa-solid fa-credit-card"></i>
          {t('nav.deposit')}
        </button>
      </div>

      {/* 1-Tap Deposit Modal */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </>
  );
};
