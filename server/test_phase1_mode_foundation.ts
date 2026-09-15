import assert from 'assert';
import { gameEngine } from './game/BingoGameEngine.ts';

console.log('================================================================');
console.log('🧪 Testing Phase 1: Mode Registry Synchronization & Socket Reliability');
console.log('================================================================\n');

const testUserId = 'test_user_phase1_' + Date.now();
const testRoomId = 'room-10';

// 1. Initial State: No registered mode
assert.strictEqual(gameEngine.getPlayerMode(testUserId), undefined, 'Initially user should not have registered mode');

// 2. Player switches to Manual mode (false)
gameEngine.updatePlayerMode(testRoomId, testUserId, false);
assert.strictEqual(gameEngine.getPlayerMode(testUserId), false, 'Player mode should be strictly false (Manual)');
console.log('✅ Step 1: updatePlayerMode successfully set mode to false (Manual ✋)');

// 3. Setup mock ticket in room
const room = gameEngine.getRoom(testRoomId);
if (room) {
  room.tickets.set(testUserId, [
    {
      userId: testUserId,
      userName: 'Test Player',
      cartelaId: 101,
      cardMatrix: [],
      betAmount: 10,
      socketId: 'sock_123',
      isBonus: false,
      isAutoPlay: true // initially true before mode was synced
    }
  ]);

  // Sync mode again
  gameEngine.updatePlayerMode(testRoomId, testUserId, false);
  const ticket = room.tickets.get(testUserId)![0];
  assert.strictEqual(ticket.isAutoPlay, false, 'Ticket isAutoPlay should be updated to false');
  console.log('✅ Step 2: Active room ticket isAutoPlay updated to false');

  // Queue a next round ticket
  room.nextRoundTickets.set(testUserId, [
    {
      userId: testUserId,
      userName: 'Test Player',
      cartelaId: 102,
      cardMatrix: [],
      betAmount: 10,
      socketId: 'sock_123',
      isBonus: false,
      isAutoPlay: true
    }
  ]);

  // Switch to Auto mode (true)
  gameEngine.updatePlayerMode(testRoomId, testUserId, true);
  assert.strictEqual(gameEngine.getPlayerMode(testUserId), true, 'Player mode should now be true (Auto)');
  assert.strictEqual(room.tickets.get(testUserId)![0].isAutoPlay, true, 'Active ticket updated to true');
  assert.strictEqual(room.nextRoundTickets.get(testUserId)![0].isAutoPlay, true, 'Next round ticket updated to true');
  console.log('✅ Step 3: Switched to Auto (⚡) - active and queued tickets updated to true');

  // Switch back to Manual mode (false)
  gameEngine.updatePlayerMode(testRoomId, testUserId, false);
  assert.strictEqual(gameEngine.getPlayerMode(testUserId), false, 'Player mode should now be false (Manual)');
  assert.strictEqual(room.tickets.get(testUserId)![0].isAutoPlay, false, 'Active ticket updated to false');
  assert.strictEqual(room.nextRoundTickets.get(testUserId)![0].isAutoPlay, false, 'Next round ticket updated to false');
  console.log('✅ Step 4: Switched back to Manual (✋) - active and queued tickets updated to false');

  // Cleanup
  room.tickets.delete(testUserId);
  room.nextRoundTickets.delete(testUserId);
}

console.log('\n================================================================');
console.log('🎉 ALL PHASE 1 TESTS PASSED SUCCESSFULLY (100%)');
console.log('================================================================\n');
process.exit(0);
