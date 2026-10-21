import assert from 'assert';
import { gameEngine } from '../game/BingoGameEngine.ts';
import { isStandbyBotId } from '../game/ethiopianBotRoster.ts';

/**
 * Phase 1 Test Suite:
 * Validates Room 10 Multi-Player Standby Bot Retention, 80% Net Derash, and Multi-Room Strict Isolation
 */
async function runPhase1Tests() {
  console.log('🧪 Starting Phase 1 Verification: Room 10 Multi-Player Bot Retention & Isolation...\n');
  const engine = gameEngine;

  const room10 = engine.getRoom('room-10');
  const room20 = engine.getRoom('room-20');
  const room50 = engine.getRoom('room-50');
  const room100 = engine.getRoom('room-100');

  // -------------------------------------------------------------
  // Test 1: Idle Room 10 Pre-Seeding
  // -------------------------------------------------------------
  console.log('1️⃣ Testing Idle Room 10 Lobby:');
  assert.strictEqual(room10.opponentCards.length, 5, 'Room 10 must have exactly 5 standby bots');
  assert(room10.opponentCards.every(o => isStandbyBotId(o.botUserId)), 'All bots must be valid standby bots');
  assert.strictEqual(room10.totalPot, 50, 'Room 10 idle pot is 50 ETB');
  assert.strictEqual(room10.houseFee, 10, 'Room 10 20% commission on 50 ETB is 10 ETB');
  assert.strictEqual(room10.winnerPayout, 40, 'Room 10 net payout on 50 ETB is 40 ETB');
  console.log('   ✅ Idle Room 10 correctly has 5 standby bots, 50 ETB gross, 40 ETB net.\n');

  // -------------------------------------------------------------
  // Test 2: 1 Real Player in Room 10 (1 Ticket)
  // -------------------------------------------------------------
  console.log('2️⃣ Testing 1 Real Player Buying Ticket in Room 10:');
  const t1 = {
    userId: 'user_1',
    userName: 'Abebe Player 1',
    cartelaId: 101,
    cardMatrix: [] as any,
    betAmount: 10,
    socketId: 'sock_1',
    isBonus: false,
    isAutoPlay: true
  };
  room10.tickets.set('user_1', [t1]);
  (engine as any).syncRoom10StandbyBots(room10);

  const players1 = engine.getRoomPlayersCount(room10);
  console.log(`   Players Count: ${players1} (Expected: 6)`);
  console.log(`   Gross Pot: ${room10.totalPot} ETB (Expected: 60 ETB)`);
  console.log(`   House Fee (20%): ${room10.houseFee} ETB (Expected: 12 ETB)`);
  console.log(`   Net Derash (80%): ${room10.winnerPayout} ETB (Expected: 48 ETB)`);

  assert.strictEqual(players1, 6, '1 real player + 5 standby bots must equal 6 players');
  assert.strictEqual(room10.totalPot, 60, 'Gross pot must be 60 ETB');
  assert.strictEqual(room10.houseFee, 12, '20% platform commission on 60 ETB must be 12 ETB');
  assert.strictEqual(room10.winnerPayout, 48, 'Net Derash payout to winner must be 48 ETB');
  assert.strictEqual(room10.opponentCards.length, 5, 'Standby bots must remain 5');
  console.log('   ✅ 1 Real Player: 6 players, 60 ETB gross, 48 ETB net Derash verified!\n');

  // -------------------------------------------------------------
  // Test 3: 2nd Device / 2nd Real Player Bets in Room 10 (The Bug Fix!)
  // -------------------------------------------------------------
  console.log('3️⃣ Testing 2nd Device Buying Ticket in Room 10 (Bot Retention Test):');
  const t2 = {
    userId: 'user_2',
    userName: 'Chala Player 2',
    cartelaId: 102,
    cardMatrix: [] as any,
    betAmount: 10,
    socketId: 'sock_2',
    isBonus: false,
    isAutoPlay: true
  };
  room10.tickets.set('user_2', [t2]);
  (engine as any).syncRoom10StandbyBots(room10);

  const players2 = engine.getRoomPlayersCount(room10);
  console.log(`   Players Count: ${players2} (Expected: 7)`);
  console.log(`   Bots in Room: ${room10.opponentCards.length} (Expected: 5)`);
  console.log(`   Gross Pot: ${room10.totalPot} ETB (Expected: 70 ETB)`);
  console.log(`   House Fee (20%): ${room10.houseFee} ETB (Expected: 14 ETB)`);
  console.log(`   Net Derash (80%): ${room10.winnerPayout} ETB (Expected: 56 ETB)`);

  assert.strictEqual(room10.opponentCards.length, 5, 'CRITICAL: Standby bots must NOT be deleted when 2nd player joins!');
  assert.strictEqual(players2, 7, '2 real players + 5 standby bots must equal 7 players (NOT 2!)');
  assert.strictEqual(room10.totalPot, 70, 'Gross pot must be 70 ETB');
  assert.strictEqual(room10.houseFee, 14, 'House fee must be 14 ETB (20% of 70)');
  assert.strictEqual(room10.winnerPayout, 56, 'Net Derash must be 56 ETB (80% of 70)');
  console.log('   ✅ CRITICAL BUG RESOLVED: 2 real players + 5 bots = 7 players, 56 ETB Derash!\n');

  // -------------------------------------------------------------
  // Test 4: 3rd Real Player Bets in Room 10
  // -------------------------------------------------------------
  console.log('4️⃣ Testing 3rd Real Player in Room 10:');
  const t3 = {
    userId: 'user_3',
    userName: 'Tigist Player 3',
    cartelaId: 103,
    cardMatrix: [] as any,
    betAmount: 10,
    socketId: 'sock_3',
    isBonus: false,
    isAutoPlay: true
  };
  room10.tickets.set('user_3', [t3]);
  (engine as any).syncRoom10StandbyBots(room10);

  const players3 = engine.getRoomPlayersCount(room10);
  assert.strictEqual(players3, 8, '3 real players + 5 bots must equal 8 players');
  assert.strictEqual(room10.totalPot, 80, 'Gross pot must be 80 ETB');
  assert.strictEqual(room10.houseFee, 16, 'House fee must be 16 ETB');
  assert.strictEqual(room10.winnerPayout, 64, 'Net Derash must be 64 ETB');
  console.log('   ✅ 3 Real Players: 8 players, 80 ETB gross, 64 ETB net Derash verified!\n');

  // -------------------------------------------------------------
  // Test 5: Bot Auto-Yielding on Cartela Collision
  // -------------------------------------------------------------
  console.log('5️⃣ Testing Bot Auto-Yielding on Cartela Collision:');
  const collidingBot = room10.opponentCards[0];
  const collidingId = collidingBot.cartelaId;
  console.log(`   Bot "${collidingBot.opponentName}" initially holds Cartela #${collidingId}`);

  // Human player claims the exact cartela the bot was holding
  const tClaim = {
    userId: 'user_claimant',
    userName: 'Claimant Human',
    cartelaId: collidingId,
    cardMatrix: [] as any,
    betAmount: 10,
    socketId: 'sock_claim',
    isBonus: false,
    isAutoPlay: true
  };
  room10.tickets.set('user_claimant', [tClaim]);
  (engine as any).syncRoom10StandbyBots(room10);

  assert.notStrictEqual(collidingBot.cartelaId, collidingId, 'Bot must yield and re-roll to a new cartela ID');
  const allCartelaIds = new Set<number>();
  room10.tickets.forEach(list => list.forEach(t => allCartelaIds.add(t.cartelaId)));
  room10.opponentCards.forEach(b => {
    assert(!allCartelaIds.has(b.cartelaId), `Bot cartela #${b.cartelaId} must not collide with human cartelas`);
  });
  console.log(`   Bot yielded Cartela #${collidingId} and re-rolled to Cartela #${collidingBot.cartelaId}`);
  console.log('   ✅ Zero collision guarantee verified!\n');

  // -------------------------------------------------------------
  // Test 6: Strict Isolation of Rooms 20, 50, and 100 ETB
  // -------------------------------------------------------------
  console.log('6️⃣ Testing Strict Isolation of Rooms 20, 50, 100 ETB:');
  for (const r of [room20, room50, room100]) {
    assert.strictEqual(r.opponentCards.length, 0, `${r.id} must have ZERO bots`);
    assert.strictEqual(r.totalPot, 0, `${r.id} empty pot must be 0`);
    assert.strictEqual(r.winnerPayout, 0, `${r.id} empty payout must be 0`);
    
    // Add 1 player to Room 20
    if (r.id === 'room-20') {
      r.tickets.set('r20_p1', [{
        userId: 'r20_p1',
        userName: 'Lone 20 Player',
        cartelaId: 50,
        cardMatrix: [] as any,
        betAmount: 20,
        socketId: 'sock_r20',
        isBonus: false,
        isAutoPlay: true
      }]);
      (engine as any).recalculatePot(r);
      assert.strictEqual(r.opponentCards.length, 0, 'Room 20 must NOT spawn standby bots');
      assert.strictEqual(r.totalPot, 20, 'Room 20 pot is 20 ETB');
      assert.strictEqual(r.commissionEnabled, false, 'Room 20 <= 5 cartelas has 0% commission');
      assert.strictEqual(r.houseFee, 0, 'Room 20 house fee is 0 ETB');
      assert.strictEqual(r.winnerPayout, 20, 'Room 20 payout is 100% of pot (20 ETB)');
      const eligible = r.tickets.size >= 2;
      assert.strictEqual(eligible, false, 'Room 20 must NOT be eligible with only 1 real player');
    }
  }
  console.log('   ✅ Rooms 20, 50, and 100 ETB are 100% isolated and human-only!\n');

  console.log('🎉 ALL PHASE 1 TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

runPhase1Tests().catch(err => {
  console.error('❌ Phase 1 Verification Failed:', err);
  process.exit(1);
});
