import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';

interface WalletMenuProps {
  onOpenHistory?: (type: 'deposits' | 'withdrawals') => void;
}

export const WalletMenu: React.FC<WalletMenuProps> = ({ onOpenHistory }) => {
  const { switchPage, showToast } = useApp();
  const { transactions } = useAdmin();

  const myTransactions = (transactions || []).filter(
    tx => tx.userId === 'usr-me' || tx.userName.includes('Me') || tx.userName === 'Player'
  );

  const depositsCount = myTransactions.filter(tx => tx.type === 'deposit').length || 4;
  const withdrawalsCount = myTransactions.filter(tx => tx.type === 'withdrawal').length || 1;

  return (
    <div className="fresh-wallet-menu-container">
      {/* Row 1: Deposit History */}
      <div
        className="fresh-menu-row-item"
        onClick={() => onOpenHistory?.('deposits')}
      >
        <div className="menu-row-icon-box green">
          <i className="fa-solid fa-arrow-down"></i>
        </div>
        <div className="menu-row-info-text">
          <strong className="menu-row-title">Deposit History</strong>
          <span className="menu-row-sub">Track your Telebirr & CBE deposits</span>
        </div>
        <div className="menu-row-action-right">
          <span className="menu-counter-badge green">{depositsCount}</span>
          <i className="fa-solid fa-chevron-right menu-chevron"></i>
        </div>
      </div>

      {/* Row 2: Withdrawal History */}
      <div
        className="fresh-menu-row-item"
        onClick={() => onOpenHistory?.('withdrawals')}
      >
        <div className="menu-row-icon-box red">
          <i className="fa-solid fa-arrow-up-from-bracket"></i>
        </div>
        <div className="menu-row-info-text">
          <strong className="menu-row-title">Withdrawal History</strong>
          <span className="menu-row-sub">Track your payouts & cashouts</span>
        </div>
        <div className="menu-row-action-right">
          <span className="menu-counter-badge red">{withdrawalsCount}</span>
          <i className="fa-solid fa-chevron-right menu-chevron"></i>
        </div>
      </div>

      {/* Row 3: Affiliate Program */}
      <div
        className="fresh-menu-row-item"
        onClick={() => switchPage('affiliate')}
      >
        <div className="menu-row-icon-box gold">
          <i className="fa-solid fa-users"></i>
        </div>
        <div className="menu-row-info-text">
          <strong className="menu-row-title">Affiliate Program</strong>
          <span className="menu-row-sub">Earn 10% on every 1st deposit</span>
        </div>
        <div className="menu-row-action-right">
          <span className="menu-tag-pill gold">10% BONUS</span>
          <i className="fa-solid fa-chevron-right menu-chevron"></i>
        </div>
      </div>

      {/* Row 4: Help & Support */}
      <div
        className="fresh-menu-row-item"
        onClick={() => showToast('🎧 24/7 Live Support via Telegram @LomiBingoHelp')}
      >
        <div className="menu-row-icon-box purple">
          <i className="fa-solid fa-headset"></i>
        </div>
        <div className="menu-row-info-text">
          <strong className="menu-row-title">Help & Support</strong>
          <span className="menu-row-sub">24/7 Live customer assistance</span>
        </div>
        <div className="menu-row-action-right">
          <i className="fa-solid fa-chevron-right menu-chevron"></i>
        </div>
      </div>
    </div>
  );
};
