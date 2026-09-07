import React from 'react';
import { useBingo, BingoCell } from '../../context/BingoContext.tsx';

// ── Column headers (display only) ─────────────────────────
const CARD_COLUMNS = [
  { letter: 'B', colClass: 'col-b' },
  { letter: 'I', colClass: 'col-i' },
  { letter: 'N', colClass: 'col-n' },
  { letter: 'G', colClass: 'col-g' },
  { letter: 'O', colClass: 'col-o' },
];

// ── Win patterns (untouched from original) ─────────────────
const WIN_PATTERNS = [
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
];

// ── Card status helper (untouched from original) ───────────
const getCardStatus = (cells: BingoCell[]) => {
  if (!cells || !cells.length) return { label: '2 TO GO', hot: false };
  let max = 0;
  for (const p of WIN_PATTERNS) {
    const count = p.filter((idx: number) => cells[idx]?.marked).length;
    if (count > max) max = count;
  }
  if (max === 5) return { label: 'BINGO! 🎉', hot: true };
  if (max === 4) return { label: '1 TO GO! 🔥', hot: true };
  if (max === 3) return { label: '2 TO GO', hot: false };
  if (max === 2) return { label: '3 TO GO', hot: false };
  return { label: '4 TO GO', hot: false };
};

// ── Card themes ────────────────────────────────────────────
const CARD_THEMES = ['theme-blue', 'theme-purple', 'theme-green'];

const NewCard5x5: React.FC<{
  cells: BingoCell[];
  cardIndex: number;
  cartelaId: number;
  theme: string;
  label: string;
  isWinningCard: boolean;
  winningLine: number[];
  autoPlay: boolean;
  onDaub: (cardIdx: number, cellIdx: number) => void;
}> = ({
  cells, cardIndex, cartelaId, theme, label,
  isWinningCard, winningLine, autoPlay, onDaub
}) => {
  const status = getCardStatus(cells);

  return (
    <div className={`new-cartela-card ${theme}`}>

      {/* ── Card Header Bar ── */}
      <div className="new-card-header">
        <span className="new-card-header-label">{label}</span>
        <span className="new-card-id-pill">#{cartelaId}</span>
      </div>

      {/* ── Card Body: BINGO letters + 5×5 grid ── */}
      <div className="new-card-body">

        {/* B I N G O column header row */}
        <div className="new-bingo-col-headers">
          {CARD_COLUMNS.map(c => (
            <div key={c.letter} className={`new-bingo-col-hdr ${c.colClass}`}>
              {c.letter}
            </div>
          ))}
        </div>

        {/* 5×5 grid cells */}
        <div className="new-cartela-5x5">
          {cells.map(cell => {
            const isWinningCell = isWinningCard && winningLine.includes(cell.index);
            return (
              <div
                key={`${cardIndex}-${cell.index}`}
                className={[
                  'new-cartela-cell',
                  cell.marked ? 'daubed' : '',
                  cell.isFree ? 'free-cell' : '',
                  isWinningCell ? 'win-glow' : '',
                  !autoPlay ? 'interactive-tap' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => !autoPlay && onDaub(cardIndex, cell.index)}
              >
                {cell.isFree ? (
                  /* FREE center cell with purple star */
                  <div className="new-free-content">
                    <span className="new-free-star">★</span>
                  </div>
                ) : cell.marked ? (
                  /* Daubed cell — gold checkmark */
                  <div className="new-daub-check">
                    <i className="fa-solid fa-check"></i>
                  </div>
                ) : (
                  /* Normal cell — show number */
                  <span>{cell.val}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Status badge */}
        {status.hot && (
          <div style={{
            textAlign: 'center',
            fontSize: '0.5rem',
            fontWeight: 900,
            color: status.label.includes('BINGO') ? '#16a34a' : '#dc2626',
            marginTop: '2px',
          }}>
            {status.label}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main BingoGrid Export ──────────────────────────────────
export const BingoGrid: React.FC = () => {
  const {
    cartela1Data,
    cartela2Data,
    cartela3Data,
    totalPlayableCards,
    selectedCartelaIds,
    handleManualDaub,
    winResult,
    autoPlay,
    toggleAutoPlay,
    roundPhase,
    lobbyCountdown,
    waitingForPlayers,
    realPlayerCount,
  } = useBingo();

  const currentCards = [
    {
      data: cartela1Data,
      id: selectedCartelaIds[0],
      cardIndex: 0,
      theme: CARD_THEMES[0],
      label: 'Card 1',
    },
    {
      data: cartela2Data,
      id: selectedCartelaIds[1],
      cardIndex: 1,
      theme: CARD_THEMES[1],
      label: 'Card 2',
    },
  ].slice(0, totalPlayableCards);

  const cardCountLabel = `${totalPlayableCards} ${totalPlayableCards === 1 ? 'Card' : 'Cards'}`;
  const gridClass = `cartelas-grid grid-${totalPlayableCards}`;

  return (
    <div className="your-cartelas-section">

      {/* ── Section Header matching Image 2 ── */}
      <div className="your-cartelas-header">
        <div className="your-cartelas-left-group">
          <div className="your-cartelas-icon-box">
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <span className="your-cartelas-title">YOUR CARTELAS</span>
          <span className="your-cartelas-count-badge">{cardCountLabel}</span>
        </div>

        {/* Sleek Auto Play / Manual Pill Toggle Button with Mid-Game Lock */}
        {(() => {
          const isLockedMidGame = roundPhase === 'playing';
          return (
            <button
              type="button"
              className={`btn-autoplay-sleek ${autoPlay ? 'active' : 'manual'} ${isLockedMidGame ? 'locked' : ''}`}
              onClick={toggleAutoPlay}
              title={
                isLockedMidGame
                  ? 'Mode is locked while game is in progress. Can be changed after game ends.'
                  : autoPlay
                  ? 'Auto-Play ON — click to switch to Manual'
                  : 'Manual Mode — click to switch to Auto-Play'
              }
            >
              <i className={`fa-solid ${isLockedMidGame ? 'fa-lock' : autoPlay ? 'fa-bolt' : 'fa-hand'}`}></i>
              <span>{autoPlay ? 'Auto Play' : 'Manual'}</span>
              {isLockedMidGame && <span className="autoplay-lock-pill">Lock</span>}
            </button>
          );
        })()}
      </div>

      {/* ── Cards Grid (1 or 2 equal side-by-side) ── */}
      <div className={gridClass}>
        {currentCards.map(card => (
          <NewCard5x5
            key={card.cardIndex}
            cells={card.data}
            cardIndex={card.cardIndex}
            cartelaId={card.id}
            theme={card.theme}
            label={card.label}
            isWinningCard={winResult !== null && winResult.winningCartelaNumber === card.id}
            winningLine={winResult?.winningLine || []}
            autoPlay={autoPlay}
            onDaub={handleManualDaub}
          />
        ))}
      </div>
    </div>
  );
};
