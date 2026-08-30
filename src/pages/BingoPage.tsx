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
import { ConfettiCanvas } from '../components/common/ConfettiCanvas.tsx';

export const BingoPage: React.FC = () => {
  const { hasTicket, showWinModal } = useBingo();

  return (
    <div className="page active fresh-bingo-page" id="page-bingo">
      {/* Confetti Celebration Particles */}
      <ConfettiCanvas active={showWinModal} />

      <div className="bingo-page-content-wrapper">
        {/* 1. Engine V3 Badge */}
        <div className="bingo-engine-pill-row">
          <span className="engine-v3-pill">
            <i className="fa-solid fa-bolt purple-bolt"></i>
            <span>ENGINE V3</span>
          </span>
        </div>

        {/* 2. Top Hourglass & Live Status Banner */}
        <CurrentCallBanner />

        {/* 3. 4-Column Live Metric Strip */}
        <StatsStrip />

        {/* 4. Main 2-Column Game Split: Left Master Board + Right Spectator/Cartela */}
        <div className="bingo-main-split-area">
          {/* Left Column: Master Board 1-75 */}
          <div className="bingo-left-master-col">
            <MasterBoard75 />
          </div>

          {/* Right Column: Spectator Card or Active Playing Cartela */}
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

        {/* 5. Bottom Stake Selection & Buy Ticket Bar */}
        <BettingBar />
      </div>

      {/* 6. Celebratory Victory Celebration Modal */}
      <WinModal />
    </div>
  );
};
