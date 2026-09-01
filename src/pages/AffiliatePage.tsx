import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { telegramService } from '../services/telegramService.ts';

interface ReferredFriend {
  id: string;
  name: string;
  avatar: string;
  isPremium?: boolean;
  joinedAt: string;
  bonusEarned: number;
  status: 'paid' | 'pending_deposit';
}

export const AffiliatePage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { user } = useAuth();
  const { bonus } = useWallet();
  const { t, lang } = useLanguage();

  const referralCode = user?.id ? user.id.replace(/^UID-TG-/, 'LOMI-') : 'LOMI-7842';
  const referralLink = `https://t.me/LomiBingobot/play?startapp=ref_${referralCode}`;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const friendsList: ReferredFriend[] = [
    {
      id: 'f-1',
      name: 'Sami_Lucky',
      avatar: '👑',
      isPremium: true,
      joinedAt: '2 hours ago',
      bonusEarned: 20,
      status: 'paid'
    },
    {
      id: 'f-2',
      name: 'Eden_Rose',
      avatar: '💎',
      isPremium: false,
      joinedAt: 'Yesterday',
      bonusEarned: 5,
      status: 'paid'
    },
    {
      id: 'f-3',
      name: 'Nati_Boss',
      avatar: '⚡',
      isPremium: false,
      joinedAt: '2 days ago',
      bonusEarned: 5,
      status: 'paid'
    },
    {
      id: 'f-4',
      name: 'Dani_Addis',
      avatar: '🎯',
      isPremium: true,
      joinedAt: '3 days ago',
      bonusEarned: 20,
      status: 'paid'
    }
  ];

  const totalInvited = friendsList.length;
  const totalEarned = friendsList.reduce((acc, f) => acc + f.bonusEarned, 0);

  const handleCopyLink = () => {
    telegramService.triggerHaptic('light');
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast(
      lang === 'am'
        ? '📋 የግብዣ ሊንክ ተቀድቷል! ለጓደኞችዎ ያጋሩ።'
        : '📋 Referral link copied to clipboard!'
    );
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    telegramService.triggerHaptic('light');
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showToast(`📋 Code ${referralCode} copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInviteTelegramFriends = () => {
    telegramService.triggerHaptic('medium');
    const shareText = encodeURIComponent(
      `🍋 Join me on Lomi Bingo! Get 10 ETB Free Welcome Bonus to play live 75-Ball Express Bingo with instant Telebirr payouts! 🎁💰\n\nPlay here:`
    );
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`;
    
    // Open native Telegram share dialog
    telegramService.openTelegramLink(shareUrl);
  };

  const handleShareWhatsApp = () => {
    telegramService.triggerHaptic('light');
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
          onClick={() => switchPage('games')}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>{lang === 'am' ? 'ጨዋታዎች' : 'Games'}</span>
        </button>
        <h2 className="affiliate-page-title">
          {lang === 'am' ? '🎁 ሽልማቶችና ግብዣ' : '🎁 Rewards & Invites'}
        </h2>
      </div>

      <div className="affiliate-content-scroll">
        {/* 2. Hero Value Proposition Banner */}
        <div
          className="affiliate-hero-banner"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
            border: '1.5px solid rgba(250, 204, 21, 0.35)',
            borderRadius: '24px',
            padding: '22px 18px',
            textAlign: 'center',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(250, 204, 21, 0.15)',
              border: '1px solid #facc15',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#fde047',
              letterSpacing: '0.8px',
              marginBottom: '10px'
            }}
          >
            <i className="fa-solid fa-users"></i>
            <span>TELEGRAM VIRAL REWARDS</span>
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
            {lang === 'am' ? 'ጓደኞችዎን ይጋብዙ • ገንዘብ ያግኙ!' : 'Invite Friends & Earn ETB!'}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            {lang === 'am'
              ? 'ለእያንዳንዱ የሚጋብዙት ጓደኛ ነፃ ቦነስ ያግኙ፤ እንዲሁም 10% የዕድሜ ልክ ኮሚሽን!'
              : 'Earn free ETB bonus for every friend who joins, plus 10% lifetime commission on all wins!'}
          </p>

          {/* Big Glowing 1-Click Telegram Invite Button (Notcoin / Hamster Style) */}
          <button
            type="button"
            onClick={handleInviteTelegramFriends}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 50%, #0284c7 100%)',
              color: '#ffffff',
              fontSize: '15.5px',
              fontWeight: '900',
              border: 'none',
              borderRadius: '999px',
              padding: '14px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 6px 20px rgba(34, 158, 217, 0.45)',
              letterSpacing: '-0.2px',
              marginBottom: '14px',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-brands fa-telegram" style={{ fontSize: '20px' }}></i>
            <span>
              {lang === 'am'
                ? '👥 ጓደኞችን በቴሌግራም ይጋብዙ'
                : '👥 Invite Telegram Friends'}
            </span>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '800'
              }}
            >
              +5 ETB
            </span>
          </button>

          {/* Copy Link Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              padding: '4px 6px 4px 14px',
              gap: '8px'
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: '12px',
                color: '#cbd5e1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'left',
                fontFamily: 'monospace'
              }}
            >
              {referralLink}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: copiedLink ? '#22c55e' : '#facc15',
                color: '#0f172a',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              <i className={`fa-solid ${copiedLink ? 'fa-check' : 'fa-copy'}`}></i>
              <span>{copiedLink ? (lang === 'am' ? 'ተቀድቷል' : 'Copied') : (lang === 'am' ? 'ቅዳ' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* 3. Telegram Referral Reward Tiers (Hamster / Notcoin Style) */}
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Regular Friend */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '14px 12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>👤</div>
            <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '2px' }}>
              {lang === 'am' ? 'መደበኛ ተጠቃሚ' : 'Regular Friend'}
            </strong>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a' }}>+5.00 ETB</div>
            <span style={{ fontSize: '10.5px', color: '#64748b' }}>
              {lang === 'am' ? 'ለእያንዳንዱ ምዝገባ' : 'Per registration'}
            </span>
          </div>

          {/* Telegram Premium Friend */}
          <div
            style={{
              background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
              border: '1.5px solid #facc15',
              borderRadius: '16px',
              padding: '14px 12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(234, 179, 8, 0.15)'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>⭐️</div>
            <strong style={{ display: 'block', fontSize: '13px', color: '#713f12', marginBottom: '2px' }}>
              {lang === 'am' ? 'ቴሌግራም ፕሪሚየም' : 'Telegram Premium'}
            </strong>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#ca8a04' }}>+20.00 ETB</div>
            <span style={{ fontSize: '10.5px', color: '#854d0e' }}>
              {lang === 'am' ? 'ፕሪሚየም ላለው ተጠቃሚ' : 'For Premium users'}
            </span>
          </div>
        </div>

        {/* 4. Analytics Barometer Grid */}
        <div className="affiliate-analytics-grid" style={{ marginTop: '16px' }}>
          <div className="analytics-kpi-card">
            <div className="kpi-icon-circ yellow">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="kpi-meta-text">
              <strong className="kpi-val">{totalInvited}</strong>
              <span className="kpi-lbl">{lang === 'am' ? 'የተጋበዙ ጓደኞች' : 'Friends Invited'}</span>
            </div>
          </div>

          <div className="analytics-kpi-card">
            <div className="kpi-icon-circ green">
              <i className="fa-solid fa-gift"></i>
            </div>
            <div className="kpi-meta-text">
              <strong className="kpi-val">{totalEarned}.00 ETB</strong>
              <span className="kpi-lbl">{lang === 'am' ? 'የተገኘ ቦነስ' : 'Bonus Earned'}</span>
            </div>
          </div>
        </div>

        {/* 5. Referred Friends Activity List */}
        <div className="affiliate-friends-list-card" style={{ marginTop: '16px' }}>
          <div className="friends-list-header">
            <h3 className="friends-list-title">
              <i className="fa-solid fa-list-check"></i>
              <span>{lang === 'am' ? 'የተጋበዙ ጓደኞች ዝርዝር' : 'Invited Friends List'}</span>
            </h3>
            <span className="friends-count-pill">{friendsList.length}</span>
          </div>

          <div className="friends-items-scroll">
            {friendsList.map(f => (
              <div key={f.id} className="friend-row-item">
                <div className="friend-avatar-bubble">
                  <span>{f.avatar}</span>
                </div>
                <div className="friend-info-col">
                  <strong className="friend-name-txt">
                    @{f.name} {f.isPremium && <span style={{ color: '#eab308' }}>⭐️</span>}
                  </strong>
                  <span className="friend-joined-time">{f.joinedAt}</span>
                </div>
                <div className="friend-deposit-col">
                  <span className="friend-bonus-badge">
                    +{f.bonusEarned}.00 ETB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
