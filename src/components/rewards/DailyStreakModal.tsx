import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWallet } from '../../context/WalletContext';
import { useApp } from '../../context/AppContext';
import { telegramService } from '../../services/telegramService';

interface DailyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useLanguage();
  const { addBonus } = useWallet();
  const { showToast } = useApp();

  const [currentStreakDay, setCurrentStreakDay] = useState(1);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);

  const streakDays = [
    { day: 1, reward: '10 ETB', rewardNum: 10, icon: '🎁', desc: lang === 'am' ? 'የመጀመሪያ ቀን' : 'Welcome Pack' },
    { day: 2, reward: '2 ETB', rewardNum: 2, icon: '💰', desc: lang === 'am' ? 'ቀን 2 ቦነስ' : 'Daily Coin' },
    { day: 3, reward: '1 Cartela', rewardNum: 3, icon: '🎟️', desc: lang === 'am' ? 'ነፃ ካርቴላ' : 'Free Ticket' },
    { day: 4, reward: '4 ETB', rewardNum: 4, icon: '⚡', desc: lang === 'am' ? 'ቀን 4 ቦነስ' : 'Energy Bonus' },
    { day: 5, reward: '5 ETB', rewardNum: 5, icon: '💎', desc: lang === 'am' ? 'ቀን 5 ጀሞች' : 'Ruby Gift' },
    { day: 6, reward: '7 ETB', rewardNum: 7, icon: '🔥', desc: lang === 'am' ? 'ቀን 6 ሱፐር' : 'Super Streak' },
    { day: 7, reward: '25 ETB', rewardNum: 25, icon: '🏆', desc: lang === 'am' ? 'ጃክፖት ፓስ' : 'Mega Jackpot' }
  ];

  useEffect(() => {
    try {
      const savedDay = parseInt(localStorage.getItem('lomi_streak_current_day') || '1', 10);
      const lastClaimDate = localStorage.getItem('lomi_streak_last_claim');
      const todayStr = new Date().toDateString();

      setCurrentStreakDay(savedDay);
      setHasClaimedToday(lastClaimDate === todayStr);
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimToday = () => {
    telegramService.triggerHaptic('success');
    const todayReward = streakDays.find(d => d.day === currentStreakDay) || streakDays[0];
    
    addBonus(todayReward.rewardNum);
    localStorage.setItem('lomi_streak_last_claim', new Date().toDateString());
    
    const nextDay = currentStreakDay >= 7 ? 1 : currentStreakDay + 1;
    localStorage.setItem('lomi_streak_current_day', nextDay.toString());
    setCurrentStreakDay(nextDay);
    setHasClaimedToday(true);

    showToast(
      lang === 'am'
        ? `🎉 የቀን ${todayReward.day} ቦነስ +${todayReward.reward} ተቀብለዋል!`
        : `🎉 Day ${todayReward.day} Streak Bonus +${todayReward.reward} Claimed!`
    );
  };

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-backdrop" onClick={onClose}></div>
      <div
        className="otp-modal-card daily-streak-card"
        style={{
          maxWidth: '420px',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '28px',
          padding: '24px 18px',
          border: '1.5px solid rgba(250, 204, 21, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(234, 179, 8, 0.25)',
          textAlign: 'center'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          className="btn-otp-modal-close"
          onClick={onClose}
          title="Close"
          style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Fire Streak Mascot */}
        <div style={{ fontSize: '44px', marginBottom: '8px' }}>🔥</div>

        <h3 style={{ fontSize: '21px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
          {lang === 'am' ? 'የየዕለቱ የገቢ ቦነስ' : 'Daily Streak Calendar'}
        </h3>
        <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px 0' }}>
          {lang === 'am'
            ? 'በየቀኑ በመግባት ነፃ የቢንጎ ቦነስ እና የጃክፖት ትኬቶችን ያግኙ!'
            : 'Log in every day without breaking your streak to claim up to 25 ETB!'}
        </p>

        {/* 7 Days Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '18px' }}>
          {streakDays.map((s) => {
            const isCompleted = s.day < currentStreakDay || (s.day === currentStreakDay && hasClaimedToday);
            const isToday = s.day === currentStreakDay && !hasClaimedToday;
            const isFuture = s.day > currentStreakDay;

            return (
              <div
                key={s.day}
                style={{
                  gridColumn: s.day === 7 ? 'span 2' : 'auto',
                  background: isToday
                    ? 'linear-gradient(135deg, rgba(250, 204, 21, 0.25) 0%, rgba(202, 138, 4, 0.3) 100%)'
                    : isCompleted
                    ? 'rgba(34, 197, 94, 0.12)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isToday
                    ? '1.5px solid #facc15'
                    : isCompleted
                    ? '1px solid #22c55e'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '10px 6px',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: isToday ? '#fde047' : isCompleted ? '#86efac' : '#94a3b8' }}>
                  {lang === 'am' ? `ቀን ${s.day}` : `Day ${s.day}`}
                </div>
                <div style={{ fontSize: '20px', margin: '4px 0' }}>{s.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: isToday ? '#facc15' : '#ffffff' }}>
                  +{s.reward}
                </div>
                {isCompleted && (
                  <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: '800' }}>✓ CLAIMED</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Action Button */}
        <button
          type="button"
          onClick={handleClaimToday}
          disabled={hasClaimedToday}
          style={{
            width: '100%',
            background: hasClaimedToday
              ? 'rgba(255, 255, 255, 0.1)'
              : 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
            color: hasClaimedToday ? '#94a3b8' : '#0f172a',
            fontSize: '15px',
            fontWeight: '900',
            border: 'none',
            borderRadius: '999px',
            padding: '13px',
            cursor: hasClaimedToday ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: hasClaimedToday ? 'none' : '0 6px 20px rgba(234, 179, 8, 0.45)',
            textTransform: 'uppercase'
          }}
        >
          {hasClaimedToday ? (
            <span>
              <i className="fa-solid fa-check"></i>{' '}
              {lang === 'am' ? 'ዛሬ ተቀብለዋል • ነገ ይመለሱ' : 'Claimed Today • Come Back Tomorrow'}
            </span>
          ) : (
            <span>
              <i className="fa-solid fa-gift"></i>{' '}
              {lang === 'am' ? 'የዛሬን ቦነስ ተቀበል' : 'CLAIM TODAY BONUS'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
