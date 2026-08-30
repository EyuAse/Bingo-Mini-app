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

      <div className="menu-section">
        <div className="menu-grid">
          {/* Leaderboard */}
          <div
            className="menu-item"
            id="menu-leaderboard"
            onClick={() => switchPage('leader')}
          >
            <div className="menu-item-icon">
              <i className="fa-solid fa-chart-simple"></i>
            </div>
            <span className="menu-item-text">{t('nav.leaderboard')}</span>
            <i className="fa-solid fa-chevron-right menu-item-arrow"></i>
          </div>

          {/* More Gifts */}
          <div
            className="menu-item more-gifts"
            id="menu-gifts"
            onClick={() => showToast('🎁 Free spins and bonuses credited daily!')}
          >
            <i className="fa-solid fa-gift gifts-icon"></i>
            <span className="gifts-text">{t('nav.bonus')}</span>
          </div>

          {/* Affiliate */}
          <div
            className="menu-item"
            id="menu-affiliate"
            onClick={() => showToast('👥 Invite friends and earn up to 500 ETB!')}
          >
            <div className="menu-item-icon">
              <i className="fa-solid fa-people-group"></i>
            </div>
            <span className="menu-item-text">Affiliate</span>
            <i className="fa-solid fa-chevron-right menu-item-arrow"></i>
          </div>

          {/* Promotion */}
          <div
            className="menu-item"
            id="menu-promotion"
            onClick={() => showToast('🔥 200% Bonus promotion is active on your next deposit!')}
          >
            <div className="menu-item-icon">
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <span className="menu-item-text">Promotion</span>
            <i className="fa-solid fa-chevron-right menu-item-arrow"></i>
          </div>
        </div>
      </div>

      {/* Profile Row */}
      <div className="profile-row" id="profile-row" onClick={() => switchPage('profile')}>
        <i className="fa-regular fa-user profile-row-icon"></i>
        <span className="profile-row-text">{t('nav.profile')}</span>
        <i className="fa-solid fa-chevron-right profile-row-arrow"></i>
      </div>

      {/* Support Row */}
      <div
        className="support-row"
        id="support-row"
        onClick={() => showToast('🎧 Support team is available 24/7 via live chat!')}
      >
        <i className="fa-solid fa-headset support-row-icon"></i>
        <span className="support-row-text">{t('profile.support')}</span>
        <i className="fa-solid fa-chevron-right support-row-arrow"></i>
      </div>
    </>
  );
};
