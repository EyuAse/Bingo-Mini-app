import assert from 'assert';
import { gameEngine } from '../game/BingoGameEngine.ts';
import { STANDBY_BOT_COUNT } from '../game/ethiopianBotRoster.ts';

console.log('================================================================');
console.log('🧪 Starting Phase 2 Verification Test: Room 10 50-Bot Lobby & Pot');
console.log('================================================================\n');

const engine = gameEngine;
const room10 = engine.getRoom('room-10');
assert(room10, 'Room 10 must exist');

// 1. Verify 50 Standby Bots Pre-Seeded in Room 10
console.log('1. Checking Room 10 Standby Bot Count in Lobby...');
assert.strictEqual(room10.opponentCards.length, STANDBY_BOT_COUNT, `Expected ${STANDBY_BOT_COUNT} standby bots in Room 10, got ${room10.opponentCards.length}`);
console.log(`   ✅ Room 10 has exactly ${room10.opponentCards.length} standby bots`);

// Verify all 50 bots have valid cartela IDs between 1 and 400 with 0 collisions
const botCartelaIds = new Set(room10.opponentCards.map(o => o.cartelaId));
assert.strictEqual(botCartelaIds.size, 50, `Expected 50 distinct cartela IDs among bots, got ${botCartelaIds.size}`);
for (const cid of botCartelaIds) {
  assert(cid >= 1 && cid <= 400, `Cartela ID ${cid} outside valid 1-400 range`);
}
console.log(`   ✅ All 50 bot cartelas are valid (1-400) with 0 duplicate collisions\n`);

// 2. Verify Baseline Pot & Payout (0 Real Players)
console.log('2. Checking Baseline Pot & Payout with 50 Standby Bots (0 Real Players)...');
assert.strictEqual(room10.totalPot, 500, `Expected 500 ETB baseline pot (50 * 10), got ${room10.totalPot}`);
assert.strictEqual(room10.houseFee, 100, `Expected 100 ETB house fee (20% of 500), got ${room10.houseFee}`);
assert.strictEqual(room10.winnerPayout, 400, `Expected 400 ETB winner payout (500 - 100), got ${room10.winnerPayout}`);
console.log(`   ✅ Gross Pot = ${room10.totalPot} ETB`);
console.log(`   ✅ House Fee (20%) = ${room10.houseFee} ETB`);
console.log(`   ✅ Net Derash Payout = ${room10.winnerPayout} ETB\n`);

// 3. Verify Pot & Payout with 1 Real Player (1 Cartela)
console.log('3. Checking Pot & Payout with 1 Real Player (10 ETB Bet)...');
const testUserId = 'test-player-phase2';
room10.tickets.set(testUserId, [{
  userId: testUserId,
  userName: 'Test Human',
  cartelaId: 399,
  cardMatrix: [],
  betAmount: 10,
  socketId: 'test-socket-1',
  isAutoPlay: true
}]);

(engine as any).recalculatePot(room10);

assert.strictEqual(room10.totalPot, 510, `Expected 510 ETB pot (50 bots * 10 + 1 player * 10), got ${room10.totalPot}`);
assert.strictEqual(room10.houseFee, 102, `Expected 102 ETB house fee (20% of 510), got ${room10.houseFee}`);
assert.strictEqual(room10.winnerPayout, 408, `Expected 408 ETB winner payout (510 - 102), got ${room10.winnerPayout}`);
console.log(`   ✅ 1 Real Player + 50 Bots Gross Pot = ${room10.totalPot} ETB`);
console.log(`   ✅ 1 Real Player + 50 Bots House Fee = ${room10.houseFee} ETB`);
console.log(`   ✅ 1 Real Player + 50 Bots Net Payout = ${room10.winnerPayout} ETB (40.8x return!)\n`);

// Clean up test player ticket
room10.tickets.delete(testUserId);
(engine as any).recalculatePot(room10);

// 4. Verify Dynamic Bot Cartela Auto-Yielding
console.log('4. Testing Bot Auto-Yielding when Human Requests Bot-Held Cartelas...');
// Pick 2 cartela IDs currently held by bots
const targetedBot1 = room10.opponentCards[0];
const targetedBot2 = room10.opponentCards[1];
const targetId1 = targetedBot1.cartelaId;
const targetId2 = targetedBot2.cartelaId;

console.log(`   Targeting Bot "${targetedBot1.opponentName}" Cartela #${targetId1} and Bot "${targetedBot2.opponentName}" Cartela #${targetId2}`);

// Trigger human player card purchase requesting these 2 exact cartelas
(engine as any).syncRoom10StandbyBots(room10); // initial sync
// Simulate tickets selection conflict check
room10.tickets.set('human-yielding-tester', [
  {
    userId: 'human-yielding-tester',
    userName: 'Alemayehu',
    cartelaId: targetId1,
    cardMatrix: [],
    betAmount: 10,
    socketId: 'sock-1'
  },
  {
    userId: 'human-yielding-tester',
    userName: 'Alemayehu',
    cartelaId: targetId2,
    cardMatrix: [],
    betAmount: 10,
    socketId: 'sock-1'
  }
]);

// Trigger bot yielding check
(engine as any).syncRoom10StandbyBots(room10);

// Assert targeted bots surrendered the conflicting cartelas and received new ones
const newBot1 = room10.opponentCards.find(o => o.botUserId === targetedBot1.botUserId);
const newBot2 = room10.opponentCards.find(o => o.botUserId === targetedBot2.botUserId);

assert(newBot1 && newBot1.cartelaId !== targetId1, `Bot 1 should have surrendered #${targetId1}, still has #${newBot1?.cartelaId}`);
assert(newBot2 && newBot2.cartelaId !== targetId2, `Bot 2 should have surrendered #${targetId2}, still has #${newBot2?.cartelaId}`);
console.log(`   ✅ Bot 1 surrendered Cartela #${targetId1} -> received new Cartela #${newBot1.cartelaId}`);
console.log(`   ✅ Bot 2 surrendered Cartela #${targetId2} -> received new Cartela #${newBot2.cartelaId}`);

// Clean up
room10.tickets.delete('human-yielding-tester');
(engine as any).syncRoom10StandbyBots(room10, true);

// 5. Strict Room Isolation Audit (Rooms 20, 50, 100 must be 100% 0 bots)
console.log('\n5. Verifying Strict Isolation of Rooms 20, 50, and 100 (Zero Bots)...');
const room20 = engine.getRoom('room-20');
const room50 = engine.getRoom('room-50');
const room100 = engine.getRoom('room-100');

assert.strictEqual(room20.opponentCards.length, 0, `Room 20 leaked bots! Count: ${room20.opponentCards.length}`);
assert.strictEqual(room50.opponentCards.length, 0, `Room 50 leaked bots! Count: ${room50.opponentCards.length}`);
assert.strictEqual(room100.opponentCards.length, 0, `Room 100 leaked bots! Count: ${room100.opponentCards.length}`);
console.log(`   ✅ Room 20 Bots = ${room20.opponentCards.length} (STRICTLY 0)`);
console.log(`   ✅ Room 50 Bots = ${room50.opponentCards.length} (STRICTLY 0)`);
console.log(`   ✅ Room 100 Bots = ${room100.opponentCards.length} (STRICTLY 0)\n`);

console.log('================================================================');
console.log('🎉 PHASE 2 VERIFICATION COMPLETE: ALL ASSERTIONS PASSED (100%)');
console.log('================================================================');
process.exit(0);
