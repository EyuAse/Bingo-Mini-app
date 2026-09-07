import React, { useState } from 'react';
import { useBingo } from '../context/BingoContext.tsx';
import { useApp } from '../context/AppContext.tsx';
import { CurrentCallBanner } from '../components/bingo/CurrentCallBanner.tsx';
import { StatsStrip } from '../components/bingo/StatsStrip.tsx';
import { SpectatorCard } from '../components/bingo/SpectatorCard.tsx';
import { BingoGrid } from '../components/bingo/BingoGrid.tsx';
import { BettingBar } from '../components/bingo/BettingBar.tsx';
import { WinModal } from '../components/bingo/WinModal.tsx';
import { InsufficientBalanceModal } from '../components/bingo/InsufficientBalanceModal.tsx';
import { VoiceTesterModal } from '../components/bingo/VoiceTesterModal.tsx';
import { ConfettiCanvas } from '../components/common/ConfettiCanvas.tsx';
import { NetworkStatusBanner, NetworkLatencyPill } from '../components/bingo/NetworkStatusBanner.tsx';
import { OneToGoAlert } from '../components/bingo/OneToGoAlert.tsx';

export const BingoPage: React.FC = () => {
  const {
    hasTicket, showWinModal, isMuted, toggleMute, triggerManualSync, isSyncing,
    roundPhase, waitingForPlayers, realPlayerCount, lobbyCountdown
  } = useBingo();
  const { switchPage } = useApp();
  const [showVoiceTester, setShowVoiceTester] = useState<boolean>(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState<boolean>(false);

  // Derive hero title text based on game phase
  const heroTitle = roundPhase === 'playing'
    ? 'GAME IN PROGRESS'
    : waitingForPlayers
    ? 'WAITING FOR PLAYERS'
    : `STARTS IN ${lobbyCountdown}s`;

  // Split into base and highlight
  const titleParts = heroTitle.split(' ');
  const heroTitleBase = titleParts.slice(0, -1).join(' ') + ' ';
  const heroTitleHighlight = titleParts[titleParts.length - 1];

  return (
    <div className="fresh-bingo-page">
      {/* Confetti Celebration for Wins */}
      <ConfettiCanvas active={showWinModal} />

      <div className="bingo-page-content-wrapper">

        {/* 1. Dark Hero Header — Pristine layout matching reference Image 2 */}
        <div className="bingo-hero-header">
          <div className="bingo-hero-top-row">

            {/* Left: Circular Back Button */}
            <button
              type="button"
              className="btn-bingo-hero-back"
              onClick={() => switchPage('games')}
              title="Back to Games"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            {/* Center: Title + Sub-row */}
            <div className="bingo-hero-center-group">
              <div className="bingo-hero-title-wrap">
                <span className="bingo-hero-trophy">🏆</span>
                <div className="bingo-hero-title">
                  {heroTitleBase}<span className="title-highlight">{heroTitleHighlight}</span>
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
              </div>
            </div>

            {/* Right: 3D Balls with Crown + Circular Menu Button */}
            <div className="bingo-hero-right-cluster">
              <div className="bingo-hero-3d-balls" title="Betika Lucky Bingo">
                <div className="hero-3d-ball purple-b">
                  <span className="ball-shine"></span>
                  <span className="ball-letter">B</span>
                  <span className="ball-crown-crown">👑</span>
                </div>
                <div className="hero-3d-ball cyan-g">
                  <span className="ball-shine"></span>
                  <span className="ball-letter">G</span>
                  <span className="ball-crown-sparkle">✨</span>
                </div>
              </div>

              {/* Circular Menu Button */}
              <button
                type="button"
                className="btn-bingo-hero-menu"
                onClick={() => setShowMenuDrawer(true)}
                title="Settings & Tools"
              >
                <i className="fa-solid fa-bars"></i>
              </button>
            </div>

          </div>
        </div>

        {/* Real-Time Network Resilience Alerts */}
        <NetworkStatusBanner />

        {/* 2. Live Current Call Banner */}
        <CurrentCallBanner />

        {/* 3. Live Stats: Stake / Prize / Players / Called (Floating white card) */}
        <StatsStrip />

        {/* 4. Full-Width Cartela Area (Side-by-side cards when playing, clean Spectator card when not) */}
        {hasTicket ? (
          <BingoGrid />
        ) : (
          <SpectatorCard />
        )}

        {/* 4.2 In-Game "1 to Go" (1TG) Alert Banner */}
        <OneToGoAlert />

        {/* 5. Stake Selector, System Cartelas & Buy Ticket Bar */}
        <BettingBar />
      </div>

      {/* Settings & Tools Modal Drawer — keeps top bar 100% clean without overlapping buttons */}
      {showMenuDrawer && (
        <div className="bingo-menu-drawer-backdrop" onClick={() => setShowMenuDrawer(false)}>
          <div className="bingo-menu-drawer" onClick={e => e.stopPropagation()}>
            <div className="bingo-drawer-hdr">
              <h4>Game Settings & Tools</h4>
              <button
                type="button"
                className="btn-drawer-close"
                onClick={() => setShowMenuDrawer(false)}
              >
                ✕
              </button>
            </div>

            <div className="bingo-drawer-content">
              {/* Mute/Unmute */}
              <button
                type="button"
                className="drawer-action-btn"
                onClick={() => {
                  toggleMute();
                }}
              >
                <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
                <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
                <span className="drawer-btn-sub">{isMuted ? 'Audio is OFF' : 'Audio is ON'}</span>
              </button>

              {/* 1-Tap Sync */}
              <button
                type="button"
                className="drawer-action-btn"
                onClick={() => {
                  triggerManualSync();
                }}
                disabled={isSyncing}
              >
                <i className={`fa-solid fa-arrows-rotate ${isSyncing ? 'fa-spin' : ''}`}></i>
                <span>Resynchronize Game</span>
                <span className="drawer-btn-sub">{isSyncing ? 'Syncing...' : 'Fetch latest state'}</span>
              </button>

              {/* Column B Voice Studio */}
              <button
                type="button"
                className="drawer-action-btn"
                onClick={() => {
                  setShowMenuDrawer(false);
                  setShowVoiceTester(true);
                }}
              >
                <i className="fa-solid fa-microphone"></i>
                <span>Column B Voice Studio</span>
                <span className="drawer-btn-sub">Test 1–15 voice samples</span>
              </button>

              {/* Connection Quality */}
              <div className="drawer-latency-wrap">
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Network Latency:</span>
                <NetworkLatencyPill />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Modal */}
      <WinModal />

      {/* Insufficient Balance Pop-Up Alert Modal */}
      <InsufficientBalanceModal />

      {/* Column B Real Voice Tester Modal */}
      <VoiceTesterModal isOpen={showVoiceTester} onClose={() => setShowVoiceTester(false)} />
    </div>
  );
};
