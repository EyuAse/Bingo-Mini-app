import assert from 'assert';
import { gameEngine } from '../game/BingoGameEngine.ts';
import { checkWinningPattern, generateCardFromId } from '../game/cartelaGenerator.ts';

console.log('================================================================');
console.log('🧪 Starting Phase 4 Verification: Dynamic Ball Sequence & Timing');
console.log('================================================================\n');

const engine = gameEngine;
const room10 = engine.getRoom('room-10');
assert(room10, 'Room 10 must exist');

// Test Cartela matrices
const realCard1Id = 101;
const realCard1Matrix = generateCardFromId(realCard1Id);
const realCard2Id = 102;
const realCard2Matrix = generateCardFromId(realCard2Id);

// Test across dynamic bot counts
const BOT_COUNTS_TO_TEST = [0, 2, 5, 12, 25, 40, 50];

console.log('--- Test Suite 1: Sequence Invariants across Dynamic Bot Counts [0, 2, 5, 12, 25, 40, 50] ---');

for (const botCount of BOT_COUNTS_TO_TEST) {
  // Set bot config for Room 10
  engine.setBotConfig({
    mode: botCount === 0 ? 'disabled' : 'dynamic',
    targetStandbyBots: botCount,
    minStandbyBots: botCount,
    maxStandbyBots: botCount
  });

  // Clear existing tickets and sync bots
  room10.tickets.clear();
  (engine as any).syncRoom10StandbyBots(room10, true);
  assert.strictEqual(
    room10.opponentCards.length,
    botCount,
    `Room 10 bot count mismatch: expected ${botCount}, got ${room10.opponentCards.length}`
  );

  // Add 1 real player ticket
  room10.tickets.set('real-player-1', [{
    userId: 'real-player-1',
    userName: 'Tester Almaz',
    cartelaId: realCard1Id,
    cardMatrix: realCard1Matrix,
    betAmount: 10,
    socketId: 'sock-1',
    isAutoPlay: true
  }]);

  if (botCount === 0) {
    // When B=0, add a second real player so room has >= 2 players
    room10.tickets.set('real-player-2', [{
      userId: 'real-player-2',
      userName: 'Tester Bekele',
      cartelaId: realCard2Id,
      cardMatrix: realCard2Matrix,
      betAmount: 10,
      socketId: 'sock-2',
      isAutoPlay: true
    }]);
  }

  // Run 10 sequence iterations for each bot count
  const ITERATIONS = 10;
  for (let it = 1; it <= ITERATIONS; it++) {
    // Alternate winner targeting if bots present, otherwise real winner
    const targetType = botCount === 0 ? 'real' : (it % 2 === 0 ? 'real' : 'bot');
    room10.targetWinnerType = targetType;

    const t0 = Date.now();
    const sequence: number[] = (engine as any).prepareBallSequence(room10);
    const elapsed = Date.now() - t0;

    // 1. Length must be 75
    assert.strictEqual(sequence.length, 75, `[B=${botCount}, it=${it}] Sequence length must be 75`);

    // 2. All 75 balls must be unique (1 to 75)
    const uniqueBalls = new Set(sequence);
    assert.strictEqual(uniqueBalls.size, 75, `[B=${botCount}, it=${it}] Must have 75 unique balls`);
    for (let b = 1; b <= 75; b++) {
      assert(uniqueBalls.has(b), `[B=${botCount}, it=${it}] Missing ball #${b}`);
    }

    // 3. Target finish ball must be between 15 and 25
    const finishBall = room10.targetFinishBall;
    assert(finishBall >= 15 && finishBall <= 25, `[B=${botCount}, it=${it}] finishBall out of range: ${finishBall}`);

    // Sequence pop order is reversed
    const drawnOrder = [...sequence].reverse();

    // 4. Invariant: target winner must win exactly on finishBall, never prematurely
    const targetCard = (room10 as any).targetCardMatrix;
    assert(targetCard, `[B=${botCount}, it=${it}] Target card matrix must be assigned`);

    const ballsBeforeFinish = drawnOrder.slice(0, finishBall - 1);
    const prematureWin = checkWinningPattern(targetCard, ballsBeforeFinish);
    assert.strictEqual(prematureWin.isWin, false, `[B=${botCount}, it=${it}] Target winner won prematurely on ball ${finishBall - 1}`);

    const ballsAtFinish = drawnOrder.slice(0, finishBall);
    const winAtFinish = checkWinningPattern(targetCard, ballsAtFinish);
    assert.strictEqual(winAtFinish.isWin, true, `[B=${botCount}, it=${it}] Target winner must win on ball ${finishBall}`);

    // Verify no competing card (human or guarded bot) won prematurely before finishBall
    const allCompetingCards: any[] = [];
    if (botCount === 0) {
      if (targetCard !== realCard1Matrix) allCompetingCards.push(realCard1Matrix);
      if (targetCard !== realCard2Matrix) allCompetingCards.push(realCard2Matrix);
    } else {
      if (targetCard !== realCard1Matrix) allCompetingCards.push(realCard1Matrix);
      room10.opponentCards.slice(0, 5).forEach(o => {
        if (o.cardMatrix !== targetCard) allCompetingCards.push(o.cardMatrix);
      });
    }

    for (const compCard of allCompetingCards) {
      const compPremature = checkWinningPattern(compCard, ballsBeforeFinish);
      assert.strictEqual(
        compPremature.isWin,
        false,
        `[B=${botCount}, it=${it}] Competing card won prematurely on ball ${finishBall - 1}`
      );
    }

    assert(elapsed < 50, `[B=${botCount}, it=${it}] Sequence generation exceeded 50ms: ${elapsed}ms`);
  }

  console.log(`   ✅ Bot Count B=${botCount.toString().padStart(2, ' ')}: 10/10 rounds passed all 75-ball & timing invariants`);
}

