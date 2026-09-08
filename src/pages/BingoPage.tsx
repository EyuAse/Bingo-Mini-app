import React, { useState } from 'react';
import { useBingo } from '../context/BingoContext.tsx';
import { useApp } from '../context/AppContext.tsx';
import { CurrentCallBanner } from '../components/bingo/CurrentCallBanner.tsx';
import { StatsStrip } from '../components/bingo/StatsStrip.tsx';
import { SpectatorCard } from '../components/bingo/SpectatorCard.tsx';
import { BingoGrid } from '../components/bingo/BingoGrid.tsx';
import { BettingBar } from '../components/bingo/BettingBar.tsx';
import { WinModal, WinModalEmergencyFallback } from '../components/bingo/WinModal.tsx';
import { InsufficientBalanceModal } from '../components/bingo/InsufficientBalanceModal.tsx';
import { VoiceTesterModal } from '../components/bingo/VoiceTesterModal.tsx';
import { ConfettiCanvas } from '../components/common/ConfettiCanvas.tsx';
import { NetworkStatusBanner, NetworkLatencyPill } from '../components/bingo/NetworkStatusBanner.tsx';
import { MasterBoard75 } from '../components/bingo/MasterBoard75.tsx';
import { LeaveConfirmModal } from '../components/bingo/LeaveConfirmModal.tsx';
import { CartelaPickerModal } from '../components/bingo/CartelaPickerModal.tsx';
import { ErrorBoundary } from '../components/common/ErrorBoundary.tsx';
import { telegramService } from '../services/telegramService.ts';

export const BingoPage: React.FC = () => {
  const isDesktop = telegramService.isDesktopPlatform();
  const {
    hasTicket, showWinModal, isMuted, toggleMute, triggerManualSync, isSyncing,
    roundPhase, waitingForPlayers, realPlayerCount, lobbyCountdown, cancelLobbyTicket,
    autoPlay, hasWinningPattern, claimBingo, claimInProgress
  } = useBingo();
  const { switchPage, showToast } = useApp();
  const [showVoiceTester, setShowVoiceTester] = useState<boolean>(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState<boolean>(false);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);

  // Safe Back Handler: If player is waiting in lobby with bought ticket, auto-refund on exit
  const handleBackClick = async () => {
    if (hasTicket && (roundPhase === 'lobby' || waitingForPlayers)) {
      await cancelLobbyTicket();
    }
    switchPage('games');
  };

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
    <div className={`fresh-bingo-page ${isDesktop ? 'is-desktop-view' : ''}`}>
      {/* Confetti Celebration for Wins */}
      <ConfettiCanvas active={showWinModal} />

      <div className={`bingo-page-content-wrapper ${isDesktop ? 'is-desktop-view' : ''}`}>

        {/* 1. Ultra-Slim Top Action Bar matching Image 2 */}
        <div className="bingo-top-action-bar">
          <button
            type="button"
            className="btn-bingo-mini-back"
            onClick={handleBackClick}
            title="Back to Games"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          {/* 5-Box Game Status Strip from Image 2 */}
          <StatsStrip />

          <button
            type="button"
            className="btn-bingo-mini-menu"
            onClick={() => setShowMenuDrawer(true)}
            title="Settings & Tools"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        {/* Real-Time Network Resilience Alerts */}
        <NetworkStatusBanner />

        {/* ── Main Split 2-Column Board & Cartela Layout ── */}
        <div className="bingo-split-layout-grid">
          {/* Left Column: Full 1-75 Main Master Board (Flashboard) */}
          <div className="bingo-left-flashboard-col">
            <MasterBoard75 />
          </div>

          {/* Right Column: Call Banner, Controls, Active Cartelas, Betting Bar */}
          <div className="bingo-right-playarea-col">
            <CurrentCallBanner />

            {hasTicket || roundPhase === 'lobby' ? (
              <ErrorBoundary componentName="BingoGrid" fallback={null}>
                <BingoGrid />
              </ErrorBoundary>
            ) : (
              <SpectatorCard />
            )}

            {/* Stake Bar: Visible strictly during lobby matchmaking only */}
            {roundPhase === 'lobby' && (
              <BettingBar />
            )}

            {/* In-Game Bottom Action Bar: Visible during active game! */}
            {roundPhase === 'playing' && (
              <div className="in-game-bottom-action-bar">
                <button
                  type="button"
                  className="btn-in-game-leave"
                  onClick={() => setShowLeaveModal(true)}
                  title="Leave this game round safely"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  <span>Leave Game</span>
                </button>

                {!autoPlay && (
                  <button
                    type="button"
                    disabled={claimInProgress}
                    className={`btn-in-game-bingo ${claimInProgress ? 'claiming' : hasWinningPattern ? 'active-claim-ready' : 'inactive'}`}
                    onClick={() => {
                      if (claimInProgress) return;
                      if (hasWinningPattern) {
                        claimBingo();
                      } else {
                        showToast("Complete any 5-in-a-row line on your card to call BINGO!");
                      }
                    }}
                    title={claimInProgress ? "Claiming your win..." : hasWinningPattern ? "Call Bingo to claim your victory!" : "Complete a 5-in-a-row line to call Bingo"}
                  >
                    <i className={claimInProgress ? "fa-solid fa-spinner fa-spin" : hasWinningPattern ? "fa-solid fa-trophy fa-bounce" : "fa-solid fa-trophy"}></i>
                    <span>{claimInProgress ? 'CLAIMING... ⚡' : hasWinningPattern ? 'CALL BINGO! ⚡' : 'BINGO! 🎯'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Game Confirmation Modal */}
      <LeaveConfirmModal
        isOpen={showLeaveModal}
        onConfirm={() => {
          setShowLeaveModal(false);
          switchPage('games');
        }}
        onCancel={() => setShowLeaveModal(false)}
      />

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

      {/* 400 Cartela Selection Modal */}
      <CartelaPickerModal />

      {/* Victory Celebration Modal — Guaranteed zero-error display */}
      <ErrorBoundary componentName="WinModal" fallback={<WinModalEmergencyFallback />}>
        <WinModal />
      </ErrorBoundary>

      {/* Insufficient Balance Pop-Up Alert Modal */}
      <InsufficientBalanceModal />

      {/* Column B Real Voice Tester Modal */}
      <VoiceTesterModal isOpen={showVoiceTester} onClose={() => setShowVoiceTester(false)} />
    </div>
  );
};
