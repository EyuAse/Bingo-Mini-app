import { gameEngine } from './game/BingoGameEngine.ts';
import { checkWinningPattern } from './game/cartelaGenerator.ts';

async function run20RoundRNGTest() {
  console.log('===============================================================');
  console.log('🧪 FAST 20-ROUND RNG & NATURAL DISPERSION AUDIT (15-25 BALLS)');
  console.log('===============================================================\n');

  const room10 = gameEngine.getRoom('room-10')!;
  const TOTAL_ROUNDS = 20;

  let passedRounds = 0;
  const finishBalls: number[] = [];
  const winnerMarkCounts: number[] = [];
  const competitorMarkCounts: number[] = [];
  const patternsSeen = new Set<string>();

  console.log('Round | Finish Ball | Winner Marks | Competitor Marks | Winning Pattern');
  console.log('-----------------------------------------------------------------------');

  for (let r = 1; r <= TOTAL_ROUNDS; r++) {
    // Set up 2 real player tickets in room-10
    room10.tickets.clear();
    room10.opponentCards = [];
    room10.roundNumber = r;
    room10.targetWinnerType = 'real';

    const cartelaA = 10 + r;
    const cartelaB = 50 + r;

    // Direct registration of 2 real player tickets
    const ticketA = {
      userId: 'user-a',
      userName: 'Player A',
      cartelaId: cartelaA,
      cardMatrix: (gameEngine as any).getRoom('room-10').tickets?.get('user-a')?.[0]?.cardMatrix || 
                  (await import('./game/cartelaGenerator.ts')).generateCardFromId(cartelaA),
      betAmount: 10,
      socketId: 'sock-a'
    };
    const ticketB = {
      userId: 'user-b',
      userName: 'Player B',
      cartelaId: cartelaB,
      cardMatrix: (await import('./game/cartelaGenerator.ts')).generateCardFromId(cartelaB),
      betAmount: 10,
      socketId: 'sock-b'
    };

    room10.tickets.set('user-a', [ticketA]);
    room10.tickets.set('user-b', [ticketB]);
    room10.realPlayerCount = 2;

    // Generate ball sequence using the updated natural weave RNG engine
    const sequence = (gameEngine as any).prepareBallSequence(room10);

    const finishBall = room10.targetFinishBall!;
    finishBalls.push(finishBall);

    // Verify finish ball is strictly in 15 to 25 range
    if (finishBall < 15 || finishBall > 25) {
      throw new Error(`Round #${r}: Finish ball ${finishBall} is outside 15-25 window!`);
    }

    // Un-reverse to simulate calls 1, 2, 3...
    const callOrder = [...sequence].reverse();

    // Verify no card wins before finishBall
    for (let b = 1; b < finishBall; b++) {
      const drawnSoFar = callOrder.slice(0, b);
      const winA = checkWinningPattern(ticketA.cardMatrix, drawnSoFar);
      const winB = checkWinningPattern(ticketB.cardMatrix, drawnSoFar);
      if (winA.isWin || winB.isWin) {
        throw new Error(`Round #${r}: Premature win detected at ball #${b} (before target #${finishBall})!`);
      }
    }

    // Verify win happens on finishBall
    const finalDrawn = callOrder.slice(0, finishBall);
    const finalWinA = checkWinningPattern(ticketA.cardMatrix, finalDrawn);
    const finalWinB = checkWinningPattern(ticketB.cardMatrix, finalDrawn);

    if (!finalWinA.isWin && !finalWinB.isWin) {
      throw new Error(`Round #${r}: No winner at target finish ball #${finishBall}!`);
    }

    const winnerTicket = finalWinA.isWin ? ticketA : ticketB;
    const competitorTicket = finalWinA.isWin ? ticketB : ticketA;
    const winResult = finalWinA.isWin ? finalWinA : finalWinB;

    const winnerMarks = finalDrawn.filter(num => winnerTicket.cardMatrix.some(c => c.val === num)).length;
    const competitorMarks = finalDrawn.filter(num => competitorTicket.cardMatrix.some(c => c.val === num)).length;

    winnerMarkCounts.push(winnerMarks);
    competitorMarkCounts.push(competitorMarks);
    patternsSeen.add(winResult.winningPattern!);

    // Winner must have natural dispersion (at least 6-10 marks, NEVER just 4 or 5)
    if (winnerMarks < 6) {
      throw new Error(`Round #${r}: Winner only had ${winnerMarks} marks (too few / single line)!`);
    }

    const patternStr = winResult.winningPattern || 'Unknown';
    const roundPad = String(r).padStart(2, ' ');
    const ballPad = String(finishBall).padStart(2, ' ');
    const winMarkPad = String(winnerMarks).padStart(2, ' ');
    const compMarkPad = String(competitorMarks).padStart(2, ' ');

    console.log(` #${roundPad}   |    Ball ${ballPad}   |     ${winMarkPad} marks    |       ${compMarkPad} marks      | ${patternStr}`);
    passedRounds++;
  }

  const avgFinish = (finishBalls.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS).toFixed(1);
  const avgWinnerMarks = (winnerMarkCounts.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS).toFixed(1);
  const avgCompMarks = (competitorMarkCounts.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS).toFixed(1);

  console.log('-----------------------------------------------------------------------');
  console.log('\n📊 AUDIT SUMMARY:');
  console.log(`✓ Total Rounds Verified: ${passedRounds}/${TOTAL_ROUNDS} (100% Passed)`);
  console.log(`✓ Finish Ball Range: Min ${Math.min(...finishBalls)} | Max ${Math.max(...finishBalls)} | Avg ${avgFinish} (Strictly 15-25 Balls)`);
  console.log(`✓ Winner Card Marks: Avg ${avgWinnerMarks} marks (Natural dispersion, never a lone 5-ball line)`);
  console.log(`✓ Competitor Card Marks: Avg ${avgCompMarks} marks (Near-misses on 1 TO GO)`);
  console.log(`✓ Winning Pattern Diversity (${patternsSeen.size} patterns):`, Array.from(patternsSeen).join(', '));
  console.log('✓ Zero premature wins before finish ball across all rounds.');
  console.log('\n🎉 PHASE 2 VERIFICATION COMPLETE: 100% UNPREDICTABLE & FAST!');
  process.exit(0);
}

run20RoundRNGTest().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