console.log('\n--- Test Suite 2: Multi-House Master Sequence Weaver (Room 10 + Room 50) ---');

// Setup Room 10 with 15 dynamic bots and 1 real player
engine.setBotConfig({
  mode: 'dynamic',
  targetStandbyBots: 15,
  minStandbyBots: 15,
  maxStandbyBots: 15
});
room10.tickets.clear();
(engine as any).syncRoom10StandbyBots(room10, true);
room10.tickets.set('user-r10', [{
  userId: 'user-r10',
  userName: 'R10 Real Player',
  cartelaId: 301,
  cardMatrix: generateCardFromId(301),
  betAmount: 10,
  socketId: 'sock-r10',
  isAutoPlay: true
}]);
room10.targetWinnerType = 'real';

// Setup Room 50 with 2 real players and 0 bots (P2P Isolation)
const room50 = engine.getRoom('room-50');
assert(room50, 'Room 50 must exist');
room50.opponentCards = [];
room50.tickets.clear();
room50.tickets.set('user-r50-a', [{
  userId: 'user-r50-a',
  userName: 'R50 Human A',
  cartelaId: 302,
  cardMatrix: generateCardFromId(302),
  betAmount: 50,
  socketId: 'sock-r50-a',
  isAutoPlay: true
}]);
room50.tickets.set('user-r50-b', [{
  userId: 'user-r50-b',
  userName: 'R50 Human B',
  cartelaId: 303,
  cardMatrix: generateCardFromId(303),
  betAmount: 50,
  socketId: 'sock-r50-b',
  isAutoPlay: true
}]);
room50.targetWinnerType = 'real';

assert.strictEqual(room50.opponentCards.length, 0, 'Room 50 must have strictly 0 bots');

// Generate synchronized Master Ball Sequence for both houses
const masterSeq: number[] = (engine as any).prepareMasterBallSequence([room10, room50]);

assert.strictEqual(masterSeq.length, 75, 'Master sequence length must be 75');
const uniqueMaster = new Set(masterSeq);
assert.strictEqual(uniqueMaster.size, 75, 'Master sequence must contain all 75 unique balls');
for (let b = 1; b <= 75; b++) {
  assert(uniqueMaster.has(b), `Master sequence missing ball #${b}`);
}

