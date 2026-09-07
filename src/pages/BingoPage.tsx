import React, { useState } from 'react';
import { useBingo } from '../context/BingoContext.tsx';
import { useApp } from '../context/AppContext.tsx';
import { CurrentCallBanner } from '../components/bingo/CurrentCallBanner.tsx';
import { StatsStrip } from '../components/bingo/StatsStrip.tsx';
import { MasterBoard75 } from '../components/bingo/MasterBoard75.tsx'; // kept import — not rendered in main view

import { SpectatorCard } from '../components/bingo/SpectatorCard.tsx';
import { BingoGrid } from '../components/bingo/BingoGrid.tsx';
import { BingoActions } from '../components/bingo/BingoActions.tsx';
import { BettingBar } from '../components/bingo/BettingBar.tsx';
import { WinModal } from '../components/bingo/WinModal.tsx';
import { InsufficientBalanceModal } from '../components/bingo/InsufficientBalanceModal.tsx';
import { VoiceTesterModal } from '../components/bingo/VoiceTesterModal.tsx';
import { ConfettiCanvas } from '../components/common/ConfettiCanvas.tsx';

import { NetworkStatusBanner, NetworkLatencyPill } from '../components/bingo/NetworkStatusBanner.tsx';
import { LobbyStatusBanner } from '../components/bingo/LobbyStatusBanner.tsx';
import { OneToGoAlert } from '../components/bingo/OneToGoAlert.tsx';

export const BingoPage: React.FC = () => {
  const {
    hasTicket, showWinModal, isMuted, toggleMute, triggerManualSync, isSyncing,
    roundPhase, waitingForPlayers, realPlayerCount, lobbyCountdown
  } = useBingo();
  const { switchPage } = useApp();
  const [showVoiceTester, setShowVoiceTester] = useState<boolean>(false);

  // Derive hero title text based on game phase (display-only, no logic)
  const heroTitle = roundPhase === 'playing'
    ? 'GAME IN PROGRESS'
    : waitingForPlayers
    ? 'WAITING FOR PLAYERS'
    : `STARTS IN ${lobbyCountdown}s`;

  const heroTitleHighlight = roundPhase === 'playing'
    ? 'IN PROGRESS'
    : waitingForPlayers
    ? 'FOR PLAYERS'
    : `IN ${lobbyCountdown}s`;

  const heroTitleBase = roundPhase === 'playing'
    ? 'GAME '
    : waitingForPlayers
    ? 'WAITING '
    : 'STARTS ';

  return (
    <div className="page active fresh-bingo-page dark-redesign" id="page-bingo">
      {/* Confetti Celebration for Wins */}
      <ConfettiCanvas active={showWinModal} />

      <div className="bingo-page-content-wrapper">

        {/* 1. Dark Hero Header */}
        <div className="bingo-hero-header">

          {/* Decorative Bingo Balls (top-right art) */}
          <div className="bingo-hero-balls-cluster">
            <div className="hero-ball b-ball">
              B
              <span className="hero-ball-crown">👑</span>
            </div>
            <div className="hero-ball g-ball">G</div>
          </div>

          {/* Top row: back, trophy+title, controls */}
          <div className="bingo-hero-top-row">
            <div className="bingo-hero-left">
              <button
                type="button"
                className="btn-bingo-hero-back"
                onClick={() => switchPage('games')}
                title="Back to Games"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <span className="bingo-hero-trophy">🏆</span>
              <div className="bingo-hero-title">
                {heroTitleBase}<span className="title-highlight">{heroTitleHighlight}</span>
              </div>
            </div>

            <div className="bingo-hero-right">
              {/* Voice Studio toggle — logic preserved exactly */}
              <button
                type="button"
                className="btn-bingo-hero-ctrl"
                onClick={() => setShowVoiceTester(prev => !prev)}
                title="Toggle Column B Voice Studio"
              >
                <i className="fa-solid fa-microphone"></i>
              </button>
              {/* Mute/Unmute — logic preserved exactly */}
              <button
                type="button"
                className="btn-bingo-hero-ctrl"
                onClick={toggleMute}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
              </button>
              {/* 1-Tap Sync — logic preserved exactly */}
              <button
                type="button"
                className="btn-bingo-hero-ctrl"
                onClick={triggerManualSync}
                disabled={isSyncing}
                title={isSyncing ? 'Synchronizing...' : '1-Tap State Sync'}
              >
                <i className={`fa-solid fa-arrows-rotate ${isSyncing ? 'fa-spin' : ''}`}></i>
              </button>
              <button
                type="button"
                className="btn-bingo-hero-menu"
                onClick={() => setShowVoiceTester(prev => !prev)}
                title="Menu"
              >
                <i className="fa-solid fa-bars"></i>
              </button>
            </div>
          </div>

          {/* Sub-row: player count + status */}
          <div className="bingo-hero-sub-row">
            <div className="hero-sub-item">
              <i className="fa-solid fa-users"></i>
              <strong>{realPlayerCount}/2</strong>
              <span>Players Joined</span>
            </div>
            <div className="hero-sub-item">
              <i className="fa-regular fa-clock"></i>
              <span>
                {roundPhase === 'playing'
                  ? 'Game is live!'
                  : 'Waiting for first ball...'}
              </span>
            </div>
            <NetworkLatencyPill />
          </div>
        </div>

        {/* Real-Time Network Resilience Alerts & Offline Win Celebration Modal */}
        <NetworkStatusBanner />

        {/* 2. Live Current Call Banner (with hourglass, current ball & recent calls trail) */}
        <CurrentCallBanner />

        {/* 3. Live Stats: Stake / Prize / Players / Called */}
        <StatsStrip />

        {/* 3.5 Lobby Status Banner (Waiting for 2 Players / Active Countdown / Live Join Feed) */}
        <LobbyStatusBanner />

        {/* 4. Full-Width Cartela Area */}
        {hasTicket ? (
          <BingoGrid />
        ) : (
          <SpectatorCard />
        )}

        {/* 4.2 In-Game "1 to Go" (1TG) Alert Banner */}
        <OneToGoAlert />

        {/* 4.5 Full-Width Action Bar (Auto Daub / Golden BINGO / Match) */}
        {hasTicket && (
          <div className="bingo-full-width-actions-wrap">
            <BingoActions />
          </div>
        )}

        {/* 5. Stake Selector, System Cartelas & Buy Ticket Bar */}
        <BettingBar />
      </div>

      {/* Victory Celebration Modal */}
      <WinModal />

      {/* Insufficient Balance Pop-Up Alert Modal */}
      <InsufficientBalanceModal />

      {/* Column B Real Voice Tester Modal */}
      <VoiceTesterModal isOpen={showVoiceTester} onClose={() => setShowVoiceTester(false)} />
    </div>
  );
};
