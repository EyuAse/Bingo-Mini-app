import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { telegramService } from '../../services/telegramService';

interface BlumOnboardingCarouselProps {
  onClaimBonus: () => void;
  isLoading: boolean;
}

export const BlumOnboardingCarousel: React.FC<BlumOnboardingCarouselProps> = ({
  onClaimBonus,
  isLoading
}) => {
  const { lang } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 0,
      badge: lang === 'am' ? '⚡ የቀጥታ 75-ኳስ ቢንጎ' : '⚡ LIVE 75-BALL BINGO',
      title: lang === 'am' ? 'የኢትዮጵያ #1 ፈጣን የቢንጎ ጨዋታ' : "Ethiopia's #1 Express Bingo Game",
      sub: lang === 'am' ? 'በየደቂቃው የቀጥታ ዙሮች፣ ከፍተኛ ጃክፖት እና እውነተኛ አሸናፊዎች!' : 'Live rounds every 60s, massive jackpots, and thousands of real winners daily!',
      art: '/assets/images/lomi-hero-75.jpg',
      icon: '🍋',
      highlight: '75-BALL EXPRESS'
    },
    {
      id: 1,
      badge: lang === 'am' ? '💸 ፈጣን ክፍያ' : '💸 INSTANT PAYOUTS',
      title: lang === 'am' ? 'በቴሌብር እና በንግድ ባንክ ወዲያውኑ ወጪ ያድርጉ' : 'Withdraw Instantly to Telebirr & CBE',
      sub: lang === 'am' ? 'ያሸነፉትን ገንዘብ በሰከንዶች ውስጥ ወደ ስልክዎ ያስገቡ። 0% ኮሚሽን!' : 'Instant cashouts directly to your Telebirr or CBE Bank in 0-60 seconds. 0% fees!',
      art: '/assets/images/auth-header-75.jpg',
      icon: '⚡',
      highlight: '0-60s PAYOUTS'
    },
    {
      id: 2,
      badge: lang === 'am' ? '🎁 የነፃ መመዝገቢያ ስጦታ' : '🎁 STARTER REWARD PACK',
      title: lang === 'am' ? 'የ10 ብር ነፃ ቦነስዎን አሁኑኑ ያግኙ!' : 'Claim Your 10 ETB Free Starter Pack!',
      sub: lang === 'am' ? 'ያለ ምንም ቅድመ ክፍያ ወዲያውኑ መጫወት ይጀምሩ እና እውነተኛ ብር ያሸንፉ!' : 'Start playing instantly with zero deposit required and win real cash payouts!',
      art: '/assets/images/lomi-hero-75.jpg',
      icon: '👑',
      highlight: '+10.00 ETB FREE'
    }
  ];

  const handleNext = () => {
    telegramService.triggerHaptic('light');
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClaimBonus();
    }
  };

  const handleDotClick = (idx: number) => {
    telegramService.triggerHaptic('light');
    setCurrentSlide(idx);
  };

  const slide = slides[currentSlide];

  return (
    <div className="blum-onboarding-wrapper" style={{ margin: '0 0 16px 0', width: '100%' }}>
      {/* Slide Glass Card */}
      <div
        className="blum-story-card"
        style={{
          background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          borderRadius: '24px',
          border: '1.5px solid rgba(250, 204, 21, 0.35)',
          padding: '20px 16px',
          color: '#ffffff',
          textAlign: 'center',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5), 0 0 20px rgba(234, 179, 8, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow backdrop */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(250, 204, 21, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        ></div>

        {/* Top Story Progress Bars */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => handleDotClick(idx)}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '999px',
                background: idx <= currentSlide ? '#facc15' : 'rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            ></div>
          ))}
        </div>

        {/* Badge Pill */}
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
            marginBottom: '12px'
          }}
        >
          <span>{slide.icon}</span>
          <span>{slide.badge}</span>
        </div>

        {/* Artwork Image */}
        <div
          style={{
            width: '100%',
            height: '150px',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '14px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <img
            src={slide.art}
            alt={slide.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '19px',
            fontWeight: '900',
            margin: '0 0 6px 0',
            letterSpacing: '-0.3px',
            color: '#ffffff',
            lineHeight: 1.3
          }}
        >
          {slide.title}
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          {slide.sub}
        </p>

        {/* Action Button */}
        {currentSlide === slides.length - 1 ? (
          <button
            type="button"
            className="btn-hero-fresh-cta"
            onClick={onClaimBonus}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
              color: '#0f172a',
              fontSize: '15.5px',
              fontWeight: '900',
              border: 'none',
              borderRadius: '999px',
              padding: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(234, 179, 8, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            <span>🎁</span>
            <span>
              {isLoading
                ? lang === 'am'
                  ? 'በመግባት ላይ...'
                  : 'Connecting...'
                : lang === 'am'
                ? '🎁 የ10 ብር ቦነስ አሁኑኑ ያግኙ'
                : '🎁 Claim 10 ETB Bonus & Play'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '800',
              border: 'none',
              borderRadius: '999px',
              padding: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(34, 158, 217, 0.4)'
            }}
          >
            <span>{lang === 'am' ? 'ቀጣይ' : 'Next'}</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        )}
      </div>
    </div>
  );
};
