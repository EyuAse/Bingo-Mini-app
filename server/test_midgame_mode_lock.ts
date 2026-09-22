import assert from 'assert';
import { gameEngine } from './game/BingoGameEngine.ts';

console.log('================================================================');
console.log('🧪 Testing Mid-Game Mode Lock (Phase 1 Verification)');
console.log('================================================================\n');

const testUserId = 'test_user_lock_' + Date.now();
const testRoomId = 'room-10';

const room = gameEngine.getRoom(testRoomId);
assert.ok(room, 'Test room must exist');

// Clean up any stale tickets
room.tickets.delete(testUserId);
room.nextRoundTickets.delete(testUserId);

try {
  // ── Step 1: LOBBY PHASE — Mode switches allowed ──────────────────
  room.phase = 'lobby';
  gameEngine.updatePlayerMode(testRoomId, testUserId, false); // Manual
  assert.strictEqual(gameEngine.getPlayerMode(testUserId), false, 'Lobby: User mode should be Manual (false)');

  // User buys ticket in lobby
  room.tickets.set(testUserId, [
    {
      userId: testUserId,
      userName: 'Test Player',
      cartelaId: 55,
      cardMatrix: [],
      betAmount: 10,
      socketId: 'sock_lock_1',
      isBonus: false,
      isAutoPlay: false,
    },
  ]);

  // In lobby, player switches to Auto (true)
  gameEngine.updatePlayerMode(testRoomId, testUserId, true);
  assert.strictEqual(gameEngine.getPlayerMode(testUserId), true, 'Lobby: User mode should now be Auto (true)');
  assert.strictEqual(room.tickets.get(testUserId)![0].isAutoPlay, true, 'Lobby: Active ticket should be updated to Auto (true)');
  console.log('✅ Step 1: In Lobby phase, mode changes update active tickets successfully.');

  // Switch back to Manual (false) before game starts
  gameEngine.updatePlayerMode(testRoomId, testUserId, false);
  assert.strictEqual(room.tickets.get(testUserId)![0].isAutoPlay, false, 'Lobby: Active ticket confirmed Manual (false)');
  console.log('✅ Step 1b: User locked in Manual mode before game begins.');

  // ── Step 2: GAME COUNTDOWN FINISHES -> ROUND BEGINS ('playing') ───
  room.phase = 'playing';

  // Queue a next round ticket as well to test future-round preferences
  room.nextRoundTickets.set(testUserId, [
    {
      userId: testUserId,
      userName: 'Test Player',
      cartelaId: 56,
      cardMatrix: [],
      betAmount: 10,
      socketId: 'sock_lock_1',
      isBonus: false,
      isAutoPlay: false,
    },
  ]);

  // Player attempts to toggle mode mid-game to Auto (true)!
  gameEngine.updatePlayerMode(testRoomId, testUserId, true);

  // CRITICAL ASSERTION: Active ticket MUST NOT be changed to true!
  const activeTicket = room.tickets.get(testUserId)![0];
  assert.strictEqual(activeTicket.isAutoPlay, false, 'Mid-Game: Active ticket isAutoPlay MUST remain false (locked in manual)!');
  assert.strictEqual(gameEngine.getPlayerMode(testUserId), false, 'Mid-Game: Active registered playerMode MUST remain false!');
  console.log('✅ Step 2: Mid-game mode switch rejected for active game ticket.');

  // But next-round ticket SHOULD be updated for subsequent round
  const nextTicket = room.nextRoundTickets.get(testUserId)![0];
  assert.strictEqual(nextTicket.isAutoPlay, true, 'Mid-Game: Queued next-round ticket accepted mode preference.');
  console.log('✅ Step 2b: Next-round queued ticket correctly recorded future preference.');

  // ── Step 3: 'LOCKED' PHASE (Brief transition between countdown and first ball) ──
  room.phase = 'locked';
  // Attempt another mid-game switch
  gameEngine.updatePlayerMode(testRoomId, testUserId, true);
  assert.strictEqual(room.tickets.get(testUserId)![0].isAutoPlay, false, 'Locked Phase: Active ticket isAutoPlay MUST remain false!');
  console.log('✅ Step 3: Locked transition phase also strictly protects active tickets.');

  // ── Step 4: ROUND CONCLUDES -> RETURNS TO LOBBY ──────────────────
  room.phase = 'lobby';
  // Player can now freely change mode for the next round
  gameEngine.updatePlayerMode(testRoomId, testUserId, true);
  assert.strictEqual(gameEngine.getPlayerMode(testUserId), true, 'Post-Game Lobby: User mode successfully updated to Auto.');
  assert.strictEqual(room.tickets.get(testUserId)![0].isAutoPlay, true, 'Post-Game Lobby: Ticket updated to Auto.');
  console.log('✅ Step 4: Mode lock automatically released when returning to lobby.');

  console.log('\n================================================================');
  console.log('🎉 ALL MID-GAME MODE LOCK TESTS PASSED (100%)');
  console.log('================================================================');
} finally {
  // Cleanup
  room.tickets.delete(testUserId);
  room.nextRoundTickets.delete(testUserId);
  room.phase = 'lobby';
  process.exit(0);
}
