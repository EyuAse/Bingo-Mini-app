import { gameEngine } from '../server/game/BingoGameEngine.ts';
import { generateCardFromId, checkWinningPattern } from '../server/game/cartelaGenerator.ts';

async function testMultiplePlayersScaling() {
  console.log('🧪 Testing Multi-Player Scaling with 5, 10, and 15 Players...');

  const playerCounts = [3, 5, 8, 12, 16];

  for (const count of playerCounts) {
    console.log(`\nTesting with ${count} total players (1 real winner + ${count - 1} competitors)...`);

    for (let r = 1; r <= 20; r++) {
      const room: any = {
        id: 'room-10',
        roundNumber: r,
        phase: 'playing',
        tickets: new Map(),
        opponentCards: [],
        targetWinnerType: 'real',
        stakeAmount: 10,
        totalPot: count * 10,
        houseFee: 0,
        winnerPayout: count * 10
      };

      const allCards: { id: number; matrix: any; name: string }[] = [];
      for (let p = 1; p <= count; p++) {
        const cartelaId = p * 13;
        const matrix = generateCardFromId(cartelaId);
        allCards.push({ id: cartelaId, matrix, name: `Player ${p}` });

        room.tickets.set(`user-${p}`, [{
          userId: `user-${p}`,
          userName: `Player ${p}`,
          cartelaId: cartelaId,
          cardMatrix: matrix,
          betAmount: 10,
          purchasedAt: Date.now()
        }]);
      }

      const sequence = (gameEngine as any).prepareBallSequence(room);
      const targetFinish = room.targetFinishBall;

      const drawn: number[] = [];
      while (sequence.length > 0) {
        const ball = sequence.pop()!;
        drawn.push(ball);

        if (drawn.length < targetFinish) {
          for (const card of allCards) {
            if (checkWinningPattern(card.matrix, drawn).isWin) {
              throw new Error(`❌ Premature win by ${card.name} at ball ${drawn.length} (target: ${targetFinish})!`);
            }
          }
        } else if (drawn.length === targetFinish) {
          const winners = allCards.filter(c => checkWinningPattern(c.matrix, drawn).isWin);
          if (winners.length === 0) {
            throw new Error(`❌ No winner at target finish ball ${targetFinish}!`);
          }
          break;
        }
      }
    }
    console.log(`   ✅ 20/20 rounds passed for ${count} players without any premature wins!`);
  }

  console.log('\n🎉 ALL MULTI-PLAYER SCALING AUDITS PASSED 100%!');
}

testMultiplePlayersScaling().catch(err => {
  console.error(err);
  process.exit(1);
});
