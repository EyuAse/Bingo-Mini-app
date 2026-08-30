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
      `🍋 Join me on Lomi Bingo! Get 10 ETB free registration bonus and win big with 75-ball express: ${referralLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🍋 Join me on Lomi Bingo! Get 10 ETB free registration bonus: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="page active page-affiliate-fresh" id="page-affiliate">
      {/* 1. Top Navigation Bar */}
      <div className="affiliate-top-navbar">
        <button
          type="button"
          className="btn-affiliate-back"
          onClick={() => switchPage('wallet')}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back to Wallet</span>
        </button>
        <h2 className="affiliate-page-title">Affiliate & Rewards</h2>
      </div>

      <div className="affiliate-content-scroll">
        {/* 2. Hero Value Proposition Banner */}
        <div className="affiliate-hero-banner">
          <div className="hero-banner-decor-glow"></div>
          <div className="hero-banner-tag">
            <i className="fa-solid fa-gift"></i>
            <span>10% REFERRAL BONUS PROGRAM</span>
          </div>

          <h1 className="hero-banner-heading">
            Invite Friends & Earn 10% On Every First Deposit!
          </h1>
          <p className="hero-banner-sub">
            When your invited friend registers and makes their first deposit, you instantly receive <strong>10% of their deposit amount</strong> credited directly into your bonus balance.
          </p>
        </div>

        {/* 3. Referral Link & Code Sharing Box */}
        <div className="affiliate-share-box-card">
          {/* Link Section */}
          <div className="share-field-group">
            <label className="share-field-lbl">
              <i className="fa-solid fa-link"></i> Your Exclusive Referral Link
            </label>
            <div className="share-input-pill">
              <input type="text" readOnly value={referralLink} />
              <button
                type="button"
                className={`btn-copy-action ${copiedLink ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                <i className={`fa-solid ${copiedLink ? 'fa-check' : 'fa-copy'}`}></i>
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Code Section */}
          <div className="share-field-group">
            <label className="share-field-lbl">
              <i className="fa-solid fa-ticket"></i> Referral Code
            </label>
            <div className="share-input-pill">
              <span className="ref-code-bold">{referralCode}</span>
              <button
                type="button"
                className={`btn-copy-action ${copiedCode ? 'copied' : ''}`}
                onClick={handleCopyCode}
              >
                <i className={`fa-solid ${copiedCode ? 'fa-check' : 'fa-copy'}`}></i>
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="social-share-actions-row">
            <button
              type="button"
              className="btn-share-social telegram"
              onClick={handleShareTelegram}
            >
              <i className="fa-brands fa-telegram"></i>
              <span>Share via Telegram</span>
            </button>

            <button
              type="button"
              className="btn-share-social whatsapp"
              onClick={handleShareWhatsApp}
            >
              <i className="fa-brands fa-whatsapp"></i>
              <span>Share via WhatsApp</span>
            </button>
          </div>
        </div>

        {/* 4. Analytics Barometer Grid */}
        <div className="affiliate-analytics-grid">
          <div className="analytics-kpi-card">
            <div className="kpi-icon-circ yellow">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="kpi-meta-text">
              <strong className="kpi-val">{totalInvited}</strong>
              <span className="kpi-lbl">Friends Invited</span>
              <span className="kpi-sub">Registered with Link</span>
            </div>
          </div>

          <div className="analytics-kpi-card">
            <div className="kpi-icon-circ green">
              <i className="fa-solid fa-money-bill-wave"></i>
            </div>
            <div className="kpi-meta-text">
              <strong className="kpi-val">{activeDepositors}</strong>
              <span className="kpi-lbl">Active Depositors</span>
              <span className="kpi-sub">Completed 1st Deposit</span>
            </div>
          </div>

          <div className="analytics-kpi-card">
            <div className="kpi-icon-circ gold">
              <i className="fa-solid fa-sack-dollar"></i>
            </div>
            <div className="kpi-meta-text">
              <strong className="kpi-val gold">{totalEarned.toFixed(2)} ETB</strong>
              <span className="kpi-lbl">Total Earned</span>
              <span className="kpi-sub">10% Bonus Credited</span>
            </div>
          </div>

          <div className="analytics-kpi-card">
            <div className="kpi-icon-circ purple">
              <i className="fa-solid fa-gift"></i>
            </div>
            <div className="kpi-meta-text">
              <strong className="kpi-val">{bonus.toFixed(2)} ETB</strong>
              <span className="kpi-lbl">Bonus Balance</span>
              <span className="kpi-sub">Available in Wallet</span>
            </div>
          </div>
        </div>

        {/* 5. 3-Step "How It Works" Card */}
        <div className="affiliate-how-it-works-card">
          <h3 className="how-title-bold">How 10% Referral Works</h3>

          <div className="how-steps-list">
            <div className="how-step-item">
              <div className="step-num-circ">1</div>
              <div className="step-content">
                <strong>Share Your Invite Link</strong>
                <span>Send your link or code to friends on Telegram, WhatsApp, or SMS.</span>
              </div>
            </div>

            <div className="how-step-item">
              <div className="step-num-circ">2</div>
              <div className="step-content">
                <strong>Friend Deposits Min 50 ETB</strong>
                <span>Your friend signs up and completes their first verified deposit.</span>
              </div>
            </div>

            <div className="how-step-item">
              <div className="step-num-circ">3</div>
              <div className="step-content">
                <strong>Get Instant 10% Bonus</strong>
                <span>10% of their deposit is immediately added to your bonus wallet balance.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Referred Friends Activity Ledger */}
        <div className="affiliate-friends-ledger-card">
          <div className="ledger-header-row">
            <h3 className="ledger-title-bold">Referred Friends ({friendsList.length})</h3>
            <span className="ledger-reward-tag">10% Auto-Credit</span>
          </div>

          <div className="ledger-friends-list">
            {friendsList.map(friend => {
              const isPaid = friend.status === 'paid';
              return (
                <div key={friend.id} className="ledger-friend-item">
                  <div className="friend-avatar-circ">{friend.avatar}</div>
                  <div className="friend-info-col">
                    <strong className="friend-name">{friend.name}</strong>
                    <span className="friend-joined">{friend.joinedAt}</span>
                  </div>

                  <div className="friend-reward-col">
                    {isPaid ? (
                      <>
                        <span className="friend-bonus-earned">+{friend.bonusEarned}.00 ETB</span>
                        <span className="friend-deposit-sub">1st Dep: {friend.firstDeposit} ETB</span>
                      </>
                    ) : (
                      <span className="friend-status-pending">
                        <i className="fa-regular fa-clock"></i> No Deposit Yet
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
