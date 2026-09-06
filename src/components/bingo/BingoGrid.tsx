import React from 'react';
import { useBingo, BingoCell } from '../../context/BingoContext.tsx';

const columns = [
  { letter: 'B', colorClass: 'col-b' },
  { letter: 'I', colorClass: 'col-i' },
  { letter: 'N', colorClass: 'col-n' },
  { letter: 'G', colorClass: 'col-g' },
  { letter: 'O', colorClass: 'col-o' }
];

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
  [4, 9, 14, 19, 24]
];

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

// Render Single 5x5 Card Grid Matrix
const Card5x5Matrix: React.FC<{
  cells: BingoCell[];
  cardIndex: number;
  cartelaId: number;
  isWinningCard: boolean;
  winningLine: number[];
  autoPlay: boolean;
  onDaub: (cardIdx: number, cellIdx: number) => void;
}> = ({ cells, cardIndex, isWinningCard, winningLine, autoPlay, onDaub }) => {
  return (
    <div className="cartela-5x5-matrix-wrap">
      {/* B I N G O Header Row */}
      <div className="cartela-header-cols-row">
        {columns.map(c => (
          <div key={c.letter} className={`cartela-col-hdr ${c.colorClass}`}>
            {c.letter}
          </div>
        ))}
      </div>

      {/* 5x5 Grid Cells */}
      <div className="cartela-5x5-grid">
        {cells.map(cell => {
          const isWinningCell = isWinningCard && winningLine.includes(cell.index);

          return (
            <div
              key={`${cardIndex}-${cell.index}`}
              className={`cartela-num-cell ${cell.marked ? 'daubed' : 'unmarked'} ${
                cell.isFree ? 'free-star-cell' : ''
              } ${isWinningCell ? 'winning-glow-cell' : ''}`}
              onClick={() => !autoPlay && onDaub(cardIndex, cell.index)}
            >
              {cell.isFree ? (
                <div className="free-cell-content">
                  <span className="star-icon">★</span>
                  <span className="free-lbl">FREE</span>
                </div>
              ) : (
                <>
                  <span className="cell-num-txt">{cell.val}</span>
                  {cell.marked && (
                    <div className="daub-stamp-circle">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const BingoGrid: React.FC = () => {
  const {
    cartela1Data,
    cartela2Data,
    cartela3Data,
    totalPlayableCards,
    activeCartelaIndex,
    setActiveCartelaIndex,
    selectedCartelaIds,
    handleManualDaub,
    winResult,
    autoPlay,
    openCartelaPicker,
    roundPhase,
    lobbyCountdown,
    waitingForPlayers,
    realPlayerCount
  } = useBingo();

  const c1Status = getCardStatus(cartela1Data);
  const c2Status = totalPlayableCards >= 2 ? getCardStatus(cartela2Data) : null;
  const c3Status = totalPlayableCards >= 3 ? getCardStatus(cartela3Data) : null;

  const currentCards = [
    { data: cartela1Data, id: selectedCartelaIds[0], status: c1Status, label: 'Card 1', isBonus: false },
    { data: cartela2Data, id: selectedCartelaIds[1], status: c2Status, label: 'Card 2', isBonus: false },
    { data: cartela3Data, id: selectedCartelaIds[2], status: c3Status, label: 'Card 3', isBonus: true }
  ].slice(0, totalPlayableCards);

  const activeCard = currentCards[activeCartelaIndex] || currentCards[0];
  const isLobby = roundPhase === 'lobby';

  return (
    <div className="fresh-cartela-play-card">
      {/* Top Header: Tabs for Multiple Cartelas (Card 1, Card 2, Card 3 Bonus) + TO GO badge */}
      <div className="cartela-card-header-bar">
        <div className="cartela-switch-tabs">
          {currentCards.map((c, idx) => (
            <button
              key={idx}
              type="button"
              className={`btn-cartela-tab ${activeCartelaIndex === idx ? 'active' : ''} ${c.isBonus ? 'bonus-tab' : ''}`}
              onClick={() => setActiveCartelaIndex(idx)}
            >
              <span>Card {idx + 1} #{c.id}</span>
              {c.isBonus && <span className="tab-bonus-star">🎁</span>}
            </button>
          ))}
        </div>

        {/* TO GO Pill Badge (Matches Reference Mockup) */}
        <div className={`cartela-togo-badge ${activeCard.status?.hot ? 'hot' : ''}`}>
          <span>{activeCard.status?.label || '2 TO GO'}</span>
        </div>
      </div>

      {/* If in lobby phase, show prominent round start countdown banner */}
      {isLobby && (
        <div className="cartela-lobby-waiting-banner" style={{
          background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
          border: '1.5px solid #facc15',
          borderRadius: '12px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          margin: '6px 0 10px',
          boxShadow: '0 2px 8px rgba(250, 204, 21, 0.2)'
        }}>
          <span className="pulse-green-dot"></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#854d0e' }}>
            ⏳ ROUND STARTS IN <strong style={{ color: '#b45309', fontSize: '0.875rem' }}>{lobbyCountdown}s</strong> ({waitingForPlayers ? `${realPlayerCount}/2 players` : `${realPlayerCount} Players`})
          </span>
        </div>
      )}

      {/* Bonus Card Banner when 3 cards active */}
      {totalPlayableCards >= 3 && activeCartelaIndex === 2 && (
        <div className="cartela-bonus-active-banner">
          <i className="fa-solid fa-gift gold"></i>
          <span>FREE BONUS CARTELA (Buy 2 Get 1 Free Promo)</span>
        </div>
      )}

      {/* 5x5 Matrix */}
      <Card5x5Matrix
        cells={activeCard.data}
        cardIndex={activeCartelaIndex}
        cartelaId={activeCard.id}
        isWinningCard={winResult !== null && winResult.winningCartelaNumber === activeCard.id}
        winningLine={winResult?.winningLine || []}
        autoPlay={autoPlay}
        onDaub={handleManualDaub}
      />

      {/* Auto-Play Indicator */}
      {autoPlay && (
        <div className="cartela-autoplay-active-tag">
          <i className="fa-solid fa-bolt"></i>
          <span>Auto-Play Active — All {totalPlayableCards} Cartelas daubed instantly</span>
        </div>
      )}
    </div>
  );
};
