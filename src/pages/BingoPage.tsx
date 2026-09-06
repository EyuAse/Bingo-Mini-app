import React from 'react';
import { useBingo } from '../context/BingoContext.tsx';
import { CurrentCallBanner } from '../components/bingo/CurrentCallBanner.tsx';
import { StatsStrip } from '../components/bingo/StatsStrip.tsx';
import { MasterBoard75 } from '../components/bingo/MasterBoard75.tsx';
import { SpectatorCard } from '../components/bingo/SpectatorCard.tsx';
import { BingoGrid } from '../components/bingo/BingoGrid.tsx';
import { BingoActions } from '../components/bingo/BingoActions.tsx';
import { BettingBar } from '../components/bingo/BettingBar.tsx';
import { WinModal } from '../components/bingo/WinModal.tsx';
import { InsufficientBalanceModal } from '../components/bingo/InsufficientBalanceModal.tsx';
import { ConfettiCanvas } from '../components/common/ConfettiCanvas.tsx';

import { NetworkStatusBanner, NetworkLatencyPill } from '../components/bingo/NetworkStatusBanner.tsx';
import { LobbyStatusBanner } from '../components/bingo/LobbyStatusBanner.tsx';
import { OneToGoAlert } from '../components/bingo/OneToGoAlert.tsx';

export const BingoPage: React.FC = () => {
  const { hasTicket, showWinModal, showMasterBoard, toggleMasterBoard } = useBingo();

  return (
    <div className="page active fresh-bingo-page" id="page-bingo">
      {/* Confetti Celebration for Wins */}
      <ConfettiCanvas active={showWinModal} />

      <div className="bingo-page-content-wrapper">

        {/* 1. Top Bar: Engine V3 Badge + Network Latency Pill + 75-Ball Board Toggle Button */}
        <div className="bingo-engine-pill-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="engine-v3-pill">
              <i className="fa-solid fa-bolt purple-bolt"></i>
              <span>ENGINE V3</span>
            </span>
            <NetworkLatencyPill />
          </div>
          <button
            type="button"
            className="engine-board-toggle-btn"
            onClick={toggleMasterBoard}
          >
            <i className="fa-solid fa-table-cells"></i>
            <span>75-Ball Board</span>
          </button>
        </div>

        {/* Real-Time Network Resilience Alerts & Offline Win Celebration Modal */}
        <NetworkStatusBanner />

        {/* 2. Live Current Call Banner (with hourglass, current ball & recent calls trail) */}
        <CurrentCallBanner />

        {/* 3. Live Stats: Stake / Prize / Players / Called */}
        <StatsStrip />

        {/* 3.5 Lobby Status Banner (Waiting for 2 Players / Active Countdown / Live Join Feed) */}
        <LobbyStatusBanner />

        {/* 4. Full-Width Cartela (Master Board is in drawer only — see lines 85-99) */}
        <div className="bingo-cartela-fullwidth">
          {hasTicket ? (
            <div className="active-playing-cartela-box">
              <BingoGrid />
            </div>
          ) : (
            <SpectatorCard />
          )}
        </div>

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

      {/* Master Board Drawer (Mobile Slide-up Sheet) */}
      {showMasterBoard && (
        <div className="master-board-drawer-overlay" onClick={toggleMasterBoard}>
          <div
            className="master-board-drawer-sheet"
            onClick={e => e.stopPropagation()}
          >
            <div className="drawer-handle" />
            <p className="drawer-title">
              <i className="fa-solid fa-table-cells" style={{ color: '#eab308', marginRight: 6 }}></i>
              75-Ball Master Board
            </p>
            <MasterBoard75 />
          </div>
        </div>
      )}

      {/* Victory Celebration Modal */}
      <WinModal />

      {/* Insufficient Balance Pop-Up Alert Modal */}
      <InsufficientBalanceModal />
    </div>
  );
};
