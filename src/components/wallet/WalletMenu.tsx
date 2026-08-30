import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface WalletMenuProps {
  onOpenHistory?: (type: 'deposits' | 'withdrawals') => void;
}

export const WalletMenu: React.FC<WalletMenuProps> = ({ onOpenHistory }) => {
  const { switchPage, showToast } = useApp();
  const { transactions } = useAdmin();
  const { t } = useLanguage();

  const myTransactions = (transactions || []).filter(
    tx => tx.userId === 'usr-me' || tx.userName.includes('Me') || tx.userName === 'Player'
  );

  const depositsCount = myTransactions.filter(tx => tx.type === 'deposit').length;
  const withdrawalsCount = myTransactions.filter(tx => tx.type === 'withdrawal').length;

  return (
    <>
      {/* Dedicated Transaction History Action Buttons */}
      <div className="wallet-history-nav-section">
        <div
          className="history-nav-card deposit-nav-card"
          onClick={() => onOpenHistory?.('deposits')}
        >
          <div className="hist-nav-icon-wrap green">
            <i className="fa-solid fa-arrow-down-left"></i>
          </div>
          <div className="hist-nav-info">
            <span className="hist-nav-title">Deposit History</span>
            <span className="hist-nav-sub">Track Telebirr & CBE Deposits</span>
          </div>
          <div className="hist-nav-badge-wrap">
            {depositsCount > 0 && <span className="hist-count-badge green">{depositsCount}</span>}
            <i className="fa-solid fa-chevron-right"></i>
          </div>
        </div>

        <div
          className="history-nav-card withdraw-nav-card"
          onClick={() => onOpenHistory?.('withdrawals')}
        >
          <div className="hist-nav-icon-wrap red">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </div>
          <div className="hist-nav-info">
            <span className="hist-nav-title">Withdrawal History</span>
            <span className="hist-nav-sub">Track Payout & Cashouts</span>
          </div>
          <div className="hist-nav-badge-wrap">
            {withdrawalsCount > 0 && <span className="hist-count-badge red">{withdrawalsCount}</span>}
            <i className="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      </div>

      {/* Clean Account & Affiliate Navigation Rows */}
      <div className="wallet-menu-list">
        {/* Affiliate (10% Referral Program) */}
        <div
          className="wallet-menu-row affiliate-row"
          id="menu-affiliate"
          onClick={() => switchPage('affiliate')}
        >
          <div className="menu-row-icon gold">
            <i className="fa-solid fa-people-group"></i>
          </div>
          <div className="menu-row-info">
            <span className="menu-row-title">Affiliate Program</span>
            <span className="menu-row-sub">Earn 10% on every 1st deposit</span>
          </div>
          <span className="affiliate-badge-mini">10% BONUS</span>
          <i className="fa-solid fa-chevron-right menu-row-arrow"></i>
        </div>

        {/* Profile */}
        <div className="wallet-menu-row" id="profile-row" onClick={() => switchPage('profile')}>
          <div className="menu-row-icon blue">
            <i className="fa-regular fa-user"></i>
          </div>
          <div className="menu-row-info">
            <span className="menu-row-title">{t('nav.profile')}</span>
            <span className="menu-row-sub">Account details & preferences</span>
          </div>
          <i className="fa-solid fa-chevron-right menu-row-arrow"></i>
        </div>

        {/* Support */}
        <div
          className="wallet-menu-row"
          id="support-row"
          onClick={() => showToast('🎧 Support team is available 24/7 via live chat!')}
        >
          <div className="menu-row-icon purple">
            <i className="fa-solid fa-headset"></i>
          </div>
          <div className="menu-row-info">
            <span className="menu-row-title">{t('profile.support')}</span>
            <span className="menu-row-sub">24/7 Live customer assistance</span>
          </div>
          <i className="fa-solid fa-chevron-right menu-row-arrow"></i>
        </div>
      </div>
    </>
  );
};
