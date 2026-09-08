import React from 'react';
import { useBingo, BingoCell } from '../../context/BingoContext.tsx';

// ── Column headers with distinct standard bingo colors ─────
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

// ── Card status helper ─────────────────────────────────────
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

const NewCard5x5: React.FC<{
  cells: BingoCell[];
  cardIndex: number;
  cartelaId: number;
  label: string;
  isWinningCard: boolean;
  winningLine: number[];
  autoPlay: boolean;
  onDaub: (cardIdx: number, cellIdx: number) => void;
}> = ({
  cells, cardIndex, cartelaId, label,
  isWinningCard, winningLine, autoPlay, onDaub
}) => {
  const status = getCardStatus(cells);

  return (
    <div className="new-cartela-card">
      {/* ── Card Header Bar: Cartela #202 (matches screenshot) ── */}
      <div className="new-card-header">
        <span className="new-card-header-label">{label}</span>
        {status.hot && (
          <span className={`new-card-status-pill ${status.label.includes('BINGO') ? 'bingo' : 'hot'}`}>
            {status.label}
          </span>
        )}
      </div>

      {/* ── Card Body: B I N G O letters + 5×5 grid ── */}
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
                  !autoPlay && !cell.marked ? 'interactive-tap' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => !autoPlay && onDaub(cardIndex, cell.index)}
              >
                {cell.isFree ? (
                  /* FREE center cell with golden star */
                  <div className="new-free-content">
                    <span className="new-free-star">⭐</span>
                  </div>
                ) : (
                  /* Number cell (green background if daubed, white if normal) */
                  <span className={cell.marked ? 'daubed-number' : 'cell-number'}>
                    {cell.val}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Main BingoGrid Export ──────────────────────────────────
export const BingoGrid: React.FC = () => {
  const {
    cartela1Data,
    cartela2Data,
    totalPlayableCards,
    selectedCartelaIds,
    handleManualDaub,
    winResult,
    autoPlay,
  } = useBingo();

  const currentCards = [
    {
      data: cartela1Data,
      id: selectedCartelaIds[0],
      cardIndex: 0,
      label: `Cartela #${selectedCartelaIds[0]}`,
    },
    {
      data: cartela2Data,
      id: selectedCartelaIds[1],
      cardIndex: 1,
      label: `Cartela #${selectedCartelaIds[1]}`,
    },
  ].slice(0, totalPlayableCards);

  return (
    <div className="compact-cartelas-stack">
      {currentCards.map(card => (
        <NewCard5x5
          key={card.cardIndex}
          cells={card.data}
          cardIndex={card.cardIndex}
          cartelaId={card.id}
          label={card.label}
          isWinningCard={winResult !== null && winResult.winningCartelaNumber === card.id}
          winningLine={winResult?.winningLine || []}
          autoPlay={autoPlay}
          onDaub={handleManualDaub}
        />
      ))}
    </div>
  );
};
