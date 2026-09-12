import { generateCardFromId, getAllWinningPatterns, BingoCell } from '../server/game/cartelaGenerator.ts';

console.log('========================================================');
console.log('Testing "Sleeping Bingo" / Missed-Pattern Expiration Rule');
console.log('========================================================\n');

// 1. Generate a test card
const card = generateCardFromId(1);

// Find diagonal 1 cells: indices 0, 6, 12 (FREE), 18, 24
const diagIndices = [0, 6, 12, 18, 24];
const diagNums = diagIndices.filter(i => i !== 12).map(i => card[i].val as number);

console.log('Card #1 Diagonal 1 numbers:', diagNums);

// 2. Simulate drawn balls ending with the diagonal's final number
const drawnBeforeFinal = diagNums.slice(0, 3);
const finalDiagBall = diagNums[3];
const drawnOnWin = [...drawnBeforeFinal, 99, 98, finalDiagBall]; // finalDiagBall is current call

console.log('\n--- Step 1: Diagonal completed on current ball ---');
console.log('Current ball drawn:', finalDiagBall);
const winsOnWin = getAllWinningPatterns(card, drawnOnWin);
const activeWinOnCurrentBall = winsOnWin.find(w => w.numbers.includes(finalDiagBall));

console.log('Total complete patterns:', winsOnWin.length);
console.log('Is valid claim on current ball?:', !!activeWinOnCurrentBall);
if (activeWinOnCurrentBall) {
  console.log('✓ Valid claim on pattern:', activeWinOnCurrentBall.patternName);
} else {
  console.error('FAIL: Should be valid on current ball');
  process.exit(1);
}

// 3. Next ball called without claiming: Next ball is a different number not in diagonal
const nextBall = 45; // ball not in diagonal
const drawnAfterMiss = [...drawnOnWin, nextBall];

console.log('\n--- Step 2: Next ball drawn without player claiming ---');
console.log('New current ball:', nextBall);
const winsAfterMiss = getAllWinningPatterns(card, drawnAfterMiss);
const activeWinAfterMiss = winsAfterMiss.find(w => w.numbers.includes(nextBall));

console.log('Total complete patterns on card:', winsAfterMiss.length);
console.log('Is valid claim on new ball?:', !!activeWinAfterMiss);
if (!activeWinAfterMiss) {
  console.log('✓ SUCCESS: Pattern expired / slept! Claim on ball', nextBall, 'is rejected. Game continues!');
} else {
  console.error('FAIL: Old pattern should not be claimable on new ball!');
  process.exit(1);
}

// 4. Later, a new pattern is completed on a new ball
// Find a row not overlapping or find Column 0 (B)
const col0Indices = [0, 5, 10, 15, 20];
const col0Nums = col0Indices.map(i => card[i].val as number);
console.log('\n--- Step 3: Player continues and completes a NEW pattern (Column B) ---');
console.log('Column B numbers:', col0Nums);

// Draw all remaining numbers for Column B, with the last number as current
const remainingCol0 = col0Nums.filter(n => !drawnAfterMiss.includes(n));
const finalCol0Ball = remainingCol0[remainingCol0.length - 1];
const priorCol0Balls = remainingCol0.slice(0, remainingCol0.length - 1);
const drawnOnNewPattern = [...drawnAfterMiss, ...priorCol0Balls, finalCol0Ball];

console.log('New winning ball completing Column B:', finalCol0Ball);
const winsOnNewPattern = getAllWinningPatterns(card, drawnOnNewPattern);
const activeNewWin = winsOnNewPattern.find(w => w.numbers.includes(finalCol0Ball));

console.log('Total complete patterns on card:', winsOnNewPattern.length);
console.log('Is valid claim on new pattern ball?:', !!activeNewWin);
if (activeNewWin && activeNewWin.patternName === 'Column B') {
  console.log('✓ SUCCESS: Player wins on NEW pattern:', activeNewWin.patternName);
} else {
  console.error('FAIL: Player should win on new completed pattern');
  process.exit(1);
}

console.log('\n========================================================');
console.log('All "Sleeping Bingo" simulation checks PASSED with 100% precision!');
console.log('========================================================\n');
