import assert from 'assert';
import { gameEngine } from './game/BingoGameEngine.ts';
import { query } from './db.ts';

async function runSection12Phase2Tests() {
  console.log('🧪 Starting Section 12 Phase 2 Unit Test: Dynamic Human Player Priority & Bot Yielding...');
  const engine = gameEngine;
  const room10 = engine.getRoom('room-10');
  const room20 = engine.getRoom('room-20');
  const room50 = engine.getRoom('room-50');
  const room100 = engine.getRoom('room-100');

  // Reset to clean lobby state
  room10.tickets.clear();
  (engine as any).syncRoom10StandbyBots(room10, true);

  assert.strictEqual(room10.opponentCards.length, 5, 'Room 10 must have 5 standby bots');
  const initialBotCartelas = room10.opponentCards.map(o => o.cartelaId);
  console.log('  Initial Standby Bot Cartelas:', initialBotCartelas);

  // Pick the first bot's cartela as the target to test conflict yielding
  const targetedBotCartela = initialBotCartelas[0];
  const targetedBotName = room10.opponentCards[0].opponentName;
  console.log(`  🎯 Real player specifically requesting Cartela #${targetedBotCartela} (currently held by bot "${targetedBotName}")...`);

  // Simulate human player purchasing the targeted cartela
  const purchaseResult = await engine.handleBuyTicket(
    'd6e0362a-74de-4a45-bfd6-43cab65a5f49',
    'Test Player',
    'room-10',
    [targetedBotCartela],
    'socket_test_phase2',
    10,
    true
  );

  assert.strictEqual(purchaseResult.success, true, 'Human player purchase must succeed');
  assert.ok(purchaseResult.tickets && purchaseResult.tickets.length === 1, 'Player must receive 1 ticket');
  assert.strictEqual(purchaseResult.tickets![0].cartelaId, targetedBotCartela, `Player must be awarded Cartela #${targetedBotCartela}`);
  console.log(`  ✓ Human player was successfully granted Cartela #${targetedBotCartela}!`);

  // Verify that the bot yielded the cartela and acquired a new, distinct cartela
  const updatedBotCartelas = room10.opponentCards.map(o => o.cartelaId);
  console.log('  Updated Standby Bot Cartelas after yield:', updatedBotCartelas);

  assert.strictEqual(updatedBotCartelas.includes(targetedBotCartela), false, `Bot must NO LONGER hold Cartela #${targetedBotCartela}`);
  assert.strictEqual(room10.opponentCards.length, 5, 'Room 10 must still maintain all 5 bots');

  // Verify all 6 cartelas in the room are 100% distinct
  const allCartelasInRoom = [targetedBotCartela, ...updatedBotCartelas];
  assert.strictEqual(new Set(allCartelasInRoom).size, 6, 'All 6 cartelas (1 human + 5 bots) must be mutually distinct');
  console.log('  ✓ All 6 cartelas in Room 10 are completely collision-free!');

  // Strict Isolation Audit for Rooms 20, 50, 100
  console.log('🔒 Verifying Strict Zero-Touch Isolation for Rooms 20, 50, 100...');
  for (const otherRoom of [room20, room50, room100]) {
    assert.strictEqual(otherRoom.opponentCards.length, 0, `${otherRoom.id} must have 0 bots`);
    assert.strictEqual(otherRoom.totalPot, 0, `${otherRoom.id} pot must be 0`);
    assert.strictEqual(otherRoom.waitingForPlayers, true, `${otherRoom.id} must require >= 2 real players`);
  }
  console.log('  ✓ Rooms 20, 50, 100 remain 100% untouched!');

  // Clean up test player and refund balance
  room10.tickets.clear();
  (engine as any).syncRoom10StandbyBots(room10, true);
  await query('UPDATE wallets SET balance = balance + 10 WHERE user_id = $1', ['d6e0362a-74de-4a45-bfd6-43cab65a5f49']);

  console.log('🎉 Section 12 Phase 2 Unit Test PASSED with 0 errors!');
  process.exit(0);
}

runSection12Phase2Tests().catch(err => {
  console.error('❌ Section 12 Phase 2 Test Failed:', err);
  process.exit(1);
});
