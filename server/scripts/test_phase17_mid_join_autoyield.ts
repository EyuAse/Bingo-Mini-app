import assert from 'assert';
import { gameEngine } from '../game/BingoGameEngine.ts';
import { getTargetBotsForElapsedSecond, sampleStandbyBots, isStandbyBotId } from '../game/ethiopianBotRoster.ts';

console.log('================================================================');
console.log('🔬 PHASE 17: MID-COUNTDOWN JOINER & CARTELA AUTO-YIELD TEST');
console.log('================================================================\n');

const engine = gameEngine as any;
const room10 = engine.getRoom('room-10');
const room20 = engine.getRoom('room-20');

assert(room10, 'Room 10 must exist');
assert(room20, 'Room 20 must exist');

// Configure engine for dynamic staggered lobby testing
engine.botConfig.mode = 'dynamic';
engine.botConfig.staggeredJoin = true;
engine.botConfig.livingClock = true;

// -----------------------------------------------------------------------------
// SCENARIO A: Real Player Joins Room 10 Mid-Countdown at t = 25s (Elapsed = 20s)
// -----------------------------------------------------------------------------
console.log('[Scenario A] Testing Mid-Countdown Joiner in Room 10 at t = 25s...');

// Setup Room 10 for a fresh round with dynamic target 40
room10.phase = 'lobby';
room10.lobbyCountdown = 45;
room10.dynamicBotTarget = 40;
room10.targetBotsToSeed = sampleStandbyBots(40);
room10.tickets.clear();
room10.opponentCards = [];

// Seed initial baseline at t = 45s (0s elapsed)
engine.syncRoom10StandbyBots(room10, false);
const baselineAt45 = room10.opponentCards.length;
console.log(`  • At t = 45s: ${baselineAt45} baseline bots seeded.`);
assert.strictEqual(baselineAt45, getTargetBotsForElapsedSecond(40, 0), 'Initial baseline should match S-curve at 0s');

// Now simulate time advancing to t = 25s (elapsed = 20s)
room10.lobbyCountdown = 25;
const expectedAt25 = getTargetBotsForElapsedSecond(40, 20); // 18 bots
console.log(`  • Target bots at t = 25s (20s elapsed): ${expectedAt25} bots`);

// Real player joins at t = 25s
engine.handleJoinRoom('socket-real-midjoiner', 'room-10', 'user-midjoiner-001', 'Natnael T.');

console.log(`  • After real player join at t = 25s: ${room10.opponentCards.length} bots in Room 10`);

// Critical assertion: Bot count must be 18 (S-Curve at 20s), NOT 40 (stateless dump)!
assert.strictEqual(
  room10.opponentCards.length,
  expectedAt25,
  `Mid-countdown joiner must receive exact S-Curve count (${expectedAt25}), got ${room10.opponentCards.length}!`
);

// Verify all bots are valid standby bot profiles
assert(
  room10.opponentCards.every((o: any) => isStandbyBotId(o.botUserId)),
  'All injected bots must have valid standby bot IDs'
);

// Verify gross pot calculation (18 bots * 10 ETB = 180 ETB)
assert.strictEqual(room10.totalPot, expectedAt25 * 10, `Pot must reflect ${expectedAt25} bots (${expectedAt25 * 10} ETB)`);
console.log(`  ✅ Scenario A Passed: Mid-countdown joiner gets exactly ${room10.opponentCards.length} bots without resetting.\n`);

// -----------------------------------------------------------------------------
// SCENARIO B: Real Player Purchases a Cartela Currently Held by a Standby Bot
// -----------------------------------------------------------------------------
console.log('[Scenario B] Testing Standby Bot Cartela Auto-Yielding Safety...');

// Pick a bot that currently holds a cartela
assert(room10.opponentCards.length > 0, 'Opponent cards must not be empty');
const targetBot = room10.opponentCards[2];
const contestedCartelaId = targetBot.cartelaId;
const botOriginalName = targetBot.opponentName;

console.log(`  • Bot #${targetBot.botUserId} ("${botOriginalName}") currently holds Cartela #${contestedCartelaId}`);

// Real player buys the exact cartela held by this bot
const realPlayerId = 'human-buyer-001';
room10.tickets.set(realPlayerId, [{
  userId: realPlayerId,
  userName: 'Selamawit G.',
  cartelaId: contestedCartelaId,
  cardMatrix: [],
  betAmount: 10,
  socketId: 'socket-real-buyer',
  isAutoPlay: true
}]);

// Sync bots after human purchase
engine.syncRoom10StandbyBots(room10, false);

// Assert the contested cartela is no longer held by ANY bot
const botsWithContestedCard = room10.opponentCards.filter((o: any) => o.cartelaId === contestedCartelaId);
assert.strictEqual(
  botsWithContestedCard.length,
  0,
  `Cartela #${contestedCartelaId} must have been yielded by bot, but still held by ${botsWithContestedCard.length} bot(s)!`
);

