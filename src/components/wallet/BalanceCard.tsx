import React from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const BalanceCard: React.FC = () => {
  const { balance, bonus } = useWallet();
  const { switchPage } = useApp();
  const { t } = useLanguage();

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
