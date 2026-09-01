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
import { CartelaPickerModal } from '../components/bingo/CartelaPickerModal.tsx';
import { ConfettiCanvas } from '../components/common/ConfettiCanvas.tsx';

export const BingoPage: React.FC = () => {
  const { hasTicket, showWinModal, showMasterBoard, toggleMasterBoard } = useBingo();

  return (
    <div className="page active fresh-bingo-page" id="page-bingo">
      {/* Confetti */}
      <ConfettiCanvas active={showWinModal} />

      <div className="bingo-page-content-wrapper">

        {/* 1. Top Bar: Engine Badge + Master Board Toggle */}
        <div className="bingo-engine-pill-row">
          <span className="engine-v3-pill">
            <i className="fa-solid fa-bolt purple-bolt"></i>
            <span>ENGINE V3</span>
          </span>
          <button
            type="button"
            className="engine-board-toggle-btn"
            onClick={toggleMasterBoard}
          >
            <i className="fa-solid fa-table-cells"></i>
            <span>75-Ball Board</span>
          </button>
        </div>

        {/* 2. Live Call Banner with recent balls trail */}
        <CurrentCallBanner />

        {/* 3. Live Stats: Stake / Prize / Players / Called */}
        <StatsStrip />

        {/* 4. Main Game Area — full-width cartela on mobile */}
        <div className="bingo-main-game-area">
          {/* Desktop only: Master Board column */}
          <div className="bingo-left-master-col">
            <MasterBoard75 />
          </div>

          {/* Cartela / Spectator */}
          <div className="bingo-right-cartela-col">
            {hasTicket ? (
              <div className="active-playing-cartela-box">
                <BingoGrid />
                <BingoActions />
              </div>
            ) : (
              <SpectatorCard />
            )}
          </div>
        </div>

        {/* 5. Stake Selector & Buy Button */}
        <BettingBar />
      </div>

      {/* Master Board Drawer (mobile) */}
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

      {/* 400 Cartelas Picker Modal */}
      <CartelaPickerModal />

      {/* Win Modal */}
      <WinModal />
    </div>
  );
};
