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

  // Day 1 is always claimed upon signup (+10 ETB Welcome Pack)
  const [currentStreakDay, setCurrentStreakDay] = useState(2);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);

  const streakDays = [
    { day: 1, reward: '+10 ETB', rewardNum: 10, icon: '🎁', desc: 'Welcome Bonus' },
    { day: 2, reward: '+2 ETB', rewardNum: 2, icon: '💰', desc: 'Daily Bonus' },
    { day: 3, reward: '+1 Cartela', rewardNum: 3, icon: '🎟️', desc: 'Free Ticket' },
    { day: 4, reward: '+4 ETB', rewardNum: 4, icon: '⚡', desc: 'Lightning Bonus' },
    { day: 5, reward: '+5 ETB', rewardNum: 5, icon: '💎', desc: 'Ruby Gift' },
    { day: 6, reward: '+7 ETB', rewardNum: 6, icon: '🔥', desc: 'Super Streak' },
    { day: 7, reward: '+25 ETB', rewardNum: 25, icon: '🏆', desc: 'Mega Jackpot' }
  ];

  useEffect(() => {
    try {
      const savedDay = parseInt(localStorage.getItem('lomi_streak_current_day') || '2', 10);
      const lastClaimDate = localStorage.getItem('lomi_streak_last_claim');
      const todayStr = new Date().toDateString();

      // Ensure Day 1 is never re-prompts since it's the welcome pack
      const activeDay = Math.max(2, savedDay);
      setCurrentStreakDay(activeDay);
      setHasClaimedToday(lastClaimDate === todayStr);
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimToday = () => {
    telegramService.triggerHaptic('success');
    const todayReward = streakDays.find(d => d.day === currentStreakDay) || streakDays[1];

    addBonus(todayReward.rewardNum);
    localStorage.setItem('lomi_streak_last_claim', new Date().toDateString());

    const nextDay = currentStreakDay >= 7 ? 2 : currentStreakDay + 1;
    localStorage.setItem('lomi_streak_current_day', nextDay.toString());
    setCurrentStreakDay(nextDay);
    setHasClaimedToday(true);

    showToast(
      lang === 'am'
        ? `🎉 የቀን ${todayReward.day} ቦነስ ${todayReward.reward} ተቀብለዋል!`
        : `🎉 Day ${todayReward.day} Streak Bonus ${todayReward.reward} Claimed!`
    );
  };

  return (
    <div className="otp-modal-overlay" style={{ zIndex: 99999 }}>
      {/* Dark backdrop */}
      <div className="otp-modal-backdrop" onClick={onClose}></div>

      {/* Main Exact White Card Shell */}
      <div
        className="exact-ref-modal-card"
        style={{
          position: 'relative',
          zIndex: 10,
          background: '#ffffff',
          borderRadius: '32px',
          width: '100%',
          maxWidth: '385px',
          padding: '24px 18px 18px 18px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          textAlign: 'center',
          boxSizing: 'border-box',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#f1f5f9',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* 1. Mascot: Glowing Halo with Fire Flame & Golden Sparkles */}
        <div style={{ position: 'relative', display: 'inline-block', margin: '4px auto 10px auto' }}>
          {/* Left Sparkle Star */}
          <span
            style={{
              position: 'absolute',
              left: '-24px',
              top: '28px',
              color: '#facc15',
              fontSize: '16px',
              fontWeight: '900'
            }}
          >
            ✦
          </span>

          {/* Halo Circle with Fire Flame */}
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fef08a 0%, #fef9c3 60%, rgba(254, 240, 138, 0) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              position: 'relative'
            }}
          >
            <span>🔥</span>
          </div>

          {/* Right Sparkle Star */}
          <span
            style={{
              position: 'absolute',
              right: '-24px',
              top: '32px',
              color: '#facc15',
              fontSize: '14px',
              fontWeight: '900'
            }}
          >
            ✦
          </span>
        </div>

        {/* 2. Main Title & Subtitle */}
        <h2
          style={{
            fontSize: '23px',
            fontWeight: '900',
            color: '#0f172a',
            margin: '0 0 4px 0',
            letterSpacing: '-0.4px',
            lineHeight: 1.2
          }}
        >
          {lang === 'am' ? 'የየዕለቱ የገቢ ቦነስ' : 'Daily Streak Calendar'}
        </h2>

        <p
          style={{
            fontSize: '12px',
            color: '#64748b',
            margin: '0 0 16px 0',
            lineHeight: 1.35
          }}
        >
          {lang === 'am' ? (
            <>በየቀኑ ሳይቋረጡ በመግባት እስከ <span style={{ color: '#16a34a', fontWeight: '800' }}>25 ብር</span> ድረስ ያግኙ!</>
          ) : (
            <>Log in every day without breaking your streak to claim up to <span style={{ color: '#16a34a', fontWeight: '800' }}>25 ETB!</span></>
          )}
        </p>

        {/* 3. Exact 7-Day Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {/* Row 1: Days 1 to 4 (4 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {streakDays.slice(0, 4).map((s) => {
              // Day 1 is always completed because of +10 ETB welcome bonus
              const isCompleted = s.day === 1 || s.day < currentStreakDay || (s.day === currentStreakDay && hasClaimedToday);
              const isToday = s.day === currentStreakDay && !hasClaimedToday;

              return (
                <div
                  key={s.day}
                  style={{
                    background: isToday ? '#fefce8' : (s.day === 1 ? 'rgba(254, 252, 232, 0.6)' : '#ffffff'),
                    border: isToday ? '1.5px solid #facc15' : (s.day === 1 ? '1.5px solid #fde047' : '1px solid #f1f5f9'),
                    borderRadius: '16px',
                    padding: '10px 4px 8px 4px',
                    textAlign: 'center',
                    boxShadow: isToday ? '0 4px 12px rgba(234, 179, 8, 0.15)' : '0 1px 4px rgba(0, 0, 0, 0.03)',
                    position: 'relative'
                  }}
                >
                  {/* Top-Right Green Checkmark Badge if Claimed */}
                  {isCompleted && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#16a34a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px'
                      }}
                    >
                      <i className="fa-solid fa-check"></i>
                    </span>
                  )}

                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                    {lang === 'am' ? `ቀን ${s.day}` : `Day ${s.day}`}
                  </div>

                  <div style={{ fontSize: '24px', margin: '4px 0' }}>{s.icon}</div>

                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '900',
                      color: isToday ? '#16a34a' : (s.day === 1 ? '#15803d' : '#0f172a'),
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {s.reward}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Row 2: Days 5 to 7 (3 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {streakDays.slice(4, 7).map((s) => {
              const isCompleted = s.day < currentStreakDay || (s.day === currentStreakDay && hasClaimedToday);
              const isToday = s.day === currentStreakDay && !hasClaimedToday;

              return (
                <div
                  key={s.day}
                  style={{
                    background: isToday ? '#fefce8' : '#ffffff',
                    border: isToday ? '1.5px solid #facc15' : '1px solid #f1f5f9',
                    borderRadius: '16px',
                    padding: '10px 4px 8px 4px',
                    textAlign: 'center',
                    boxShadow: isToday ? '0 4px 12px rgba(234, 179, 8, 0.15)' : '0 1px 4px rgba(0, 0, 0, 0.03)',
                    position: 'relative'
                  }}
                >
                  {/* Top-Right Green Checkmark Badge if Claimed */}
                  {isCompleted && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#16a34a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px'
                      }}
                    >
                      <i className="fa-solid fa-check"></i>
                    </span>
                  )}

                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                    {lang === 'am' ? `ቀን ${s.day}` : `Day ${s.day}`}
                  </div>

                  <div style={{ fontSize: '24px', margin: '4px 0' }}>{s.icon}</div>

                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '900',
                      color: isToday ? '#16a34a' : '#0f172a',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {s.reward}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Action CTA Button */}
        <button
          type="button"
          onClick={handleClaimToday}
          disabled={hasClaimedToday}
          style={{
            width: '100%',
            background: hasClaimedToday
              ? '#e2e8f0'
              : 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
            color: hasClaimedToday ? '#94a3b8' : '#ffffff',
            fontSize: '14.5px',
            fontWeight: '900',
            border: 'none',
            borderRadius: '999px',
            padding: '14px 18px',
            cursor: hasClaimedToday ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: hasClaimedToday ? 'none' : '0 8px 24px rgba(22, 163, 74, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            transition: 'all 0.15s ease'
          }}
        >
          {hasClaimedToday ? (
            <span>
              <i className="fa-solid fa-check"></i>{' '}
              {lang === 'am' ? 'ዛሬ ተቀብለዋል • ነገ ይመለሱ' : 'CLAIMED TODAY • COME BACK TOMORROW'}
            </span>
          ) : (
            <span>
              <i className="fa-solid fa-gift"></i>{' '}
              {lang === 'am' ? `የቀን ${currentStreakDay} ቦነስ ተቀበል` : `CLAIM DAY ${currentStreakDay} BONUS`}
            </span>
          )}
        </button>

        {/* 5. Exact 3-Column Trust Bar */}
        <div
          style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px',
            textAlign: 'left'
          }}
        >
          {/* Column 1 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
            <span style={{ color: '#16a34a', fontSize: '12px', marginTop: '1px' }}>
              <i className="fa-solid fa-shield-halved"></i>
            </span>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a' }}>
                {lang === 'am' ? 'ሳይቋረጡ ይቀጥሉ' : 'Keep your streak'}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748b' }}>
                {lang === 'am' ? 'ቦነስዎን ያሳድጉ' : 'Maximize your rewards'}
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', borderLeft: '1px solid #f1f5f9', paddingLeft: '4px' }}>
            <span style={{ color: '#16a34a', fontSize: '12px', marginTop: '1px' }}>
              <i className="fa-regular fa-calendar-check"></i>
            </span>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a' }}>
                {lang === 'am' ? 'በየቀኑ ይግቡ' : 'Login daily'}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748b' }}>
                {lang === 'am' ? '7 ቀናት፣ ትልቅ ሽልማት' : '7 days, bigger rewards'}
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', borderLeft: '1px solid #f1f5f9', paddingLeft: '4px' }}>
            <span style={{ color: '#16a34a', fontSize: '12px', marginTop: '1px' }}>
              <i className="fa-solid fa-wallet"></i>
            </span>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a' }}>
                {lang === 'am' ? 'ወዲያውኑ ገቢ' : 'Instant credit'}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748b' }}>
                {lang === 'am' ? 'ቀጥታ ወደ ቦርሳዎ' : 'Direct to your wallet'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
