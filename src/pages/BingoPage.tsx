import React, { useState } from 'react';
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
import { VoiceTesterModal } from '../components/bingo/VoiceTesterModal.tsx';
import { ConfettiCanvas } from '../components/common/ConfettiCanvas.tsx';

import { NetworkStatusBanner, NetworkLatencyPill } from '../components/bingo/NetworkStatusBanner.tsx';
import { LobbyStatusBanner } from '../components/bingo/LobbyStatusBanner.tsx';
import { OneToGoAlert } from '../components/bingo/OneToGoAlert.tsx';

export const BingoPage: React.FC = () => {
  const { hasTicket, showWinModal, isMuted, toggleMute, triggerManualSync, isSyncing } = useBingo();
  const [showVoiceTester, setShowVoiceTester] = useState<boolean>(false);

  return (
    <div className="page active fresh-bingo-page" id="page-bingo">
      {/* Confetti Celebration for Wins */}
      <ConfettiCanvas active={showWinModal} />

      <div className="bingo-page-content-wrapper">

        {/* 1. Top Bar: Engine V3 Badge + Network Latency Pill + Audio & Sync Controls */}
        <div className="bingo-engine-pill-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="engine-v3-pill">
              <i className="fa-solid fa-bolt purple-bolt"></i>
              <span>ENGINE V3</span>
            </span>
            <NetworkLatencyPill />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="engine-control-mini-btn"
              onClick={() => setShowVoiceTester(prev => !prev)}
              title="Toggle Column B Voice Studio"
              style={{ color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.4)' }}
            >
              <i className="fa-solid fa-microphone"></i>
            </button>
            <button
              type="button"
              className="engine-control-mini-btn"
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
            </button>
            <button
              type="button"
              className="engine-control-mini-btn"
              onClick={triggerManualSync}
              disabled={isSyncing}
              title={isSyncing ? 'Synchronizing game state...' : '1-Tap State Sync'}
            >
              <i className={`fa-solid fa-arrows-rotate ${isSyncing ? 'fa-spin' : ''}`}></i>
            </button>
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

        {/* 4. Side-by-Side Responsive Arena: Master Board (Left) + Active Cartela (Right) */}
        <div className="bingo-side-by-side-arena">
          <div className="arena-left-master-board">
            <MasterBoard75 />
          </div>
          <div className="arena-right-cartela">
            {hasTicket ? (
              <div className="active-playing-cartela-box">
                <BingoGrid />
              </div>
            ) : (
              <SpectatorCard />
            )}
          </div>
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

      {/* Victory Celebration Modal */}
      <WinModal />

      {/* Insufficient Balance Pop-Up Alert Modal */}
      <InsufficientBalanceModal />

      {/* Column B Real Voice Tester Modal */}
      <VoiceTesterModal isOpen={showVoiceTester} onClose={() => setShowVoiceTester(false)} />
    </div>
  );
};
