import React from 'react';
import { useBingo, BingoCell } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

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
  if (!Array.isArray(cells) || !cells.length) return { label: '2 TO GO', hot: false };
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
  isSingleCard?: boolean;
  isPreview?: boolean;
  onOpenPicker?: () => void;
}> = ({
  cells, cardIndex, cartelaId, label,
  isWinningCard, winningLine, autoPlay, onDaub,
  isSingleCard, isPreview, onOpenPicker
}) => {
  const { lang } = useLanguage();
  const status = getCardStatus(cells || []);

  // ── Unselected Cartela Placeholder (When user hasn't chosen cartelas yet) ──
  if (isPreview && (!cartelaId || cartelaId === 0 || !cells || cells.length === 0)) {
    return (
      <div
        className={`new-cartela-card empty-cartela-placeholder ${isSingleCard ? 'single-card' : ''}`}
        onClick={onOpenPicker}
        title="Tap to choose your cartela from 400 available boards"
      >
        <div className="empty-cartela-inner">
          <div className="empty-cartela-top">
            <span className="empty-cartela-badge">{lang === 'am' ? `ካርቴላ #${cardIndex + 1}` : `CARTELA #${cardIndex + 1}`}</span>
            <span className="empty-cartela-status">{lang === 'am' ? 'አልተመረጠም' : 'NOT SELECTED'}</span>
          </div>
          <div className="empty-cartela-icon-wrap">
            <span className="empty-cartela-icon">🎟️</span>
          </div>
          <div className="empty-cartela-title">
            {lang === 'am' ? 'ካርቴላ ለመምረጥ ይንኩ' : 'Tap to Choose Board'}
          </div>
          <div className="empty-cartela-sub">
            {lang === 'am' ? 'ከ400 ካርቴላዎች ውስጥ ይምረጡ' : 'Pick your number from 400 cartelas'}
          </div>
          <button
            type="button"
            className="btn-empty-cartela-cta"
            onClick={e => {
              e.stopPropagation();
              onOpenPicker?.();
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>{lang === 'am' ? 'ካርቴላ ይምረጡ' : 'Select Cartela'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`new-cartela-card ${isSingleCard ? 'single-card' : ''}`}>
      {/* ── Card Header Bar: Cartela #202 (Single-line, no overlap) ── */}
      <div className="new-card-header">
        <div
          className="new-card-header-left"
          onClick={isPreview && onOpenPicker ? onOpenPicker : undefined}
          style={{ cursor: isPreview ? 'pointer' : 'default' }}
          title={isPreview ? "Click to pick from 400 cartelas" : undefined}
        >
          <span className="new-card-header-label">{label}</span>
          {isPreview && <span className="new-card-preview-badge">PREVIEW</span>}
        </div>
        {isPreview && onOpenPicker && (
          <button
            type="button"
            className="btn-card-preview-shuffle"
            onClick={e => {
              e.stopPropagation();
              onOpenPicker();
            }}
            title="Choose from 400 cartelas"
          >
            🎟️ Pick
          </button>
        )}
        {!isPreview && status.hot && (
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
          {(Array.isArray(cells) ? cells : []).map(cell => {
            if (!cell || typeof cell.index !== 'number') return null;
            const safeWinningLine = Array.isArray(winningLine) ? winningLine : [];
            const isWinningCell = Boolean(isWinningCard && safeWinningLine.includes(cell.index));
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
    roundPhase,
    hasTicket,
    openCartelaPicker,
  } = useBingo();

  const isSingleCard = totalPlayableCards === 1;

  const currentCards = [
    {
      data: cartela1Data,
      id: selectedCartelaIds[0] || 0,
      cardIndex: 0,
      label: selectedCartelaIds[0] ? `Cartela #${selectedCartelaIds[0]}` : 'Cartela #1 (Unselected)',
    },
    {
      data: cartela2Data,
      id: selectedCartelaIds[1] || 0,
      cardIndex: 1,
      label: selectedCartelaIds[1] ? `Cartela #${selectedCartelaIds[1]}` : 'Cartela #2 (Unselected)',
    },
  ].slice(0, totalPlayableCards);

  return (
    <div className={`compact-cartelas-stack ${isSingleCard ? 'single-cartela' : 'dual-cartela'}`}>
      {currentCards.map(card => (
        <NewCard5x5
          key={card.cardIndex}
          cells={card.data}
          cardIndex={card.cardIndex}
          cartelaId={card.id}
          label={card.label}
          isWinningCard={roundPhase !== 'lobby' && winResult !== null && winResult.winningCartelaNumber === card.id}
          winningLine={Array.isArray(winResult?.winningLine) ? winResult.winningLine : []}
          autoPlay={autoPlay}
          onDaub={handleManualDaub}
          isSingleCard={isSingleCard}
          isPreview={roundPhase === 'lobby' && !hasTicket}
          onOpenPicker={openCartelaPicker}
        />
      ))}
    </div>
  );
};
