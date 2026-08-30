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
      <div className="balance-card">
        <div className="balance-section">
          <div className="balance-label-row">
            <span className="balance-label">{t('nav.balance')}</span>
            <i className="fa-solid fa-wallet balance-label-icon"></i>
          </div>
          <span className="balance-amount">{balance.toFixed(2)} ETB</span>
        </div>
        <div className="balance-section">
          <div className="balance-label-row">
            <span className="balance-label">{t('nav.bonus')}</span>
            <i className="fa-solid fa-gift balance-label-icon"></i>
          </div>
          <span className="balance-amount">{bonus.toFixed(2)} ETB</span>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="action-btn withdraw"
          id="withdraw-btn"
          onClick={() => setIsWithdrawOpen(true)}
        >
          <i className="fa-solid fa-arrow-down-left"></i>
          {t('wallet.withdrawAction')}
        </button>
        <button
          className="action-btn deposit-action"
          id="deposit-btn"
          onClick={() => setIsDepositOpen(true)}
        >
          <i className="fa-solid fa-arrow-down"></i>
          {t('wallet.depositAction')}
        </button>
      </div>

      {/* Simple Modals */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
    </>
  );
};
