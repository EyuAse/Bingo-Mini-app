import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { DepositModal } from './DepositModal.tsx';
import { WithdrawModal } from './WithdrawModal.tsx';

export const BalanceCard: React.FC = () => {
  const { balance, bonus } = useWallet();
  const { t } = useLanguage();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  return (
    <>
      {/* 2-Column Balance Overview Card */}
      <div className="fresh-balance-overview-card">
        {/* Column 1: Total Balance */}
        <div className="balance-overview-col">
          <div className="overview-icon-circ yellow">
            <i className="fa-solid fa-wallet"></i>
          </div>
          <div className="overview-col-text">
            <span className="overview-col-lbl">{t('wallet.totalBalance')}</span>
            <strong className="overview-col-val">{balance.toFixed(2)} ETB</strong>
          </div>
        </div>

        <div className="overview-col-divider"></div>

        {/* Column 2: Bonus Balance */}
        <div className="balance-overview-col">
          <div className="overview-icon-circ green">
            <i className="fa-solid fa-gift"></i>
          </div>
          <div className="overview-col-text">
            <span className="overview-col-lbl">{t('wallet.bonusBalance')}</span>
            <strong className="overview-col-val">{bonus.toFixed(2)} ETB</strong>
          </div>
        </div>
      </div>

      {/* 2 Quick Action Buttons: Withdraw & Deposit Now */}
      <div className="fresh-wallet-action-row">
        <button
          type="button"
          className="btn-wallet-action-white"
          id="withdraw-btn"
          onClick={() => setIsWithdrawOpen(true)}
        >
          <i className="fa-solid fa-arrow-up-from-bracket"></i>
          <span>{t('wallet.withdrawBtn')}</span>
        </button>

        <button
          type="button"
          className="btn-wallet-action-gold"
          id="deposit-btn"
          onClick={() => setIsDepositOpen(true)}
        >
          <i className="fa-solid fa-arrow-down"></i>
          <span>{t('wallet.depositNowBtn')}</span>
        </button>
      </div>

      {/* Luxury Modals */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
    </>
  );
};