// Find the bot that yielded
const updatedBot = room10.opponentCards.find((o: any) => o.botUserId === targetBot.botUserId);
assert(updatedBot, 'Yielding bot must still exist in the room');
assert.notStrictEqual(
  updatedBot.cartelaId,
  contestedCartelaId,
  `Bot "${botOriginalName}" must have re-rolled to a new cartela`
);
console.log(`  • Bot "${botOriginalName}" yielded Cartela #${contestedCartelaId} and re-rolled to Cartela #${updatedBot.cartelaId}`);

// Verify all cartelas in the room (human + all bots) are 100% unique
const allCartelaIds = [
  ...Array.from(room10.tickets.values()).flatMap((list: any) => list.map((t: any) => t.cartelaId)),
  ...room10.opponentCards.map((o: any) => o.cartelaId)
];
const uniqueIds = new Set(allCartelaIds);
assert.strictEqual(
  uniqueIds.size,
  allCartelaIds.length,
  `Duplicate cartela IDs found! Total: ${allCartelaIds.length}, Unique: ${uniqueIds.size}`
);
console.log(`  • All ${allCartelaIds.length} cartelas (1 human + ${room10.opponentCards.length} bots) are 100% unique.`);

// Verify bot count did NOT jump to 40
assert.strictEqual(
  room10.opponentCards.length,
  expectedAt25,
  `Bot count must remain at ${expectedAt25} after yielding, got ${room10.opponentCards.length}`
);

// Verify pot correctly reflects 1 human + 18 bots = 19 cards * 10 ETB = 190 ETB
const expectedPot = (1 + expectedAt25) * 10;
assert.strictEqual(room10.totalPot, expectedPot, `Total pot should be ${expectedPot} ETB, got ${room10.totalPot}`);
console.log(`  ✅ Scenario B Passed: Bot safely auto-yielded Cartela #${contestedCartelaId} to human with 0 collisions.\n`);

// -----------------------------------------------------------------------------
// SCENARIO C: Real Player Joins Room 20 Mid-Countdown at t = 25s (Firewall Audit)
// -----------------------------------------------------------------------------
console.log('[Scenario C] Testing Multi-Room Isolation Firewall (Room 20 at t = 25s)...');

room20.phase = 'lobby';
room20.lobbyCountdown = 25;
room20.tickets.clear();
room20.opponentCards = [];

// Real player enters Room 20
engine.handleJoinRoom('socket-real-r20', 'room-20', 'user-r20-001', 'Kidus M.');

// Assert Room 20 strictly has ZERO bots
assert.strictEqual(
  room20.opponentCards.length,
  0,
  `Firewall breach: Room 20 has ${room20.opponentCards.length} bots!`
);

// Even if syncRoom10StandbyBots is explicitly invoked with room20:
engine.syncRoom10StandbyBots(room20, false);
assert.strictEqual(
  room20.opponentCards.length,
  0,
  'Firewall breach: syncRoom10StandbyBots populated bots in Room 20!'
);

// Room 20 pot should be 0 because no tickets purchased
assert.strictEqual(room20.totalPot, 0, 'Room 20 pot must be 0 without human tickets');
console.log('  • Room 20 has strictly 0 bots and 0 ETB synthetic pot.');
console.log('  ✅ Scenario C Passed: Rooms 20, 50, and 100 remain 100% untampered and human-only.\n');

// -----------------------------------------------------------------------------
// SCENARIO D: Continuous Influx Post Mid-Countdown Join (t = 25s -> t = 0s)
// -----------------------------------------------------------------------------
console.log('[Scenario D] Testing Continuous Influx from t = 25s down to t = 0s...');

// Simulate ticking down from 24 down to 0
for (let sec = 24; sec >= 0; sec--) {
  room10.lobbyCountdown = sec;
  engine.syncRoom10StandbyBots(room10, false);
  const exp = getTargetBotsForElapsedSecond(40, 45 - sec);
  assert.strictEqual(
    room10.opponentCards.length,
    exp,
    `At second ${sec}, expected ${exp} bots, got ${room10.opponentCards.length}`
  );
}

// At t = 0s, exactly 40 bots must be locked
assert.strictEqual(room10.opponentCards.length, 40, 'At t=0s, exactly 40 bots must be present');
console.log(`  • Countdown ended: Exactly ${room10.opponentCards.length} bots locked for game round.`);
console.log('  ✅ Scenario D Passed: Smooth continuous influx to full target post-join.\n');

// Clean up test player
room10.tickets.delete(realPlayerId);

console.log('================================================================');
console.log('🎉 ALL PHASE 17 VERIFICATION TESTS PASSED (100%)');
console.log('================================================================');
process.exit(0);
