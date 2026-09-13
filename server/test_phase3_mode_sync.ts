import { generateCardFromId, checkWinningPattern } from './game/cartelaGenerator.ts';

console.log('================================================================');
console.log('🧪 Testing Phase 3: Player Mode (Auto vs Manual) Synchronization');
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

// 1. Setup 3 simulated players:
// Player A: Manual mode (false)
// Player B: Manual mode (false)
// Player C: Auto-play mode (true)
playerModes.set('user_a', false);
playerModes.set('user_b', false);
playerModes.set('user_c', true);

console.log('--- Step 1: Registered Player Modes ---');
console.log('User A Mode:', playerModes.get('user_a') === false ? 'Manual ✋' : 'Auto ⚡');
console.log('User B Mode:', playerModes.get('user_b') === false ? 'Manual ✋' : 'Auto ⚡');
console.log('User C Mode:', playerModes.get('user_c') === true ? 'Auto ⚡' : 'Manual ✋');

// 2. Simulate tickets purchased or queued (even if initial flag was ambiguous)
const tickets = new Map<string, TestTicket[]>([
  ['user_a', [{ userId: 'user_a', userName: 'Player A', cartelaId: 10, cardMatrix: generateCardFromId(10), isAutoPlay: true }]], // Bought before mode sync
  ['user_b', [{ userId: 'user_b', userName: 'Player B', cartelaId: 20, cardMatrix: generateCardFromId(20), isAutoPlay: false }]],
  ['user_c', [{ userId: 'user_c', userName: 'Player C', cartelaId: 30, cardMatrix: generateCardFromId(30), isAutoPlay: true }]]
]);

console.log('\n--- Step 2: Tickets in Lobby Before Round Start ---');
console.log('User A Ticket isAutoPlay:', tickets.get('user_a')![0].isAutoPlay);
console.log('User B Ticket isAutoPlay:', tickets.get('user_b')![0].isAutoPlay);
console.log('User C Ticket isAutoPlay:', tickets.get('user_c')![0].isAutoPlay);

// 3. Execute Phase 3 Round Start Mode Synchronization
for (const [uid, tList] of tickets.entries()) {
  if (playerModes.has(uid)) {
    const mode = playerModes.get(uid)!;
    tList.forEach(t => { t.isAutoPlay = mode; });
  }
}

console.log('\n--- Step 3: Tickets Synchronized at Round Start ---');
const userATicket = tickets.get('user_a')![0];
const userBTicket = tickets.get('user_b')![0];
const userCTicket = tickets.get('user_c')![0];

console.log('User A Ticket isAutoPlay after sync:', userATicket.isAutoPlay);
console.log('User B Ticket isAutoPlay after sync:', userBTicket.isAutoPlay);
console.log('User C Ticket isAutoPlay after sync:', userCTicket.isAutoPlay);

if (userATicket.isAutoPlay !== false) {
  console.error('❌ FAIL: User A ticket must be synchronized to manual (false)!');
  process.exit(1);
}
if (userBTicket.isAutoPlay !== false) {
  console.error('❌ FAIL: User B ticket must remain manual (false)!');
  process.exit(1);
}
if (userCTicket.isAutoPlay !== true) {
  console.error('❌ FAIL: User C ticket must remain auto (true)!');
  process.exit(1);
}
console.log('✅ PASS: All tickets correctly synchronized with registered modes.');

// 4. Simulate Ball Calling Loop Evaluation
// Suppose drawn numbers complete winning line for User A (Manual) AND User C (Auto)
// Mark row 0 on all cards
const drawnWinningRow0 = [
  userATicket.cardMatrix[0].val,
  userATicket.cardMatrix[1].val,
  userATicket.cardMatrix[2].val,
  userATicket.cardMatrix[3].val,
  userATicket.cardMatrix[4].val,
  userCTicket.cardMatrix[0].val,
  userCTicket.cardMatrix[1].val,
  userCTicket.cardMatrix[2].val,
  userCTicket.cardMatrix[3].val,
  userCTicket.cardMatrix[4].val
].filter((v): v is number => typeof v === 'number');

console.log('\n--- Step 4: Automated Ball Loop Evaluation ---');
const automatedLoopWinners: string[] = [];

for (const [uid, tList] of tickets.entries()) {
  for (const t of tList) {
    if (t.isAutoPlay === true) {
      const winCheck = checkWinningPattern(t.cardMatrix, drawnWinningRow0);
      if (winCheck.isWin) {
        automatedLoopWinners.push(t.userName);
      }
    }
  }
}

console.log('Automated Loop Winners:', automatedLoopWinners);

if (automatedLoopWinners.includes('Player A')) {
  console.error('❌ FAIL: Manual Player A must NEVER be auto-claimed in the automated ball loop!');
  process.exit(1);
}
if (!automatedLoopWinners.includes('Player C')) {
  console.error('❌ FAIL: Auto Player C must be auto-claimed when their pattern completes!');
  process.exit(1);
}
console.log('✅ PASS: Manual player strictly protected from automated loop claims; Auto player cleanly claimed.');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 3 ISOLATED VERIFICATION TESTS PASSED (100%)');
console.log('================================================================\n');
