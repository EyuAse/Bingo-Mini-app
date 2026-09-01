import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
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
  const { lang } = useLanguage();

  const referralCode = user?.id ? user.id.replace(/^UID-TG-/, 'LOMI-') : 'LOMI-7842';
  const referralLink = `https://t.me/LomiBingobot/play?startapp=ref_${referralCode}`;

  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleInviteTelegramFriends = () => {
    telegramService.triggerHaptic('medium');
    const shareText = encodeURIComponent(
      `🍋 Join me on Lomi Bingo! Get 10 ETB Free Welcome Bonus to play live 75-Ball Express Bingo with instant Telebirr payouts! 🎁💰\n\nPlay here:`
    );
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`;
    telegramService.openTelegramLink(shareUrl);
  };

  return (
    <div className="page active page-affiliate-fresh" id="page-affiliate" style={{ background: '#fffdf8', minHeight: '100dvh' }}>
      {/* 1. Top Navigation Bar */}
      <div
        className="affiliate-top-navbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
        }}
      >
        <button
          type="button"
          className="btn-affiliate-back"
          onClick={() => switchPage('games')}
          style={{ color: '#0f172a', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>{lang === 'am' ? 'ጨዋታዎች' : 'Games'}</span>
        </button>

        <h2 className="affiliate-page-title" style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
          {lang === 'am' ? '🎁 ሽልማቶችና ግብዣ' : '🎁 Rewards & Invites'}
        </h2>

        <div style={{ width: '32px' }}></div>
      </div>

      {/* Main Content Scroll */}
      <div
        className="affiliate-content-scroll"
        style={{
          padding: '14px 14px 28px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxWidth: '430px',
          margin: '0 auto'
        }}
      >
        {/* 2. Top Hero Card: Warm Creamy Lemon Background with 3D Treasure Chest */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 60%, #fde047 100%)',
            border: '1.5px solid #facc15',
            borderRadius: '24px',
            padding: '18px 16px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(234, 179, 8, 0.18)'
          }}
        >
          {/* Top Tag: TELEGRAM VIRAL REWARDS */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #ca8a04',
              borderRadius: '999px',
              padding: '3px 12px',
              fontSize: '10.5px',
              fontWeight: '800',
              color: '#854d0e',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '10px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <i className="fa-solid fa-users"></i>
            <span>TELEGRAM VIRAL REWARDS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {/* Left Texts */}
            <div style={{ flex: 1, zIndex: 2 }}>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  color: '#0f172a',
                  margin: '0 0 6px 0',
                  lineHeight: '1.2',
                  letterSpacing: '-0.3px'
                }}
              >
                {lang === 'am' ? 'ጓደኞችን ይጋብዙና ' : 'Invite Friends & '}
                <span style={{ color: '#16a34a' }}>{lang === 'am' ? 'ብር ያግኙ!' : 'Earn ETB!'}</span>
              </h1>

              <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: '1.4', fontWeight: '500' }}>
                {lang === 'am'
                  ? 'ለእያንዳንዱ የሚጋብዙት ጓደኛ ነፃ ቦነስ ያግኙ፤ እንዲሁም '
                  : 'Earn free ETB bonus for every friend who joins, plus '}
                <span style={{ color: '#854d0e', fontWeight: '800' }}>
                  {lang === 'am' ? '10% የዕድሜ ልክ ኮሚሽን!' : '10% lifetime commission on all wins!'}
                </span>
              </p>
            </div>

            {/* Right: 3D Royal Treasure Chest Graphic (Transparent PNG) */}
            <div
              style={{
                width: '100px',
                height: '100px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 8px 16px rgba(202, 138, 4, 0.35))'
              }}
            >
              <img
                src="/assets/images/lomi_rewards_chest_etb.png"
                alt="3D ETB Royal Treasure Chest"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>

        {/* 3. Big Glowing 1-Click Telegram Invite Button */}
        <button
          type="button"
          onClick={handleInviteTelegramFriends}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 50%, #0284c7 100%)',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '900',
            border: 'none',
            borderRadius: '999px',
            padding: '14px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 25px rgba(34, 158, 217, 0.4)',
            letterSpacing: '0.2px',
            transition: 'all 0.15s ease'
          }}
        >
          {/* Left Telegram Plane Icon in White Circle */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ffffff',
              color: '#2AABEE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              flexShrink: 0
            }}
          >
            <i className="fa-brands fa-telegram"></i>
          </div>

          {/* Center Text */}
          <span style={{ fontSize: '15.5px', fontWeight: '900' }}>
            👥 {lang === 'am' ? 'ጓደኞችን በቴሌግራም ይጋብዙ' : 'Invite Telegram Friends'}
          </span>

          {/* Right Bonus Pill Badge */}
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '900',
              flexShrink: 0
            }}
          >
            +5 ETB
          </span>
        </button>

        {/* 4. Exact "YOUR INVITE LINK" Box with Copy Button */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '12px 14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: '800',
              color: '#64748b',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              textAlign: 'left'
            }}
          >
            {lang === 'am' ? 'የእርስዎ የግብዣ ሊንክ' : 'YOUR INVITE LINK'}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '4px 6px 4px 12px',
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-link" style={{ color: '#0284c7', fontSize: '13px' }}></i>
            <span
              style={{
                flex: 1,
                fontSize: '12px',
                color: '#0f172a',
                fontWeight: '600',
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
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
              }}
            >
              <i className={`fa-solid ${copiedLink ? 'fa-check' : 'fa-copy'}`}></i>
              <span>{copiedLink ? (lang === 'am' ? 'ተቀድቷል' : 'Copied') : (lang === 'am' ? 'ቅዳ' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* 5. Exact Tiered Cards (Regular Friend vs Telegram Premium) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Card 1: Regular Friend (Clean White Card) */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              padding: '16px 12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
            }}
          >
            {/* Purple Avatar Circle */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366f1',
                fontSize: '18px',
                marginBottom: '2px'
              }}
            >
              <i className="fa-solid fa-user"></i>
            </div>

            <strong style={{ fontSize: '13px', color: '#0f172a', fontWeight: '800' }}>
              {lang === 'am' ? 'መደበኛ ተጠቃሚ' : 'Regular Friend'}
            </strong>

            <div style={{ fontSize: '20px', fontWeight: '900', color: '#16a34a', letterSpacing: '-0.3px' }}>
              +5.00 ETB
            </div>

            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {lang === 'am' ? 'ለእያንዳንዱ ምዝገባ' : 'Per registration'}
            </span>
          </div>

          {/* Card 2: Telegram Premium (Creamy Gold Card With BEST VALUE Ribbon) */}
          <div
            style={{
              background: 'linear-gradient(180deg, #fefce8 0%, #fef9c3 100%)',
              border: '1.5px solid #facc15',
              borderRadius: '20px',
              padding: '16px 12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.15)'
            }}
          >
            {/* BEST VALUE Ribbon Tag */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '-24px',
                transform: 'rotate(45deg)',
                background: '#ca8a04',
                color: '#ffffff',
                fontSize: '8px',
                fontWeight: '900',
                padding: '2px 24px',
                letterSpacing: '0.6px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
              }}
            >
              BEST VALUE
            </div>

            {/* Glowing Golden Star Circle */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#713f12',
                fontSize: '20px',
                marginBottom: '2px',
                boxShadow: '0 2px 8px rgba(234, 179, 8, 0.35)'
              }}
            >
              ★
            </div>

            <strong style={{ fontSize: '13px', color: '#713f12', fontWeight: '800' }}>
              {lang === 'am' ? 'ቴሌግራም ፕሪሚየም' : 'Telegram Premium'}
            </strong>

            <div style={{ fontSize: '20px', fontWeight: '900', color: '#ca8a04', letterSpacing: '-0.3px' }}>
              +20.00 ETB
            </div>

            <span style={{ fontSize: '11px', color: '#854d0e', fontWeight: '600' }}>
              {lang === 'am' ? 'ፕሪሚየም ላለው ተጠቃሚ' : 'For Premium users'}
            </span>
          </div>
        </div>

        {/* 6. Exact Analytics KPI Cards (Clean White Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Friends Invited */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#fef9c3',
                color: '#ca8a04',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-users"></i>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                {totalInvited}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                {lang === 'am' ? 'የተጋበዙ ጓደኞች' : 'Friends Invited'}
              </div>
            </div>
          </div>

          {/* Bonus Earned */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ecfdf5',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-gift"></i>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a' }}>
                {totalEarned}.00 ETB
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                {lang === 'am' ? 'የተገኘ ቦነስ' : 'Bonus Earned'}
              </div>
            </div>
          </div>
        </div>

        {/* 7. Exact Bottom Trust Strip (Clean Pill) */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '999px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '11.5px',
            color: '#64748b',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
          }}
        >
          <span style={{ color: '#16a34a' }}>
            <i className="fa-solid fa-shield-halved"></i>
          </span>
          <span>
            {lang === 'am'
              ? 'ቦነስ ወዲያውኑ ገቢ ይሆናል • 100% አስተማማኝ • ምንም ክፍያ የለም'
              : 'Bonus is credited instantly • 100% Secure • No hidden fees'}
          </span>
        </div>
      </div>
    </div>
  );
};
