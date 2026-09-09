import React, { useState } from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { StakeRoomSelectorModal } from '../games/StakeRoomSelectorModal.tsx';

export const StatsStrip: React.FC = () => {
  const {
    betAmount,
    setBetAmount,
    prizePool,
    playersCount,
    realPlayerCount,
    activeUsersCount,
    calledNumbers,
    roundPhase,
    waitingForPlayers,
    hasTicket,
    roomMode
  } = useBingo();
  const { lang } = useLanguage();
  const [showStakeModal, setShowStakeModal] = useState<boolean>(false);

  const isSpectatingHouse = roomMode === 'spectating' && !hasTicket;
  const currentPlayers = realPlayerCount > 0 ? realPlayerCount : playersCount;
  // Effective player count — always ≥ 1 when user has a ticket, prevents "0/0" display lag
  const effectivePlayerCount = hasTicket ? Math.max(currentPlayers, 1) : currentPlayers;
  // Dynamic Real-Flow Derash Calculation:
  // Computes the expected pot from confirmed ticketed players across any stake room (10, 20, 50, 100 ETB)
  const expectedPot = effectivePlayerCount * betAmount;
  const calculatedPrize = effectivePlayerCount <= 5 ? expectedPot : Math.floor(expectedPot * 0.8);
  const currentPrize = Math.max(prizePool, calculatedPrize);
  const prizeDisplay = isSpectatingHouse && roundPhase === 'playing'
    ? '0'
    : (currentPrize >= 1000 ? `${(currentPrize / 1000).toFixed(1)}K` : `${currentPrize}`);

  // Short round game code
  const gameId = `KL-${betAmount}`;

  // Matchmaking player display for clarity: never show misleading "0/2" when players are in room
  const isLobbyWaiting = roundPhase === 'lobby' && (waitingForPlayers || effectivePlayerCount < 2);
  const effectiveInRoom = Math.max(activeUsersCount, currentPlayers, hasTicket ? 1 : 0);
  const playersDisplay = isLobbyWaiting
    ? (effectivePlayerCount >= 1 || hasTicket
        ? `${Math.max(effectivePlayerCount, 1)}/2 ⏳`
        : (effectiveInRoom >= 2
            ? (lang === 'am' ? `${effectiveInRoom} ተጫዋች` : `${effectiveInRoom} in Room`)
            : (lang === 'am' ? 'ይጠብቁ ⏳' : 'Waiting ⏳')))
    : (isSpectatingHouse && roundPhase === 'playing'
        ? (lang === 'am' ? 'እይታ 👁️' : 'Spectate 👁️')
        : `${Math.max(currentPlayers, hasTicket ? 1 : 0)}`);

  const canSwitchStake = roundPhase === 'lobby' && !hasTicket;

  return (
    <>
      <StakeRoomSelectorModal
        isOpen={showStakeModal}
        onClose={() => setShowStakeModal(false)}
        onSelectStake={(stake) => {
          setBetAmount(stake);
          setShowStakeModal(false);
        }}
      />

      <div className="bingo-top-status-strip">
        {/* 1. Game ID */}
        <div className="status-strip-box">
          <span className="status-strip-lbl">Game ID</span>
          <span className="status-strip-val text-purple">{gameId}</span>
        </div>

        {/* 2. Derash (ደራሽ / Prize Pool) */}
        <div className="status-strip-box derash-box">
          <span className="status-strip-lbl">{lang === 'am' ? 'ደራሽ' : 'Derash'}</span>
          <span className="status-strip-val text-green">{prizeDisplay}</span>
        </div>

        {/* 3. Players */}
        <div className={`status-strip-box ${isLobbyWaiting ? 'waiting-match' : ''}`}>
          <span className="status-strip-lbl">{lang === 'am' ? 'ተጫዋቾች' : 'Players'}</span>
          <span className={`status-strip-val ${isLobbyWaiting ? 'text-gold' : ''}`}>{playersDisplay}</span>
        </div>

        {/* 4. Stake */}
        <div
          className={`status-strip-box ${canSwitchStake ? 'clickable-stake-pill' : ''}`}
          onClick={canSwitchStake ? () => setShowStakeModal(true) : undefined}
          title={canSwitchStake ? "Tap to change stake room" : undefined}
          style={{ cursor: canSwitchStake ? 'pointer' : 'default' }}
        >
          <span className="status-strip-lbl">{lang === 'am' ? 'መደብ' : 'Stake'}</span>
          <span className="status-strip-val text-gold">
            {betAmount}
            {canSwitchStake && <span style={{ fontSize: '0.65rem', marginLeft: '2px', opacity: 0.8 }}>▾</span>}
          </span>
        </div>

        {/* 5. Called Balls Count */}
        <div className="status-strip-box">
          <span className="status-strip-lbl">{lang === 'am' ? 'የተጠራ' : 'Called'}</span>
          <span className="status-strip-val">{calledNumbers.length}</span>
        </div>
      </div>
    </>
  );
};
