import assert from 'assert';
import { gameEngine } from '../game/BingoGameEngine.ts';
import { checkWinningPattern, generateCardFromId } from '../game/cartelaGenerator.ts';

console.log('================================================================');
console.log('🧪 Starting Phase 4 Verification Test: Ball Sequence & Timing');
console.log('================================================================\n');

const engine = gameEngine;
const room10 = engine.getRoom('room-10');
assert(room10, 'Room 10 must exist');

// Add a test real player ticket to room-10
const testRealCardId = 77;
const testRealCardMatrix = generateCardFromId(testRealCardId);
room10.tickets.set('test-user-p4', [{
  userId: 'test-user-p4',
  userName: 'Abebe Tester',
  cartelaId: testRealCardId,
  cardMatrix: testRealCardMatrix,
  betAmount: 10,
  socketId: 'sock-p4',
  isAutoPlay: true
}]);

// Sync bots to ensure 50 bots are active
(engine as any).syncRoom10StandbyBots(room10);
assert.strictEqual(room10.opponentCards.length, 50, 'Room 10 must have 50 bots');

console.log(`1. Room 10 State: 1 Real Ticket + ${room10.opponentCards.length} Standby Bots`);
console.log('2. Running 50 Full Consecutive Round Sequence Generations...\n');

const ROUNDS = 50;
const startTotal = Date.now();
const finishBalls: number[] = [];

for (let r = 1; r <= ROUNDS; r++) {
  // Alternate targeting: real winner vs bot winner
  room10.targetWinnerType = r % 2 === 0 ? 'real' : 'bot';

  const tStart = Date.now();
  const sequence: number[] = (engine as any).prepareBallSequence(room10);
  const duration = Date.now() - tStart;

  // 1. Verify sequence length is exactly 75
  assert.strictEqual(sequence.length, 75, `Round ${r}: Sequence length must be 75, got ${sequence.length}`);

  // 2. Verify all 75 balls are unique (1 to 75)
  const uniqueBalls = new Set(sequence);
  assert.strictEqual(uniqueBalls.size, 75, `Round ${r}: Must contain 75 unique balls, got ${uniqueBalls.size}`);

  // Verify all numbers from 1 to 75 are present
  for (let b = 1; b <= 75; b++) {
    assert(uniqueBalls.has(b), `Round ${r}: Missing ball #${b}`);
  }

  // 3. Verify Target Finish Ball Timing (between 15 and 25)
  const finishBall = room10.targetFinishBall;
  assert(finishBall >= 15 && finishBall <= 25, `Round ${r}: targetFinishBall must be between 15 and 25, got ${finishBall}`);
  finishBalls.push(finishBall);

  // 4. Verify that sequence popped from the end matches the order
  // (In prepareBallSequence, sequence is reversed so .pop() draws balls 1 to 75)
  const drawnOrder = [...sequence].reverse();

  // 5. Verify Target Winner completes on finishBall
  // Check balls drawn up to finishBall - 1: NO win allowed
  if (room10.targetWinnerType === 'real') {
    const ballsBeforeFinish = drawnOrder.slice(0, finishBall - 1);
    const prematureCheck = checkWinningPattern(testRealCardMatrix, ballsBeforeFinish);
    assert.strictEqual(prematureCheck.isWin, false, `Round ${r}: Real winner won prematurely on ball ${finishBall - 1}`);

    const ballsAtFinish = drawnOrder.slice(0, finishBall);
    const winAtFinishCheck = checkWinningPattern(testRealCardMatrix, ballsAtFinish);
    assert.strictEqual(winAtFinishCheck.isWin, true, `Round ${r}: Real winner must win exactly on ball ${finishBall}`);
  } else {
    // A bot was chosen: verify the specific designated targetCardMatrix
    const targetBotCard = (room10 as any).targetCardMatrix;
    assert(targetBotCard, `Round ${r}: targetCardMatrix must be recorded on room10`);

    const ballsBeforeFinish = drawnOrder.slice(0, finishBall - 1);
    const prematureBotCheck = checkWinningPattern(targetBotCard, ballsBeforeFinish);
    assert.strictEqual(prematureBotCheck.isWin, false, `Round ${r}: Target winning bot won prematurely on ball ${finishBall - 1}`);

    const ballsAtFinish = drawnOrder.slice(0, finishBall);
    const winAtFinishCheck = checkWinningPattern(targetBotCard, ballsAtFinish);
    assert.strictEqual(winAtFinishCheck.isWin, true, `Round ${r}: Target winning bot must win exactly on ball ${finishBall}`);

    // Verify real player did NOT win prematurely
    const prematureRealCheck = checkWinningPattern(testRealCardMatrix, ballsBeforeFinish);
    assert.strictEqual(prematureRealCheck.isWin, false, `Round ${r}: Real player won prematurely during bot win`);
  }

  // Speed assertion
  assert(duration < 50, `Round ${r}: Sequence generation took too long (${duration}ms)`);
}

const totalTime = Date.now() - startTotal;
const avgTime = totalTime / ROUNDS;

console.log(`   ✅ 50/50 Rounds Completed Successfully in ${totalTime}ms (Avg: ${avgTime.toFixed(1)}ms per round)`);
console.log(`   ✅ Every single round generated all 75 unique balls (1 to 75) with 0 missing numbers`);
console.log(`   ✅ Winner strictly completes between Ball 15 and Ball 25 in all 50 rounds`);
console.log(`   ✅ Min finish ball: ${Math.min(...finishBalls)}, Max finish ball: ${Math.max(...finishBalls)}`);
console.log(`   ✅ 0 premature wins detected before targetFinishBall`);

// Clean up
room10.tickets.delete('test-user-p4');
(engine as any).syncRoom10StandbyBots(room10, true);

console.log('\n================================================================');
console.log('🎉 PHASE 4 VERIFICATION COMPLETE: ALL ASSERTIONS PASSED (100%)');
console.log('================================================================');
process.exit(0);
