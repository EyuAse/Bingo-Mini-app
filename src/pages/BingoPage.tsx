import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useBingo } from '../context/BingoContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';
import { LanguageDropdown } from '../components/common/LanguageDropdown.tsx';
import { MasterBoard75 } from '../components/bingo/MasterBoard75.tsx';
import { CurrentCallBanner } from '../components/bingo/CurrentCallBanner.tsx';
import { StatsStrip } from '../components/bingo/StatsStrip.tsx';
import { BingoGrid } from '../components/bingo/BingoGrid.tsx';
import { BingoActions } from '../components/bingo/BingoActions.tsx';
import { BettingBar } from '../components/bingo/BettingBar.tsx';
import { WinModal } from '../components/bingo/WinModal.tsx';
import { ConfettiCanvas } from '../components/common/ConfettiCanvas.tsx';

export const BingoPage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const {
    stopGame,
    showWinModal,
    hasTicket,
    hasPreBoughtNext,
    buyTicket,
    preBuyNextRound,
    isMuted,
    toggleMute,
    roundPhase,
    lobbyCountdown
  } = useBingo();
  const { t } = useLanguage();
  const { balance, isBalanceVisible, toggleBalanceVisibility } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBack = () => {
    stopGame();
    switchPage('games');
  };

  return (
    <div className="page bingo-page v3-theme active" id="page-bingo">
      {/* Confetti Celebration Overlay */}
      <ConfettiCanvas active={showWinModal} />

      {/* 1. Top Navbar (✕ Viva/Lomi Bingo ⌵ [Wallet Pill] ⋮) */}
      <header className="v3-top-nav">
        <button className="v3-nav-btn" onClick={handleBack} title={t('nav.back')}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="v3-nav-title" onClick={() => setIsMenuOpen(prev => !prev)}>
          <span>Lomi Bingo</span>
          <i className="fa-solid fa-chevron-down nav-chev"></i>
        </div>

        {/* Live Wallet Balance Pill */}
        <div
          className="v3-wallet-badge"
          onClick={toggleBalanceVisibility}
          title="Click to toggle balance visibility"
        >
          <i className="fa-solid fa-wallet wallet-icon"></i>
          <span className="wallet-val">
            {isBalanceVisible ? `${balance.toFixed(2)} ETB` : '••••••'}
          </span>
          <i className={`fa-solid ${isBalanceVisible ? 'fa-eye-slash' : 'fa-eye'} eye-toggle`}></i>
        </div>

        <button className="v3-nav-btn" onClick={() => showToast('⚙️ Room Settings & Game Rules')} title="Options">
          <i className="fa-solid fa-ellipsis-vertical"></i>
        </button>
      </header>

      {/* 2. Brand Sub-Header (VIVABINGO / LOMIBINGO ENGINE V3 & Sound Icon) */}
      <div className="v3-brand-row">
        <div className="v3-logo-group">
          <div className="v3-logo-title">
            <span className="logo-white">LOMI</span>
            <span className="logo-orange">BINGO</span>
          </div>
          <span className="v3-engine-sub">ENGINE V3</span>
        </div>

        <div className="v3-audio-controls">
          {/* Custom Flag Language Dropdown */}
          <LanguageDropdown compact />

          <button
            className="v3-sound-btn"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            <i className={`fa-solid ${isMuted ? 'fa-volume-xmark muted-red' : 'fa-volume-high'}`}></i>
          </button>
        </div>
      </div>

      {/* 3. Prominent Current Call Banner ([ G ] G-51) */}
      <CurrentCallBanner />

      {/* 4. 4-Pill Live Stats Strip (መወራረድ, የማሸነፊያ መጠን, PLAYERS, የወጡ ኳሶች) */}
      <StatsStrip />

      {/* 5. Main Split View: Left Master 75-Ball Board + Right Cartela/Spectator Mode */}
      <div className="v3-game-split-area">
        {/* Left Column: Master 75-Ball Board */}
        <div className="v3-left-col">
          <MasterBoard75 />
        </div>

        {/* Right Column: Cartela or Spectator Mode */}
        <div className="v3-right-col">
          {hasTicket ? (
            <div className="v3-active-cartela-container">
              <BingoGrid />
              <BingoActions />
            </div>
          ) : (
            <div className="spectator-card">
              <div className="spectator-eyes">👀</div>
              <h3 className="spectator-title">{t('bingo.spectatorTitle')}</h3>
              <p className="spectator-sub">{t('bingo.spectatorSub')}</p>

              <div className="spectator-buy-prompt">
                {roundPhase === 'lobby' ? (
                  <>
                    <span className="prompt-label">
                      {t('bingo.nextRoundIn')}{' '}
                      <strong>00:{lobbyCountdown < 10 ? `0${lobbyCountdown}` : lobbyCountdown}</strong>
                    </span>
                    <button className="spectator-buy-btn" onClick={buyTicket}>
                      <i className="fa-solid fa-ticket"></i>
                      <span>{t('bingo.buyTicket')}</span>
                    </button>
                  </>
                ) : hasPreBoughtNext ? (
                  <div className="spectator-prebought-box">
                    <i className="fa-solid fa-circle-check prebought-icon"></i>
                    <span className="prebought-title">{t('bingo.preBoughtBoxTitle')}</span>
                    <span className="prebought-sub">{t('bingo.preBoughtBoxSub')}</span>
                  </div>
                ) : (
                  <>
                    <span className="prompt-label">{t('bingo.dontMissPrompt')}</span>
                    <button className="spectator-buy-btn prebuy" onClick={preBuyNextRound}>
                      <i className="fa-solid fa-ticket"></i>
                      <span>{t('bingo.preBuyBtn')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Betting Bar & Ticket Purchase */}
      <BettingBar />

      {/* 7. Victory Celebration Modal */}
      <WinModal />
    </div>
  );
};
