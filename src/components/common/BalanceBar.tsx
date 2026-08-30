import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { DepositModal } from '../wallet/DepositModal.tsx';

export const BalanceBar: React.FC = () => {
  const { balance, isBalanceVisible, toggleBalanceVisibility } = useWallet();
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  return (
    <>
      <div className="lobby-fresh-balance-bar">
        {/* Left: Yellow Wallet Icon */}
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
            <i className={`fa-regular ${isBalanceVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
          </button>
        </div>

        {/* Right: + Deposit Green Button */}
        <button
          type="button"
          className="btn-fresh-deposit"
          id="header-deposit"
          onClick={() => setIsDepositOpen(true)}
        >
          <i className="fa-solid fa-circle-plus"></i>
          <span>Deposit</span>
        </button>
      </div>

      {/* 1-Tap Deposit Modal */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </>
  );
};
