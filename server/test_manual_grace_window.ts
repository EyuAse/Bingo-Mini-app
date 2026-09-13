import { generateCardFromId, getAllWinningPatterns, checkWinningPattern } from './game/cartelaGenerator.ts';

console.log('================================================================');
console.log('🧪 Testing Phase 1: Manual Bingo 1-Ball Latency Grace Window & Split Pot');
console.log('================================================================\n');

// 1. Generate test cards
const card1 = generateCardFromId(1);
const card2 = generateCardFromId(2);

// Card 1 Diagonal: indices 0, 6, 12 (FREE), 18, 24
const diagIndices = [0, 6, 12, 18, 24];
const diagNums = diagIndices.filter(i => i !== 12).map(i => card1[i].val as number);

console.log('Card 1 Diagonal numbers:', diagNums);

const priorBalls = diagNums.slice(0, 3);
const winningBall = diagNums[3];

// Scenario A: Pattern completes on winningBall (Current Ball = winningBall)
const drawnBallsAtWin = [...priorBalls, 77, 78, winningBall];
const currentBallA = winningBall;
const prevBallA = 78;
const eligibleBallsA = [currentBallA, prevBallA];

const allWinsA = getAllWinningPatterns(card1, drawnBallsAtWin);
const isClaimValidA = allWinsA.some(w => eligibleBallsA.some(b => w.numbers.includes(b)));

console.log('\n--- Scenario A: Claim arrives on exact Current Ball (Ball N) ---');
console.log(`Current Ball: ${currentBallA}, Prev Ball: ${prevBallA}`);
console.log(`Eligible Balls: [${eligibleBallsA.join(', ')}]`);
console.log('Is Claim Accepted?:', isClaimValidA);
if (!isClaimValidA) {
  console.error('❌ FAIL: Claim on current ball must be accepted!');
  process.exit(1);
}
console.log('✅ PASS: Immediate claim on Ball N accepted.');

// Scenario B: Next ball drawn (Ball N+1) before manual claim packet arrives (Network Latency)
const nextBallB = 33; // not in diagonal
const drawnBallsAtNext = [...drawnBallsAtWin, nextBallB];
const currentBallB = nextBallB;
const prevBallB = winningBall; // winningBall is now Ball N-1!
const eligibleBallsB = [currentBallB, prevBallB];

const allWinsB = getAllWinningPatterns(card1, drawnBallsAtNext);
const isClaimValidB = allWinsB.some(w => eligibleBallsB.some(b => w.numbers.includes(b)));

console.log('\n--- Scenario B: Claim arrives on next ball (Ball N+1) due to 100-300ms transit latency ---');
console.log(`Current Ball: ${currentBallB}, Prev Ball (Buffer): ${prevBallB}`);
console.log(`Eligible Balls: [${eligibleBallsB.join(', ')}]`);
console.log('Is Claim Accepted under 1-Ball Buffer?:', isClaimValidB);
if (!isClaimValidB) {
  console.error('❌ FAIL: 1-Ball buffer must accept claims from the immediately preceding ball!');
  process.exit(1);
}
console.log('✅ PASS: Latency-buffered claim on Ball N-1 successfully accepted!');

// Scenario C: 2 or more balls have passed (Ball N+2) without claiming -> SLEEPING BINGO
const ballTwoPassed = 61; // another unrelated ball
const drawnBallsTwoPassed = [...drawnBallsAtNext, ballTwoPassed];
const currentBallC = ballTwoPassed;
const prevBallC = nextBallB; // winningBall is now Ball N-2, OUTSIDE 1-ball buffer
const eligibleBallsC = [currentBallC, prevBallC];

const allWinsC = getAllWinningPatterns(card1, drawnBallsTwoPassed);
const isClaimValidC = allWinsC.some(w => eligibleBallsC.some(b => w.numbers.includes(b)));

console.log('\n--- Scenario C: Claim arrives 2 balls later (Ball N+2) -> Sleeping Bingo ---');
console.log(`Current Ball: ${currentBallC}, Prev Ball: ${prevBallC}`);
console.log(`Eligible Balls: [${eligibleBallsC.join(', ')}]`);
console.log('Is Claim Accepted after 2 balls?:', isClaimValidC);
if (isClaimValidC) {
  console.error('❌ FAIL: Sleeping pattern must be rejected when 2 or more balls pass!');
  process.exit(1);
}
console.log('✅ PASS: Sleeping Bingo correctly rejected after 1-ball window expires.');

// Scenario D: Manual Split Pot Guard
// Player 1 claims legitimately on eligible ball
// Player 2 is in manual mode (isAutoPlay = false) with an old slept pattern
// Verify Player 2 does NOT get awarded an unearned split pot
console.log('\n--- Scenario D: Manual Split Pot Guard Verification ---');
const player2IsAutoPlay = false;
const player2AllWins = getAllWinningPatterns(card1, drawnBallsTwoPassed);
const player2EligibleWin = player2AllWins.find(w => eligibleBallsC.some(b => w.numbers.includes(b)));
const player2QualifiesForSplit = player2IsAutoPlay ? checkWinningPattern(card1, drawnBallsTwoPassed).isWin : !!player2EligibleWin;

console.log('Player 2 (Manual, slept pattern) qualifies for split?:', player2QualifiesForSplit);
if (player2QualifiesForSplit) {
  console.error('❌ FAIL: Manual player with slept pattern must NOT receive automatic split pot!');
  process.exit(1);
}
console.log('✅ PASS: Manual player with slept pattern correctly excluded from split pot.');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 1 ISOLATED VERIFICATION TESTS PASSED (100%)');
console.log('================================================================\n');