// Master sequence pop order
const masterDrawn = [...masterSeq].reverse();

// Verify Room 10 finish
assert(room10.targetFinishBall >= 15 && room10.targetFinishBall <= 25, 'Room 10 finish ball range');
const r10TargetCard = (room10 as any).targetCardMatrix;
const r10Premature = checkWinningPattern(r10TargetCard, masterDrawn.slice(0, room10.targetFinishBall - 1));
assert.strictEqual(r10Premature.isWin, false, 'Room 10 target winner must not win prematurely');
const r10AtFinish = checkWinningPattern(r10TargetCard, masterDrawn.slice(0, room10.targetFinishBall));
assert.strictEqual(r10AtFinish.isWin, true, 'Room 10 target winner must win on finish ball');

// Verify Room 50 finish
assert(room50.targetFinishBall >= 15 && room50.targetFinishBall <= 25, 'Room 50 finish ball range');
const r50TargetCard = (room50 as any).targetCardMatrix;
const r50Premature = checkWinningPattern(r50TargetCard, masterDrawn.slice(0, room50.targetFinishBall - 1));
assert.strictEqual(r50Premature.isWin, false, 'Room 50 target winner must not win prematurely');
const r50AtFinish = checkWinningPattern(r50TargetCard, masterDrawn.slice(0, room50.targetFinishBall));
assert.strictEqual(r50AtFinish.isWin, true, 'Room 50 target winner must win on finish ball');

console.log(`   ✅ Master Sequence: 75 unique balls safely synchronized across Room 10 (15 bots) & Room 50 (0 bots)`);
console.log(`   ✅ Room 10 finish: Ball #${room10.targetFinishBall}, Room 50 finish: Ball #${room50.targetFinishBall}`);

console.log('\n--- Test Suite 3: Multi-Room P2P Isolation (Rooms 20, 50, 100) ---');

for (const p2pRoomId of ['room-20', 'room-50', 'room-100']) {
  const room = engine.getRoom(p2pRoomId);
  assert(room, `Room ${p2pRoomId} must exist`);
  assert.strictEqual(room.opponentCards.length, 0, `${p2pRoomId} must have 0 bots in opponentCards`);

  // Setup 2 real players
  room.tickets.clear();
  room.tickets.set('human-1', [{
    userId: 'human-1',
    userName: 'Player One',
    cartelaId: 401,
    cardMatrix: generateCardFromId(401),
    betAmount: room.stakeAmount,
    socketId: 'sock-h1',
    isAutoPlay: true
  }]);
  room.tickets.set('human-2', [{
    userId: 'human-2',
    userName: 'Player Two',
    cartelaId: 402,
    cardMatrix: generateCardFromId(402),
    betAmount: room.stakeAmount,
    socketId: 'sock-h2',
    isAutoPlay: true
  }]);
  room.targetWinnerType = 'real';

  const seq = (engine as any).prepareBallSequence(room);
  assert.strictEqual(seq.length, 75, `${p2pRoomId}: sequence length must be 75`);
  assert.strictEqual(new Set(seq).size, 75, `${p2pRoomId}: sequence must have 75 unique balls`);
  assert.strictEqual(room.opponentCards.length, 0, `${p2pRoomId}: bots must remain strictly 0`);

  // Clean up
  room.tickets.clear();
  console.log(`   ✅ ${p2pRoomId} P2P Isolation: 0 bots, 75 unique balls generated cleanly`);
}

// Cleanup Room 10
room10.tickets.clear();
engine.setBotConfig({
  mode: 'dynamic',
  targetStandbyBots: 20,
  minStandbyBots: 0,
  maxStandbyBots: 50
});
(engine as any).syncRoom10StandbyBots(room10, true);

console.log('\n================================================================');
console.log('🎉 PHASE 4 VERIFICATION COMPLETE: ALL ASSERTIONS PASSED (100%)');
console.log('================================================================');
process.exit(0);
