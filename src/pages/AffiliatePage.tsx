import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';

interface ReferredFriend {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  firstDeposit: number;
  bonusEarned: number;
  status: 'paid' | 'pending_deposit';
}

export const AffiliatePage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { bonus } = useWallet();

  const referralCode = 'LOMI-7842';
  const referralLink = `https://t.me/LomiBingoBot?start=ref_${referralCode}`;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const friendsList: ReferredFriend[] = [
    {
      id: 'f-1',
      name: 'Sami_Lucky',
      avatar: '👑',
      joinedAt: '2 days ago',
      firstDeposit: 500,
      bonusEarned: 50,
      status: 'paid'
    },
    {
      id: 'f-2',
      name: 'Eden_Rose',
      avatar: '💎',
      joinedAt: 'Yesterday',
      firstDeposit: 1000,
      bonusEarned: 100,
      status: 'paid'
    },
    {
      id: 'f-3',
      name: 'Nati_Boss',
      avatar: '⚡',
      joinedAt: '3 days ago',
      firstDeposit: 200,
      bonusEarned: 20,
      status: 'paid'
    },
    {
      id: 'f-4',
      name: 'Dani_Addis',
      avatar: '🎯',
      joinedAt: '4 days ago',
      firstDeposit: 300,
      bonusEarned: 30,
      status: 'paid'
    },
    {
      id: 'f-5',
      name: 'Alex_King',
      avatar: '🦁',
      joinedAt: 'Today, 10:45 PM',
      firstDeposit: 0,
      bonusEarned: 0,
      status: 'pending_deposit'
    }
  ];

  const totalInvited = friendsList.length;
  const activeDepositors = friendsList.filter(f => f.status === 'paid').length;
  const totalEarned = friendsList.reduce((acc, f) => acc + f.bonusEarned, 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast('📋 Referral Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showToast(`📋 Referral Code (${referralCode}) copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `🎉 Join me on Lomi Bingo! Get 10 Birr free signup bonus and win big with 400 cartelas: ${referralLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉 Join me on Lomi Bingo! Get 10 Birr free signup bonus: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="page active" id="page-affiliate" style={{ paddingBottom: '40px' }}>
      {/* Top Header Navigation */}
      <div className="affiliate-header-bar">
        <button type="button" className="btn-back-affiliate" onClick={() => switchPage('wallet')}>
          <i className="fa-solid fa-arrow-left"></i> Back to Wallet
        </button>
        <span className="affiliate-header-title">Affiliate & Referral Rewards</span>
      </div>

      <div className="affiliate-content-shell">
        {/* 1. Hero Value Proposition Banner */}
        <div className="affiliate-hero-card">
          <div className="affiliate-hero-badge">
            <i className="fa-solid fa-gift" style={{ color: '#facc15' }}></i>
            <span>10% REFERRAL BONUS PROGRAM</span>
          </div>
          <h2>Invite Friends & Earn 10% On Every First Deposit!</h2>
          <p>
            When your invited friend registers and makes their <strong>first deposit</strong>, you instantly receive <strong>10% of their deposit amount</strong> credited directly into your bonus balance.
          </p>
        </div>

        {/* 2. Invitation Link & Code Box */}
        <div className="referral-share-card">
          <div className="ref-card-header">
            <i className="fa-solid fa-link" style={{ color: '#38bdf8' }}></i>
            <span>Your Exclusive Referral Link</span>
          </div>

          <div className="ref-link-box">
            <input type="text" readOnly value={referralLink} />
            <button type="button" className="btn-copy-ref" onClick={handleCopyLink}>
              <i className={`fa-regular ${copiedLink ? 'fa-check' : 'fa-copy'}`}></i>
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="ref-code-row">
            <div className="code-pill">
              <span className="code-lbl">Referral Code:</span>
              <strong className="code-val">{referralCode}</strong>
              <button type="button" className="btn-mini-code-copy" onClick={handleCopyCode}>
                <i className={`fa-regular ${copiedCode ? 'fa-check' : 'fa-copy'}`}></i>
              </button>
            </div>

            <div className="share-actions-row">
              <button type="button" className="btn-share-tg" onClick={handleShareTelegram}>
                <i className="fa-brands fa-telegram"></i> Telegram
              </button>
              <button type="button" className="btn-share-wa" onClick={handleShareWhatsApp}>
                <i className="fa-brands fa-whatsapp"></i> WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* 3. 4-Card Analytics Stats Barometer */}
        <div className="affiliate-stats-grid">
          <div className="aff-stat-card">
            <div className="stat-header">
              <span className="stat-label">Friends Invited</span>
              <i className="fa-solid fa-users stat-icon purple"></i>
            </div>
            <div className="stat-val">{totalInvited}</div>
            <span className="stat-sub">Registered with Link</span>
          </div>

          <div className="aff-stat-card">
            <div className="stat-header">
              <span className="stat-label">Active Depositors</span>
              <i className="fa-solid fa-wallet stat-icon blue"></i>
            </div>
            <div className="stat-val blue">{activeDepositors}</div>
            <span className="stat-sub">Completed 1st Deposit</span>
          </div>

          <div className="aff-stat-card">
            <div className="stat-header">
              <span className="stat-label">Total Earned</span>
              <i className="fa-solid fa-coins stat-icon gold"></i>
            </div>
            <div className="stat-val gold">+{totalEarned.toFixed(2)} ETB</div>
            <span className="stat-sub">10% Deposit Share</span>
          </div>

          <div className="aff-stat-card">
            <div className="stat-header">
              <span className="stat-label">Bonus Balance</span>
              <i className="fa-solid fa-gift stat-icon green"></i>
            </div>
            <div className="stat-val green">{bonus.toFixed(2)} ETB</div>
            <span className="stat-sub">Playable in Bingo</span>
          </div>
        </div>

        {/* 4. How It Works (3 Steps Visual Guide) */}
        <div className="how-it-works-card">
          <div className="hiw-header">
            <i className="fa-solid fa-circle-question" style={{ color: '#c4b5fd' }}></i>
            <h3>How Referral Rewards Work</h3>
          </div>

          <div className="hiw-steps-grid">
            <div className="hiw-step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Share Your Invite Link</strong>
                <p>Send your link or code to friends on Telegram, WhatsApp, or social media.</p>
              </div>
            </div>

            <div className="hiw-step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Friend Signs Up & Deposits</strong>
                <p>Friend receives 10 ETB free registration bonus and makes their first deposit.</p>
              </div>
            </div>

            <div className="hiw-step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <strong>Instant 10% Cash Reward</strong>
                <p>You automatically receive 10% of their first deposit into your bonus wallet.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Referred Friends Activity Ledger */}
        <div className="referral-ledger-card">
          <div className="ledger-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-list-check" style={{ color: '#4ade80' }}></i>
              <h3>Referred Friends & Payout Status</h3>
            </div>
            <span className="ledger-count-tag">{friendsList.length} Total</span>
          </div>

          <div className="ledger-list">
            {friendsList.map(friend => (
              <div key={friend.id} className="ledger-item">
                <div className="friend-avatar-wrap">
                  <span>{friend.avatar}</span>
                </div>

                <div className="friend-info">
                  <span className="friend-name">{friend.name}</span>
                  <span className="friend-joined">Joined: {friend.joinedAt}</span>
                </div>

                <div className="friend-deposit-col">
                  <span className="first-dep-lbl">1st Deposit</span>
                  <span className="first-dep-val">
                    {friend.firstDeposit > 0 ? `${friend.firstDeposit} ETB` : 'No Deposit'}
                  </span>
                </div>

                <div className="friend-reward-col">
                  {friend.status === 'paid' ? (
                    <div className="reward-paid-box">
                      <span className="reward-amt">+{friend.bonusEarned.toFixed(2)} ETB</span>
                      <span className="reward-status-tag paid">✓ 10% Paid</span>
                    </div>
                  ) : (
                    <div className="reward-pending-box">
                      <span className="reward-status-tag pending">⏳ Awaiting Deposit</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
