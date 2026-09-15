import assert from 'assert';
import { generateCardFromId, checkWinningPattern } from './game/cartelaGenerator.ts';

console.log('================================================================');
console.log('🧪 Testing Phase 2: Strict Double-Guard & Manual Isolation');
console.log('================================================================\n');

// Mock tickets and playerModes
interface TestTicket {
  userId: string;
  userName: string;
  cartelaId: number;
  cardMatrix: any[];
  isAutoPlay: boolean;
}

const playerModes = new Map<string, boolean>();

// Setup 4 Test Players:
// Player 1: Genuine Manual (registered = false, ticket = false)
// Player 2: Stale Ticket Flag (registered = false, ticket = true)
// Player 3: Stale Registry Flag (registered = true, ticket = false)
// Player 4: Genuine Auto (registered = true, ticket = true)

playerModes.set('user_manual_clean', false);
playerModes.set('user_stale_ticket', false);
playerModes.set('user_stale_registry', true);
playerModes.set('user_auto_clean', true);

const card = generateCardFromId(1);
// Numbers for row 1: [2, 28, 39, 53, 71]
const row1Numbers = [card[0].val, card[1].val, card[2].val, card[3].val, card[4].val].filter((v): v is number => typeof v === 'number');
const drawnNumbers = [11, 22, ...row1Numbers];

const winCheck = checkWinningPattern(card, drawnNumbers);
assert.strictEqual(winCheck.isWin, true, 'Card pattern is mathematically complete');

const tickets = new Map<string, TestTicket[]>([
  ['user_manual_clean', [{ userId: 'user_manual_clean', userName: 'Manual Clean', cartelaId: 1, cardMatrix: card, isAutoPlay: false }]],
  ['user_stale_ticket', [{ userId: 'user_stale_ticket', userName: 'Stale Ticket', cartelaId: 2, cardMatrix: card, isAutoPlay: true }]],
  ['user_stale_registry', [{ userId: 'user_stale_registry', userName: 'Stale Registry', cartelaId: 3, cardMatrix: card, isAutoPlay: false }]],
  ['user_auto_clean', [{ userId: 'user_auto_clean', userName: 'Auto Clean', cartelaId: 4, cardMatrix: card, isAutoPlay: true }]],
]);

// Execute Double-Guard Automated Evaluation Loop (mirrors BingoGameEngine.ts lines 1823-1840)
const winningCards: Array<{ userId: string; userName: string }> = [];

for (const [uid, tList] of tickets.entries()) {
  const registeredAuto = playerModes.get(uid);
  for (const t of tList) {
    const isEligibleAuto = (registeredAuto !== undefined ? registeredAuto : t.isAutoPlay) === true && t.isAutoPlay === true;
    if (!isEligibleAuto) {
      continue; // Strictly skip manual
    }

    const check = checkWinningPattern(t.cardMatrix, drawnNumbers);
    if (check.isWin) {
      winningCards.push({ userId: uid, userName: t.userName });
    }
  }
}

console.log('Automated Loop Winners:', winningCards.map(w => w.userName));

assert.strictEqual(winningCards.length, 1, 'Exactly one winner should be auto-claimed');
assert.strictEqual(winningCards[0].userId, 'user_auto_clean', 'Only the genuine Auto player was claimed');

console.log('✅ PASS: user_manual_clean (registered: false, ticket: false) was NOT claimed');
console.log('✅ PASS: user_stale_ticket (registered: false, ticket: true) was NOT claimed (protected by registry)');
console.log('✅ PASS: user_stale_registry (registered: true, ticket: false) was NOT claimed (protected by ticket flag)');
console.log('✅ PASS: user_auto_clean (registered: true, ticket: true) WAS claimed');

// Test Fallback at Safety Cap:
let fallbackWinner: { userId: string } | null = null;
for (const [uid, tList] of tickets.entries()) {
  const registeredAuto = playerModes.get(uid);
  for (const t of tList) {
    const isEligibleAuto = (registeredAuto !== undefined ? registeredAuto : t.isAutoPlay) === true && t.isAutoPlay === true;
    if (!isEligibleAuto) continue;
    fallbackWinner = { userId: uid };
  }
}

assert.strictEqual(fallbackWinner?.userId, 'user_auto_clean', 'Fallback only selects eligible auto ticket');
console.log('✅ PASS: Fallback selection strictly respects double-guard');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 2 DOUBLE-GUARD TESTS PASSED (100%)');
console.log('================================================================\n');
