import { generateCardFromId, getAllWinningPatterns, BingoCell } from './game/cartelaGenerator.ts';

console.log('🧪 RUNNING STRICT CURRENT-BALL-ONLY CLAIM VERIFICATION');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`   ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`   ❌ FAIL: ${msg}`);
    failed++;
  }
}

// Prepare Card 1 (Cartela #1)
const card1 = generateCardFromId(1);

// Find first row pattern (cells 0, 1, 2, 3, 4)
const row1Cells = [card1[0], card1[1], card1[2], card1[3], card1[4]];
const row1Numbers = row1Cells.map(c => c.val).filter((v): v is number => typeof v === 'number');

console.log('Target winning line row 1 numbers:', row1Numbers);
const [n1, n2, n3, n4, nClosing] = row1Numbers;

// Scenario 1: Closing number nClosing is the EXACT current ball (Ball N)
const drawnBallsAtClosing = [99, 98, n1, n2, n3, n4, nClosing];
const currentBallAtClosing = nClosing;

// Server logic verification
const winsAtClosing = getAllWinningPatterns(card1, drawnBallsAtClosing);
assert(winsAtClosing.length > 0, 'Card 1 has completed winning pattern at closing ball');

const isAutoPlay = false;
let activeWinAtClosing = null;
if (!isAutoPlay) {
  activeWinAtClosing = winsAtClosing.find(w => w.numbers.includes(currentBallAtClosing));
}
assert(activeWinAtClosing !== null && activeWinAtClosing !== undefined, 'Scenario A: Claim on exact closing ball (Ball N) is ACCEPTED');

// Scenario 2: Next ball (Ball N+1) is called (e.g. 75), so nClosing is now the PREVIOUS ball
const nextBall = 75;
const drawnBallsAfterNext = [...drawnBallsAtClosing, nextBall];
const currentBallAfterNext = nextBall;

const winsAfterNext = getAllWinningPatterns(card1, drawnBallsAfterNext);
let activeWinAfterNext = null;
if (!isAutoPlay) {
  activeWinAfterNext = winsAfterNext.find(w => w.numbers.includes(currentBallAfterNext));
}
assert(activeWinAfterNext === undefined || activeWinAfterNext === null, 'Scenario B: Claim after next ball is called (previous ball passed) is REJECTED (Missed/Slept)');

// Scenario 3: Ball N+2 is called (e.g. 74)
const subsequentBall = 74;
const drawnBallsAfterTwo = [...drawnBallsAfterNext, subsequentBall];
const currentBallAfterTwo = subsequentBall;

const winsAfterTwo = getAllWinningPatterns(card1, drawnBallsAfterTwo);
let activeWinAfterTwo = null;
if (!isAutoPlay) {
  activeWinAfterTwo = winsAfterTwo.find(w => w.numbers.includes(currentBallAfterTwo));
}
assert(activeWinAfterTwo === undefined || activeWinAfterTwo === null, 'Scenario C: Claim after 2 balls have passed is REJECTED (Missed/Slept)');

// Scenario 4: A NEW pattern completes on Ball N+2 containing currentBallAfterTwo
// Let's mark another column containing subsequentBall
const customCard: BingoCell[] = generateCardFromId(2);
// Force column 1 to have subsequentBall
customCard[0].val = 1;
customCard[5].val = 2;
customCard[10].val = 3;
customCard[15].val = 4;
customCard[20].val = subsequentBall;

const customDrawn = [1, 2, 3, 4, subsequentBall];
const customWins = getAllWinningPatterns(customCard, customDrawn);
const customActive = customWins.find(w => w.numbers.includes(subsequentBall));
assert(customActive !== undefined && customActive !== null, 'Scenario D: A fresh pattern completed on the current ball is ACCEPTED');

console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
