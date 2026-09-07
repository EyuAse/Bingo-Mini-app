import React from 'react';
import { useBingo, BingoCell } from '../../context/BingoContext.tsx';

const WIN_PATTERNS = [
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
  // Horizontal Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Vertical Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24]
];

interface OneToGoInfo {
  cardLabel: string;
  cartelaId: number;
  neededBalls: Array<{ col: string; num: number }>;
}

export const OneToGoAlert: React.FC = () => {
  const {
    roundPhase,
    hasTicket,
    cartela1Data,
    cartela2Data,
    cartela3Data,
    totalPlayableCards,
    selectedCartelaIds
  } = useBingo();

  if (!hasTicket || roundPhase !== 'playing') {
    return null;
  }

  const cardsToCheck = [
    { data: cartela1Data, id: selectedCartelaIds[0], label: 'Card 1' },
    ...(totalPlayableCards >= 2 ? [{ data: cartela2Data, id: selectedCartelaIds[1], label: 'Card 2' }] : [])
  ];

  // Scan for any card that has 4/5 marked in any pattern (and not yet 5/5 bingo)
  const oneToGoList: OneToGoInfo[] = [];

  for (const card of cardsToCheck) {
    if (!card.data || card.data.length < 25) continue;

    // Check if card already has a full 5/5 win
    const hasBingo = WIN_PATTERNS.some(p => p.every(idx => card.data[idx]?.marked));
    if (hasBingo) continue;

    const neededSet = new Map<number, { col: string; num: number }>();

    for (const pattern of WIN_PATTERNS) {
      const markedCount = pattern.filter(idx => card.data[idx]?.marked).length;
      if (markedCount === 4) {
        // Find the one remaining cell in this pattern
        const missingIdx = pattern.find(idx => !card.data[idx]?.marked);
        if (missingIdx !== undefined) {
          const cell = card.data[missingIdx];
          if (cell && typeof cell.val === 'number') {
            neededSet.set(cell.val, { col: cell.colLetter, num: cell.val });
          }
        }
      }
    }

    if (neededSet.size > 0) {
      oneToGoList.push({
        cardLabel: card.label,
        cartelaId: card.id,
        neededBalls: Array.from(neededSet.values()).slice(0, 3)
      });
    }
  }

  if (oneToGoList.length === 0) {
    return null;
  }

  const primary = oneToGoList[0];

  return (
    <div className="one-to-go-alert-banner">
      <div className="one-to-go-flame-icon">
        <i className="fa-solid fa-fire-flame-curved"></i>
      </div>
      <div className="one-to-go-content">
        <div className="one-to-go-heading">
          <span className="one-to-go-title">1 TO GO!</span>
          <span className="one-to-go-card-pill">
            {primary.cardLabel} #{primary.cartelaId}
          </span>
        </div>
        <div className="one-to-go-needed-row">
          <span className="one-to-go-sub">Need ball:</span>
          <div className="needed-balls-chips">
            {primary.neededBalls.map(b => (
              <span key={b.num} className={`needed-ball-chip col-${b.col.toLowerCase()}`}>
                {b.col}-{b.num}
              </span>
            ))}
          </div>
          <span className="one-to-go-suffix">for BINGO!</span>
        </div>
      </div>
    </div>
  );
};
