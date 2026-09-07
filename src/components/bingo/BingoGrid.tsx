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

// ── Single Card 5x5 Matrix Component ──────────────────────
// IMPORTANT: cardIndex must be 0, 1, or 2 — passed directly to
// handleManualDaub(cardIndex, cellIndex) so the right card is daubed.
const NewCard5x5: React.FC<{
  cells: BingoCell[];
  cardIndex: number;
  cartelaId: number;
  theme: string;
  label: string;
  isBonus: boolean;
  isWinningCard: boolean;
  winningLine: number[];
  autoPlay: boolean;
  onDaub: (cardIdx: number, cellIdx: number) => void;
}> = ({
  cells, cardIndex, cartelaId, theme, label, isBonus,
  isWinningCard, winningLine, autoPlay, onDaub
}) => {
  const status = getCardStatus(cells);

  return (
    <div className={`new-cartela-card ${theme}`}>

      {/* ── Card Header Bar ── */}
      <div className="new-card-header">
        <span className="new-card-header-label">
          {label}
          {isBonus && <span className="card-bonus-tag"> 🎁</span>}
        </span>
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
                ].filter(Boolean).join(' ')}
                onClick={() => !autoPlay && onDaub(cardIndex, cell.index)}
              >
                {cell.isFree ? (
                  /* FREE centre cell */
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

        {/* Status badge — only show when 1 card (space constraint) */}
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
    handleManualDaub,   // ← untouched: (cardIdx, cellIdx) => void
    winResult,          // ← untouched: null | { winningCartelaNumber, winningLine }
    autoPlay,           // ← untouched: boolean
    toggleAutoPlay,     // ← untouched: () => void
    roundPhase,
    lobbyCountdown,
    waitingForPlayers,
    realPlayerCount,
  } = useBingo();

  // Build card list — slice to how many cards player has
  const currentCards = [
    {
      data: cartela1Data,
      id: selectedCartelaIds[0],
      cardIndex: 0,                   // MUST be 0 for handleManualDaub
      theme: CARD_THEMES[0],
      label: 'Card 1',
      isBonus: false,
    },
    {
      data: cartela2Data,
      id: selectedCartelaIds[1],
      cardIndex: 1,                   // MUST be 1 for handleManualDaub
      theme: CARD_THEMES[1],
      label: 'Card 2',
      isBonus: false,
    },
    {
      data: cartela3Data,
      id: selectedCartelaIds[2],
      cardIndex: 2,                   // MUST be 2 for handleManualDaub
      theme: CARD_THEMES[2],
      label: 'Card 3',
      isBonus: true,
    },
  ].slice(0, totalPlayableCards);

  const isLobby = roundPhase === 'lobby';
  const cardCountLabel = `${totalPlayableCards} ${totalPlayableCards === 1 ? 'Card' : 'Cards'}`;
  const gridClass = `cartelas-grid grid-${totalPlayableCards}`;

  return (
    <div className="your-cartelas-section">

      {/* ── Section Header ── */}
      <div className="your-cartelas-header">
        <div className="your-cartelas-icon">🎴</div>
        <span className="your-cartelas-title">YOUR CARTELAS</span>
        <span className="your-cartelas-count-badge">{cardCountLabel}</span>
        <div className="your-cartelas-spacer" />

        {/* Auto Play toggle — toggleAutoPlay logic 100% untouched */}
        <button
          type="button"
          className={`btn-autoplay-new ${autoPlay ? 'autoplay-on' : ''}`}
          onClick={toggleAutoPlay}
          title={autoPlay ? 'Auto-Play ON — click to switch to Manual' : 'Turn on Auto-Play'}
        >
          <i className="fa-solid fa-bolt"></i>
          <span>{autoPlay ? 'Auto ON' : 'Auto Play'}</span>
        </button>
      </div>

      {/* ── Lobby countdown strip ── */}
      {isLobby && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(250,204,21,0.12), rgba(250,204,21,0.06))',
          border: '1px solid rgba(250,204,21,0.25)',
          borderRadius: '10px',
          padding: '7px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '0.875rem' }}>⏳</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#fde68a', lineHeight: 1.3 }}>
            {waitingForPlayers
              ? `WAITING FOR PLAYERS — ${realPlayerCount}/2 Joined`
              : `ROUND STARTS IN ${lobbyCountdown}s · ${realPlayerCount} Players Ready`}
          </span>
        </div>
      )}

      {/* ── All Cards — simultaneous side-by-side grid ── */}
      <div className={gridClass}>
        {currentCards.map(card => (
          <NewCard5x5
            key={card.cardIndex}
            cells={card.data}
            cardIndex={card.cardIndex}
            cartelaId={card.id}
            theme={card.theme}
            label={card.label}
            isBonus={card.isBonus}
            isWinningCard={winResult !== null && winResult.winningCartelaNumber === card.id}
            winningLine={winResult?.winningLine || []}
            autoPlay={autoPlay}
            onDaub={handleManualDaub}
          />
        ))}
      </div>

      {/* ── Auto-Play active indicator ── */}
      {autoPlay && (
        <div className="new-autoplay-active-tag">
          <i className="fa-solid fa-bolt"></i>
          <span>Auto-Play Active — All {totalPlayableCards} Cartelas daubed instantly</span>
        </div>
      )}

    </div>
  );
};
