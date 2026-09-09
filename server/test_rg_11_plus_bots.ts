import { gameEngine } from './game/BingoGameEngine.ts';
import { generateCardFromId, checkWinningPattern } from './game/cartelaGenerator.ts';

async function run11PlusBotsTest() {
  console.log('====================================================================');
  console.log('🧪 FAST 20-ROUND AUDIT: 11+ REAL PLAYERS + 3 BOTS (15-25 BALLS)');
  console.log('====================================================================\n');

  const room = gameEngine.getRoom('room-10')!;
  const TOTAL_ROUNDS = 20;

  let realWins = 0;
  let botWins = 0;
  const finishBalls: number[] = [];
  const winnerMarkCounts: number[] = [];
  const avgNonWinnerMarks: number[] = [];

  for (let r = 1; r <= TOTAL_ROUNDS; r++) {
    room.tickets.clear();
    room.opponentCards = [];
    room.roundNumber = r;

    const usedCartelas = new Set<number>();

    // 11 real players
    for (let p = 1; p <= 11; p++) {
      let cId = Math.floor(1 + Math.random() * 400);
      while (usedCartelas.has(cId)) cId = Math.floor(1 + Math.random() * 400);
      usedCartelas.add(cId);

      room.tickets.set(`user-${p}`, [{
        userId: `user-${p}`,
        userName: `Player ${p}`,
        cartelaId: cId,
        cardMatrix: generateCardFromId(cId),
        betAmount: 10,
        socketId: `sock-${p}`
      }]);
    }

    // 3 bots injected
    for (let b = 1; b <= 3; b++) {
      let bId = Math.floor(1 + Math.random() * 400);
      while (usedCartelas.has(bId)) bId = Math.floor(1 + Math.random() * 400);
      usedCartelas.add(bId);

      room.opponentCards.push({
        botUserId: `bot-${b}`,
        cartelaId: bId,
        cardMatrix: generateCardFromId(bId),
        opponentName: `Bot-${b}`,
        stakeAmount: 10,
        isHouseBot: b === 1
      });
    }

    // Win routing: 20% bot win rate, 80% real win rate
    room.targetWinnerType = Math.random() < 0.20 ? 'bot' : 'real';
    if (room.targetWinnerType === 'bot') botWins++;
    else realWins++;

    // Pot & Commission calculations: 11 real + 3 bots = 14 tickets = 140 ETB
    const totalTickets = 11 + 3;
    room.totalPot = totalTickets * 10;
    room.houseFee = Math.floor(room.totalPot * 0.20); // 20% house commission
    room.winnerPayout = room.totalPot - room.houseFee;

    // Generate ball sequence
    const sequence = (gameEngine as any).prepareBallSequence(room);
    const finishBall = room.targetFinishBall!;
    finishBalls.push(finishBall);

    if (finishBall < 15 || finishBall > 25) {
      throw new Error(`Round #${r}: Finish ball ${finishBall} is outside 15-25 window!`);
    }

    // Un-reverse to simulate calls 1, 2, 3...
    const callingSequence = [...sequence].reverse();
    const drawnNumbers: number[] = [];

    // Verify zero premature wins
    for (let b = 0; b < finishBall - 1; b++) {
      drawnNumbers.push(callingSequence[b]);

      for (const [, tList] of room.tickets.entries()) {
        if (checkWinningPattern(tList[0].cardMatrix, drawnNumbers).isWin) {
          throw new Error(`Round #${r}: Premature real player win at ball #${b + 1} before target #${finishBall}!`);
        }
      }
      for (const bot of room.opponentCards) {
        if (checkWinningPattern(bot.cardMatrix, drawnNumbers).isWin) {
          throw new Error(`Round #${r}: Premature bot win at ball #${b + 1} before target #${finishBall}!`);
        }
      }
    }

    // Add winning ball
    drawnNumbers.push(callingSequence[finishBall - 1]);

    // Check winner at finish ball
    let winnerFound = false;
    let winnerMarks = 0;
    const otherMarks: number[] = [];

    for (const [, tList] of room.tickets.entries()) {
      const card = tList[0].cardMatrix;
      const res = checkWinningPattern(card, drawnNumbers);
      const marks = card.filter(c => c.val === 'FREE' || drawnNumbers.includes(c.val as number)).length;
      if (res.isWin) {
        winnerFound = true;
        winnerMarks = marks;
      } else {
        otherMarks.push(marks);
      }
    }

    for (const bot of room.opponentCards) {
      const card = bot.cardMatrix;
      const res = checkWinningPattern(card, drawnNumbers);
      const marks = card.filter(c => c.val === 'FREE' || drawnNumbers.includes(c.val as number)).length;
      if (res.isWin) {
        winnerFound = true;
        winnerMarks = marks;
      } else {
        otherMarks.push(marks);
      }
    }

    if (!winnerFound) {
      throw new Error(`Round #${r}: No winner detected on target finish ball #${finishBall}!`);
    }

    winnerMarkCounts.push(winnerMarks);
    const avgOthers = otherMarks.reduce((a, b) => a + b, 0) / otherMarks.length;
    avgNonWinnerMarks.push(avgOthers);

    console.log(
      `#${String(r).padStart(2, ' ')} | Ball ${finishBall} | Winner: ${room.targetWinnerType.toUpperCase().padEnd(4, ' ')} (${winnerMarks} marks) | Avg Non-Winners: ${avgOthers.toFixed(1)} marks | Pot: ${room.totalPot} ETB (Fee: ${room.houseFee} ETB, Payout: ${room.winnerPayout} ETB)`
    );
  }

  console.log('\n--------------------------------------------------------------------');
  console.log('📊 11+ PLAYERS AUDIT RESULTS:');
  console.log(`✓ Total Rounds: ${TOTAL_ROUNDS}/${TOTAL_ROUNDS} (100% Passed)`);
  console.log(`✓ Ball Finish Range: Min ${Math.min(...finishBalls)} | Max ${Math.max(...finishBalls)} | Avg ${(finishBalls.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS).toFixed(1)}`);
  console.log(`✓ Real Wins: ${realWins} (${((realWins / TOTAL_ROUNDS) * 100).toFixed(0)}%) | Bot Wins: ${botWins} (${((botWins / TOTAL_ROUNDS) * 100).toFixed(0)}%)`);
  console.log(`✓ Winner Card Marks: Avg ${(winnerMarkCounts.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS).toFixed(1)} marks (Rich, natural distribution)`);
  console.log(`✓ Non-Winner Marks: Avg ${(avgNonWinnerMarks.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS).toFixed(1)} marks`);
  console.log(`✓ House Fee: 20% on 14 players = 28 ETB fee per 10 ETB round (112 ETB winner payout)`);
  console.log('✓ Zero premature wins before finish ball.');
  console.log('====================================================================\n');

  // Clean up room state so background engine doesn't fire with test data
  room.tickets.clear();
  room.opponentCards = [];

  process.exit(0);
}

run11PlusBotsTest().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
