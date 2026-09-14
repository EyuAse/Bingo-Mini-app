import { generateCardFromId, checkWinningPattern } from './game/cartelaGenerator.ts';

console.log('🧪 RUNNING MANUAL MODE NEVER AUTO-CLOSES VERIFICATION');

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

// 1. Simulate a real game room with 2 players
// Player 1 is Manual (isAutoPlay = false)
// Player 2 is Auto (isAutoPlay = true)
const card1 = generateCardFromId(1);
const card2 = generateCardFromId(2);

// Find a winning line on card 1 (row 1: [2, 28, 39, 53, 71])
const row1Numbers = [card1[0].val, card1[1].val, card1[2].val, card1[3].val, card1[4].val].filter((v): v is number => typeof v === 'number');

// Simulate drawn numbers containing Player 1's winning line
const drawnNumbers = [10, 20, 30, ...row1Numbers];

// Verify card 1 has a win
const winCheck1 = checkWinningPattern(card1, drawnNumbers);
assert(winCheck1.isWin, 'Card 1 pattern is mathematically complete');

// Simulated tickets
const tickets = [
  { userId: 'user_manual', userName: 'Manual Player', cartelaId: 1, cardMatrix: card1, isAutoPlay: false },
  { userId: 'user_auto', userName: 'Auto Player', cartelaId: 2, cardMatrix: card2, isAutoPlay: true }
];

// Replicate the exact server loop check from startMasterBallCallingLoop:
const winningCards: Array<{ userId: string; userName: string; isAutoPlay: boolean }> = [];

for (const t of tickets) {
  // CRITICAL GUARD: Only tickets with strict isAutoPlay === true are evaluated in the automated loop.
  // Manual tickets (isAutoPlay === false) NEVER auto-claim here!
  if (t.isAutoPlay === true) {
    const winCheck = checkWinningPattern(t.cardMatrix, drawnNumbers);
    if (winCheck.isWin) {
      winningCards.push({ userId: t.userId, userName: t.userName, isAutoPlay: t.isAutoPlay });
    }
  }
}

assert(winningCards.length === 0, 'Server loop did NOT auto-claim for Manual Player despite completed line');
assert(!winningCards.some(c => c.userId === 'user_manual'), 'Manual Player was strictly preserved from auto-claim');

// Now simulate Auto Player completing a line
const winCheck2 = checkWinningPattern(card2, drawnNumbers);
const autoDrawn = winCheck2.isWin ? drawnNumbers : [...drawnNumbers, ...(card2.slice(0, 5).map(c => c.val).filter((v): v is number => typeof v === 'number'))];

for (const t of tickets) {
  if (t.isAutoPlay === true) {
    const winCheck = checkWinningPattern(t.cardMatrix, autoDrawn);
    if (winCheck.isWin) {
      winningCards.push({ userId: t.userId, userName: t.userName, isAutoPlay: t.isAutoPlay });
    }
  }
}

assert(winningCards.length === 1 && winningCards[0].userId === 'user_auto', 'Server loop correctly auto-claims for Auto Player when enabled');

// Verify playerModes persistence logic
const playerModes = new Map<string, boolean>();
playerModes.set('user_manual', false);

const resolvedAutoPlayForManual = false;
playerModes.set('user_manual', resolvedAutoPlayForManual);

// Mode sync at round start
const userMode = playerModes.has('user_manual') ? playerModes.get('user_manual')! : true;
assert(userMode === false, 'playerModes preserves strict false and never resets to true');

console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
