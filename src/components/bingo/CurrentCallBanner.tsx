import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

// ── Column helpers ─────────────────────────────────────────
const getColClass = (num: number): string => {
  if (num <= 15) return 'b';
  if (num <= 30) return 'i';
  if (num <= 45) return 'n';
  if (num <= 60) return 'g';
  return 'o';
};

const getColLetter = (num: number): string => getColClass(num).toUpperCase();

export const CurrentCallBanner: React.FC = () => {
  const {
    currentCall,
    spherePop,
    calledNumbers,
    lobbyCountdown,
    roundPhase,
    waitingForPlayers,
    realPlayerCount,
    activeUsersCount,
    hasTicket,
    isMuted,
    toggleMute,
    autoPlay,
    toggleAutoPlay,
    waitingForOtherHouses,
    winnerCountdown
  } = useBingo();
  const { t, lang } = useLanguage();

  // Last 3-4 previous balls (skip the active one)
  const prevTrail = [...calledNumbers].reverse().slice(currentCall ? 1 : 0, 4);

  const mainColClass = currentCall
    ? `col-${currentCall.col.toLowerCase()}`
    : 'col-none';

  // Determine matchmaking status in lobby: countdown is strictly active when not waitingForPlayers!
  const isCountdown = roundPhase === 'lobby' && !waitingForPlayers;
  const is1Ready = roundPhase === 'lobby' && waitingForPlayers && (realPlayerCount >= 1 || hasTicket);
  const isMultipleInRoom = roundPhase === 'lobby' && waitingForPlayers && !is1Ready && activeUsersCount >= 2;
  const isWaitingAlone = roundPhase === 'lobby' && waitingForPlayers && !is1Ready && !isMultipleInRoom;

  return (
    <div className="compact-current-call-block">
      {/* 1. Main Current Call Header Bar */}
      <div className={`compact-call-header ${spherePop ? 'call-pop' : ''}`}>
        <div className="compact-call-title">
          {roundPhase === 'playing'
            ? (lang === 'am' ? 'የተጠራ ቁጥር' : 'Current Call')
            : roundPhase === 'winner'
            ? (lang === 'am' ? 'የአሸናፊ ማስታወቂያ 🏆' : 'Round Concluded 🏆')
            : (lang === 'am' ? 'የተጫዋች ጥሪ' : 'Matchmaking')}
        </div>

        <div className="compact-call-badge-wrap">
          {roundPhase === 'winner' ? (
            <div className="compact-current-ball-pill" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}>
              <span className="call-ball-col">{waitingForOtherHouses ? '⏳' : '🏆'}</span>
              <span className="call-ball-num lobby-status-text">
                {waitingForOtherHouses
                  ? (lang === 'am' ? 'ሌሎች ክፍሎች በመጠበቅ...' : 'Waiting other houses...')
                  : `${winnerCountdown}s`}
              </span>
            </div>
          ) : currentCall ? (
            <div className={`compact-current-ball-pill ${mainColClass}`}>
              <span className="call-ball-col">{currentCall.col}</span>
              <span className="call-ball-hyphen">-</span>
              <span className="call-ball-num">{currentCall.num}</span>
            </div>
          ) : roundPhase === 'lobby' ? (
            <div
              className={`compact-current-ball-pill lobby-timer ${
                isCountdown
                  ? 'countdown-active'
                  : is1Ready
                  ? 'ready-waiting'
                  : isMultipleInRoom
                  ? 'players-in-room'
                  : 'waiting-match'
              }`}
            >
              <span className="call-ball-col">
                {isCountdown ? '⏱️' : is1Ready ? '🟡' : isMultipleInRoom ? '👥' : '⏳'}
              </span>
              <span className="call-ball-num lobby-status-text">
                {isCountdown
                  ? `${lobbyCountdown}s`
                  : is1Ready
                  ? (lang === 'am' ? '1/2 ዝግጁ' : '1/2 Ready')
                  : isMultipleInRoom
                  ? (lang === 'am' ? `${activeUsersCount} ተጫዋች` : `${activeUsersCount} in Room`)
                  : (lang === 'am' ? 'በመጠበቅ...' : 'Waiting...')}
              </span>
            </div>
          ) : (
            <div className="compact-current-ball-pill waiting">
              <span className="call-ball-col">🎱</span>
              <span className="call-ball-num">--</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Recent Balls Tray / Lobby Matchmaking Guide */}
      <div className="compact-recent-balls-tray">
        <div className="compact-recent-balls-inner">
          {prevTrail.length > 0 ? (
            prevTrail.map((num, idx) => {
              const colClass = getColClass(num);
              const colLetter = getColLetter(num);
              return (
                <div key={`${num}-${idx}`} className={`compact-recent-ball col-${colClass}`}>
                  <span className="recent-ball-col">{colLetter}</span>
                  <span className="recent-ball-num">{num}</span>
                </div>
              );
            })
          ) : roundPhase === 'lobby' ? (
            <div className="compact-recent-matchmaking-note">
              {isCountdown ? (
                <span className="matchmaking-guide text-green">
                  🟢 {lang === 'am' ? `ጨዋታ በ ${lobbyCountdown} ሰከንድ ይጀምራል!` : `Game starts in ${lobbyCountdown}s!`}
                </span>
              ) : is1Ready ? (
                <span className="matchmaking-guide text-amber">
                  🟡 {lang === 'am' ? '1 ተጫዋች ዝግጁ ነው! ካርቴላ ይግዙ' : '1/2 ready · Buy ticket to start match!'}
                </span>
              ) : isMultipleInRoom ? (
                <span className="matchmaking-guide text-blue">
                  👥 {lang === 'am' ? `${activeUsersCount} ተጫዋቾች አሉ! ካርቴላ ይግዙ` : `${activeUsersCount} players in room! Buy ticket to play!`}
                </span>
              ) : (
                <span className="matchmaking-guide text-muted">
                  ⏳ {lang === 'am' ? 'ተጫዋች በመጠበቅ ላይ...' : 'Waiting for players to come...'}
                </span>
              )}
            </div>
          ) : (
            <div className="compact-recent-empty-dots">
              <span className="recent-empty-ball">--</span>
              <span className="recent-empty-ball">--</span>
              <span className="recent-empty-ball">--</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. In-line Sound & Auto-Daub Controls Strip */}
      <div className="compact-call-controls-row">
        <button
          type="button"
          className={`btn-compact-sound ${isMuted ? 'muted' : 'active'}`}
          onClick={toggleMute}
          title={isMuted ? 'Sound Muted — Click to unmute' : 'Sound ON — Click to mute'}
        >
          <span className="sound-lbl">Sound</span>
          <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
        </button>

        <button
          type="button"
          className={`btn-compact-auto ${autoPlay ? 'on' : 'off'}`}
          onClick={toggleAutoPlay}
          title={autoPlay ? 'Auto Daub ON' : 'Auto Daub OFF'}
        >
          <span className="auto-lbl">Auto</span>
          <span className={`auto-switch-pill ${autoPlay ? 'on' : 'off'}`}>
            {autoPlay ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  );
};
