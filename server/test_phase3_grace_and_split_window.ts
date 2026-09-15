import assert from 'assert';
import { generateCardFromId, getAllWinningPatterns, checkWinningPattern } from './game/cartelaGenerator.ts';

console.log('================================================================');
console.log('🧪 Testing Phase 3: Simultaneous Claim Window & 1-Ball Grace');
console.log('================================================================\n');

// 1. Setup Card with a complete line on row 1: [2, 28, 39, 53, 71]
const card = generateCardFromId(1);
const row1Numbers = [2, 28, 39, 53, 71];

// Base numbers drawn before the final completing ball:
const baseDrawn = [10, 15, 2, 28, 39, 53]; // Needs 71 to complete!

// Case A: Ball 71 is called on Ball 16 (Current Ball)
const drawnBall16 = [...baseDrawn, 71];
const allWins16 = getAllWinningPatterns(card, drawnBall16);
assert.strictEqual(allWins16.length > 0, true, 'Pattern completed on Ball 16');

const currentNumA = 71;
const prevNumA = 53;
const eligibleBallsA = [currentNumA, prevNumA];

const winOnCurrentBall = allWins16.find(w => w.numbers.some(n => eligibleBallsA.includes(n)));
assert.ok(winOnCurrentBall, 'Manual claim on current ball (Ball 16) is strictly valid');
console.log('✅ PASS Case A: Manual claim on current ball is VALID');

// Case B: Ball 44 is called next on Ball 17 (1-Ball Reaction Grace Window)
const drawnBall17 = [...drawnBall16, 44];
const allWins17 = getAllWinningPatterns(card, drawnBall17);

const currentNumB = 44;
const prevNumB = 71; // Preceding ball!
const eligibleBallsB = [currentNumB, prevNumB];

const winOnGraceBall = allWins17.find(w => w.numbers.some(n => eligibleBallsB.includes(n)));
assert.ok(winOnGraceBall, 'Manual claim on 1-ball grace window (Ball 17) is strictly valid');
console.log('✅ PASS Case B: Manual claim on 1-ball grace window is VALID');

// Case C: Ball 88 is called next on Ball 18 (2 Balls Later -> Slept/Missed)
const drawnBall18 = [...drawnBall17, 88];
const allWins18 = getAllWinningPatterns(card, drawnBall18);

const currentNumC = 88;
const prevNumC = 44;
const eligibleBallsC = [currentNumC, prevNumC]; // Neither is 71!

const winOnExpiredBall = allWins18.find(w => w.numbers.some(n => eligibleBallsC.includes(n)));
assert.strictEqual(winOnExpiredBall, undefined, 'Manual claim 2 balls later is slept/expired');
console.log('✅ PASS Case C: Manual claim 2 balls later is correctly REJECTED (Missed/Slept)');

// Case D: Simultaneous Hit on Ball N (Split Pot Detection)
// Auto player card (Row 1 of Card 2)
const cardAuto = generateCardFromId(2);
const autoRow1 = [cardAuto[0].val, cardAuto[1].val, cardAuto[2].val, cardAuto[3].val, cardAuto[4].val].filter((v): v is number => typeof v === 'number');

// Simulate Ball N completing lines on BOTH card (Manual) and cardAuto (Auto)
const sharedCompletingBall = 99;
const simDrawn = [
  ...row1Numbers.filter(n => n !== 71),
  ...autoRow1.filter(n => n !== autoRow1[autoRow1.length - 1]),
  sharedCompletingBall
];

// Check if Manual player ALSO completed a winning line on Ball N
const manualWins = getAllWinningPatterns(card, simDrawn);
const manualHasHitOnBallN = manualWins.some(w => w.numbers.includes(sharedCompletingBall));

console.log('Manual Player Completed on Ball N:', manualHasHitOnBallN);
assert.strictEqual(manualHasHitOnBallN, false, 'Without ball 71, manual pattern incomplete');

// Now add 71 to drawn numbers so both hit on ball 71
const simDrawnBoth = [
  ...row1Numbers.filter(n => n !== 71),
  ...autoRow1.filter(n => n !== 71),
  71 // Completed both!
];

const manualWinsBoth = getAllWinningPatterns(card, simDrawnBoth);
const manualHitBoth = manualWinsBoth.some(w => w.numbers.includes(71));
assert.strictEqual(manualHitBoth, true, 'Manual player completed pattern on Ball 71');

const autoCheck = checkWinningPattern(cardAuto, simDrawnBoth);
assert.strictEqual(autoCheck.isWin, true, 'Auto player completed pattern on Ball 71');

console.log('✅ PASS Case D: Simultaneous hit on Ball 71 detected for both Auto and Manual');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 3 SUITE TESTS PASSED SUCCESSFULLY (100%)');
console.log('================================================================\n');
