import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useWallet } from '../../context/WalletContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface StakeRoomSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStake?: (stake: number) => void;
}

export const StakeRoomSelectorModal: React.FC<StakeRoomSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectStake
}) => {
  const { setBetAmount, startLobbyCountdown, stakeRoomsSummary, betAmount } = useBingo();
  const { switchPage } = useApp();
  const { balance, bonus, isBalanceVisible } = useWallet();
  const { t, lang } = useLanguage();

  if (!isOpen) return null;

  const rooms = [
    {
      stake: 10,
      tier: 'STARTER',
      tag: 'POPULAR',
      tagColor: '#16a34a',
      title: lang === 'am' ? 'ጀማሪ ክፍል' : 'Starter Room',
      minStake: '10 ETB',
      maxPayout: '450 ETB',
      icon: '🪙',
      badgeClass: 'badge-bronze',
      desc: lang === 'am' ? 'ዝቅተኛ ስጋት፣ ፈጣን ጨዋታ' : 'Low risk, fast rounds'
    },
    {
      stake: 20,
      tier: 'EXPRESS',
      tag: 'HOT',
      tagColor: '#ea580c',
      title: lang === 'am' ? 'ፈጣን ክፍል' : 'Express Room',
      minStake: '20 ETB',
      maxPayout: '900 ETB',
      icon: '⚡',
      badgeClass: 'badge-silver',
      desc: lang === 'am' ? '2 እጥፍ ትርፍ፣ ከፍተኛ ውድድር' : '2x pot payout'
    },
    {
      stake: 50,
      tier: 'HIGH ROLLER',
      tag: 'GOLD',
      tagColor: '#ca8a04',
      title: lang === 'am' ? 'ወርቃማ ክፍል' : 'Gold Arena',
      minStake: '50 ETB',
      maxPayout: '2,250 ETB',
      icon: '🏆',
      badgeClass: 'badge-gold',
      desc: lang === 'am' ? 'ትልቅ ሽልማት፣ ከፍተኛ ትርፍ' : 'Huge prize pools'
    },
    {
      stake: 100,
      tier: 'VIP CHAMPION',
      tag: 'VIP',
      tagColor: '#9333ea',
      title: lang === 'am' ? 'ቪአይፒ ሻምፒዮን' : 'VIP Championship',
      minStake: '100 ETB',
      maxPayout: '4,500 ETB',
      icon: '👑',
      badgeClass: 'badge-vip',
      desc: lang === 'am' ? 'ከፍተኛው የ4,500 ብር ሽልማት' : 'Max 4,500 ETB jackpot'
    }
  ];

  const handleSelectRoom = (stake: number) => {
    setBetAmount(stake);
    if (onSelectStake) {
      onSelectStake(stake);
    } else {
      switchPage('bingo');
      startLobbyCountdown();
    }
    onClose();
  };

  const totalBalance = balance + bonus;

  return (
    <div className="stake-modal-backdrop" onClick={onClose}>
      <div className="stake-modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header Strip */}
        <div className="stake-modal-hdr">
          <div className="stake-modal-hdr-text">
            <h3 className="stake-modal-title">
              {lang === 'am' ? 'የቢንጎ ክፍል ይምረጡ' : 'Select Bingo Arena'}
            </h3>
            <p className="stake-modal-sub">
              {lang === 'am' ? 'የሚፈልጉትን የውርርድ መጠን ይምረጡ' : 'Choose your preferred stake room'}
            </p>
          </div>
          <button type="button" className="btn-close-stake-modal" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* User Balance Bar */}
        <div className="stake-modal-wallet-bar">
          <div className="wallet-bar-left">
            <i className="fa-solid fa-wallet"></i>
            <span className="wallet-bar-lbl">{lang === 'am' ? 'ቀሪ ሂሳብ:' : 'Your Balance:'}</span>
          </div>
          <strong className="wallet-bar-val">
            {isBalanceVisible ? `${totalBalance.toFixed(0)} ETB` : '••••'}
          </strong>
        </div>

        {/* 4 Stake Rooms Grid */}
        <div className="stake-rooms-grid">
          {rooms.map(r => {
            const liveCount = stakeRoomsSummary[r.stake] || 0;
            const isSelected = betAmount === r.stake;

            return (
              <div
                key={r.stake}
                className={`stake-room-card ${isSelected ? 'active-room' : ''}`}
                onClick={() => handleSelectRoom(r.stake)}
              >
                <div className="room-card-top-row">
                  <span className="room-stake-pill" style={{ borderColor: r.tagColor, color: r.tagColor }}>
                    {r.tag}
                  </span>
                  <div className="room-live-pill" title={`${liveCount} active players`}>
                    <span className={`live-dot ${liveCount >= 2 ? 'green' : 'yellow'}`}></span>
                    <span>{liveCount} {lang === 'am' ? 'ተጫዋቾች' : 'Live'}</span>
                  </div>
                </div>

                <div className="room-main-stake-row">
                  <span className="room-icon">{r.icon}</span>
                  <div className="room-stake-values">
                    <strong className="room-stake-amount">{r.minStake}</strong>
                    <span className="room-stake-tier">{r.title}</span>
                  </div>
                </div>

                <div className="room-footer-row">
                  <span className="room-payout-label">{lang === 'am' ? 'እስከ' : 'Up to'} <strong>{r.maxPayout}</strong></span>
                  <span className="room-enter-cta">
                    {isSelected ? (
                      <span className="room-current-tag">{lang === 'am' ? '✓ አሁን ያለዎት' : '✓ CURRENT'}</span>
                    ) : (
                      <>
                        <span>{lang === 'am' ? 'ይግቡ' : 'ENTER'}</span>
                        <i className="fa-solid fa-chevron-right"></i>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
