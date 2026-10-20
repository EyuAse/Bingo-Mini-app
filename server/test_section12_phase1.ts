import assert from 'assert';
import { gameEngine } from './game/BingoGameEngine.ts';

async function runSection12Phase1Tests() {
  console.log('🧪 Starting Section 12 Phase 1 Unit Test: Dynamic Per-Round Standby Bot & Cartela Re-Roll...');
  const engine = gameEngine;
  const room10 = engine.getRoom('room-10');
  const room20 = engine.getRoom('room-20');
  const room50 = engine.getRoom('room-50');
  const room100 = engine.getRoom('room-100');

  // Test 1: Initial Round 1 state
  assert.strictEqual(room10.opponentCards.length, 5, 'Room 10 must start with 5 standby bots');
  const round1Cartelas = room10.opponentCards.map(o => o.cartelaId);
  const round1Names = room10.opponentCards.map(o => o.opponentName);
  console.log('  ✓ Round 1 Standby Bots Cartelas:', round1Cartelas);
  console.log('  ✓ Round 1 Standby Bots Names:', round1Names);

  // Test 2: Trigger Round 2 transition via forceRotate = true
  (engine as any).syncRoom10StandbyBots(room10, true);
  assert.strictEqual(room10.opponentCards.length, 5, 'Room 10 must still have 5 standby bots after re-roll');
  const round2Cartelas = room10.opponentCards.map(o => o.cartelaId);
  const round2Names = room10.opponentCards.map(o => o.opponentName);
  console.log('  ✓ Round 2 Standby Bots Cartelas:', round2Cartelas);
  console.log('  ✓ Round 2 Standby Bots Names:', round2Names);

  // Assert that cartelas rotated (the chance of 5 random numbers between 1 and 400 being identical is 1 in 10 trillion)
  const isIdenticalCartelas = round1Cartelas.every((c, idx) => c === round2Cartelas[idx]);
  assert.strictEqual(isIdenticalCartelas, false, 'Standby bot cartelas MUST dynamically rotate between rounds');

  // Test 3: Multi-Round Rotation over 5 Consecutive Rounds
  const seenCartelaSets: number[][] = [round1Cartelas, round2Cartelas];
  for (let r = 3; r <= 5; r++) {
    (engine as any).syncRoom10StandbyBots(room10, true);
    const cartelas = room10.opponentCards.map(o => o.cartelaId);
    console.log(`  ✓ Round ${r} Standby Bots Cartelas:`, cartelas);
    assert.strictEqual(room10.opponentCards.length, 5, `Round ${r} must have 5 standby bots`);
    assert.strictEqual(new Set(cartelas).size, 5, `Round ${r} cartelas must be mutually distinct`);
    seenCartelaSets.push(cartelas);
  }

  // Test 4: Strict Zero-Touch Isolation Audit for Rooms 20, 50, 100
  console.log('🔒 Verifying Strict Zero-Touch Isolation for Rooms 20, 50, 100...');
  for (const otherRoom of [room20, room50, room100]) {
    assert.strictEqual(otherRoom.opponentCards.length, 0, `${otherRoom.id} must have 0 bots`);
    assert.strictEqual(engine.getRoomPlayersCount(otherRoom), 0, `${otherRoom.id} must report 0 players when empty`);
    assert.strictEqual(otherRoom.totalPot, 0, `${otherRoom.id} pot must be 0`);
    assert.strictEqual(otherRoom.waitingForPlayers, true, `${otherRoom.id} must wait for real human players`);
    
    // Attempting to call syncRoom10StandbyBots on other rooms must do nothing
    (engine as any).syncRoom10StandbyBots(otherRoom, true);
    assert.strictEqual(otherRoom.opponentCards.length, 0, `${otherRoom.id} must strictly reject bot seeding`);
  }
  console.log('  ✓ Rooms 20, 50, 100 are 100% isolated with 0 bots and 0 side effects!');

  console.log('🎉 Section 12 Phase 1 Unit Test PASSED with 0 errors!');
  process.exit(0);
}

runSection12Phase1Tests().catch(err => {
  console.error('❌ Section 12 Phase 1 Test Failed:', err);
  process.exit(1);
});
