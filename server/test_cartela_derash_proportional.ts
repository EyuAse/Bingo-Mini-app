import assert from 'assert';
import { gameEngine } from './game/BingoGameEngine.ts';

async function runCartelaDerashTests() {
  console.log('🧪 Starting Phase 2 Proportional Cartela & Derash Verification...\n');

  const room10 = gameEngine.getRoom('room-10');
  room10.tickets.clear();
  room10.opponentCards = [];

  // ==========================================
  // Test 1: 1 player with 1 cartela (Waiting state)
  // ==========================================
  console.log('--- Test 1: 1 player buys 1 cartela (10 ETB) ---');
  room10.tickets.set('user-solo', [{
    userId: 'user-solo',
    userName: 'Solo',
    cartelaId: 101,
    cardMatrix: [[1]],
    betAmount: 10,
    socketId: 'sock-1',
    isBonus: false,
    isAutoPlay: false
  }]);

  (gameEngine as any).recalculatePot(room10);
  const cartelasT1 = gameEngine.getRealCartelaCount(room10);
  const playersT1 = gameEngine.getRoomPlayersCount(room10);

  console.log(`   Real Cartela Count: ${cartelasT1}`);
  console.log(`   Room Players Count: ${playersT1}`);
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   Winner Payout: ${room10.winnerPayout} ETB`);
  console.log(`   Commission Enabled: ${room10.commissionEnabled}`);

  assert.strictEqual(cartelasT1, 1, '1 cartela means realPlayerCount is 1');
  assert.strictEqual(room10.totalPot, 10, 'Total pot is 10 ETB');
  assert.strictEqual(room10.winnerPayout, 10, 'Winner payout is 10 ETB (0% cut <= 5 cartelas)');
  assert.strictEqual(room10.commissionEnabled, false, 'Commission is disabled for <= 5 cartelas');
  console.log('✅ Test 1 Passed!\n');

  // ==========================================
  // Test 2: 1 player with 2 cartelas (Count as 2 players, 20 Derash)
  // ==========================================
  console.log('--- Test 2: 1 player buys 2 cartelas (10 ETB stake) ---');
  room10.tickets.set('user-duo', [
    {
      userId: 'user-duo',
      userName: 'DuoPlayer',
      cartelaId: 102,
      cardMatrix: [[2]],
      betAmount: 10,
      socketId: 'sock-2',
      isBonus: false,
      isAutoPlay: false
    },
    {
      userId: 'user-duo',
      userName: 'DuoPlayer',
      cartelaId: 103,
      cardMatrix: [[3]],
      betAmount: 10,
      socketId: 'sock-2',
      isBonus: false,
      isAutoPlay: false
    }
  ]);
  room10.tickets.delete('user-solo');

  (gameEngine as any).recalculatePot(room10);
  const cartelasT2 = gameEngine.getRealCartelaCount(room10);
  const playersT2 = gameEngine.getRoomPlayersCount(room10);

  console.log(`   Real Cartela Count: ${cartelasT2}`);
  console.log(`   Room Players Count: ${playersT2}`);
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   Winner Payout: ${room10.winnerPayout} ETB`);

  assert.strictEqual(cartelasT2, 2, '1 player holding 2 cartelas counts as 2 players');
  assert.strictEqual(room10.totalPot, 20, 'Total pot is 20 ETB');
  assert.strictEqual(room10.winnerPayout, 20, 'Winner payout is 20 ETB (0% cut <= 5 cartelas)');
  assert.strictEqual(room10.commissionEnabled, false, 'Commission is 0%');
  console.log('✅ Test 2 Passed: 1 player holding 2 cartelas counts as 2 players with 20 Derash!\n');

  // ==========================================
  // Test 3: User Bug Scenario (Alice has 2 cartelas, Bob has 1 cartela)
  // Previously: Showed "2 players and 30 derash" (non-proportional)
  // Now: Shows 3 players and 30 derash (proportional!)
  // ==========================================
  console.log('--- Test 3: Alice (2 cartelas) + Bob (1 cartela) in 10 ETB Room ---');
  room10.tickets.clear();
  room10.tickets.set('alice', [
    {
      userId: 'alice',
      userName: 'Alice',
      cartelaId: 201,
      cardMatrix: [[1]],
      betAmount: 10,
      socketId: 'sock-alice',
      isBonus: false,
      isAutoPlay: false
    },
    {
      userId: 'alice',
      userName: 'Alice',
      cartelaId: 202,
      cardMatrix: [[2]],
      betAmount: 10,
      socketId: 'sock-alice',
      isBonus: false,
      isAutoPlay: false
    }
  ]);
  room10.tickets.set('bob', [
    {
      userId: 'bob',
      userName: 'Bob',
      cartelaId: 203,
      cardMatrix: [[3]],
      betAmount: 10,
      socketId: 'sock-bob',
      isBonus: false,
      isAutoPlay: false
    }
  ]);

  (gameEngine as any).recalculatePot(room10);
  const cartelasT3 = gameEngine.getRealCartelaCount(room10);
  const playersT3 = gameEngine.getRoomPlayersCount(room10);

  console.log(`   Real Cartela Count (Players): ${cartelasT3}`);
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   Winner Payout (Derash): ${room10.winnerPayout} ETB`);

  assert.strictEqual(cartelasT3, 3, 'Player count is 3 (2 from Alice + 1 from Bob)');
  assert.strictEqual(room10.totalPot, 30, 'Total pot is 30 ETB');
  assert.strictEqual(room10.winnerPayout, 30, 'Derash is 30 ETB (0% fee <= 5 cartelas)');
  console.log('✅ Test 3 Passed: 3 cartelas = 3 players, 30 Derash (100% proportional)!\n');

  // ==========================================
  // Test 4: 5 Cartelas Boundary (0% cut, 50 Derash)
  // ==========================================
  console.log('--- Test 4: 5 Cartelas Boundary (<= 5 cartelas -> 0% cut) ---');
  room10.tickets.set('charlie', [
    {
      userId: 'charlie',
      userName: 'Charlie',
      cartelaId: 204,
      cardMatrix: [[4]],
      betAmount: 10,
      socketId: 'sock-charlie',
      isBonus: false,
      isAutoPlay: false
    },
    {
      userId: 'charlie',
      userName: 'Charlie',
      cartelaId: 205,
      cardMatrix: [[5]],
      betAmount: 10,
      socketId: 'sock-charlie',
      isBonus: false,
      isAutoPlay: false
    }
  ]);

  (gameEngine as any).recalculatePot(room10);
  const cartelasT4 = gameEngine.getRealCartelaCount(room10);

  console.log(`   Total Cartelas (Players): ${cartelasT4}`);
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   House Fee: ${room10.houseFee} ETB`);
  console.log(`   Winner Payout (Derash): ${room10.winnerPayout} ETB`);

  assert.strictEqual(cartelasT4, 5, 'Total cartelas is exactly 5');
  assert.strictEqual(room10.totalPot, 50, 'Total pot is 50 ETB');
  assert.strictEqual(room10.houseFee, 0, 'House fee is 0 ETB (0% cut)');
  assert.strictEqual(room10.winnerPayout, 50, 'Winner payout is 50 ETB (100% net)');
  assert.strictEqual(room10.commissionEnabled, false, 'Commission is disabled');
  console.log('✅ Test 4 Passed: 5 cartelas = 5 players, 50 Derash, 0 fee!\n');

  // ==========================================
  // Test 5: 6 Cartelas Boundary (> 5 cartelas -> 20% cut)
  // ==========================================
  console.log('--- Test 5: 6 Cartelas Boundary (> 5 cartelas -> 20% commission cut) ---');
  room10.tickets.set('david', [
    {
      userId: 'david',
      userName: 'David',
      cartelaId: 206,
      cardMatrix: [[6]],
      betAmount: 10,
      socketId: 'sock-david',
      isBonus: false,
      isAutoPlay: false
    }
  ]);

  (gameEngine as any).recalculatePot(room10);
  const cartelasT5 = gameEngine.getRealCartelaCount(room10);

  console.log(`   Total Cartelas (Players): ${cartelasT5}`);
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   House Fee (20%): ${room10.houseFee} ETB`);
  console.log(`   Winner Payout (Derash 80%): ${room10.winnerPayout} ETB`);

  assert.strictEqual(cartelasT5, 6, 'Total cartelas is 6');
  assert.strictEqual(room10.totalPot, 60, 'Total pot is 60 ETB');
  assert.strictEqual(room10.houseFee, 12, 'House fee is 12 ETB (20% of 60)');
  assert.strictEqual(room10.winnerPayout, 48, 'Winner payout is 48 ETB (80% of 60)');
  assert.strictEqual(room10.commissionEnabled, true, 'Commission is enabled');
  console.log('✅ Test 5 Passed: 6 cartelas = 6 players, 48 Derash, 12 ETB fee (20% cut)!\n');

  // ==========================================
  // Test 6: Multi-Stake Houses (20, 50, 100 ETB)
  // ==========================================
  console.log('--- Test 6: Multi-Stake Houses Verification ---');
  for (const stake of [20, 50, 100]) {
    const room = gameEngine.getRoom(`room-${stake}`);
    room.tickets.clear();
    room.opponentCards = [];

    // 2 cartelas
    room.tickets.set('user-test', [
      { userId: 'u1', userName: 'U1', cartelaId: 1, cardMatrix: [[1]], betAmount: stake, socketId: 's1', isBonus: false, isAutoPlay: false },
      { userId: 'u1', userName: 'U1', cartelaId: 2, cardMatrix: [[2]], betAmount: stake, socketId: 's1', isBonus: false, isAutoPlay: false }
    ]);
    (gameEngine as any).recalculatePot(room);
    assert.strictEqual(gameEngine.getRealCartelaCount(room), 2);
    assert.strictEqual(room.totalPot, stake * 2);
    assert.strictEqual(room.winnerPayout, stake * 2, `<= 5 cartelas @ ${stake} ETB pays 100%`);

    // 6 cartelas
    room.tickets.set('u2', [
      { userId: 'u2', userName: 'U2', cartelaId: 3, cardMatrix: [[3]], betAmount: stake, socketId: 's2', isBonus: false, isAutoPlay: false },
      { userId: 'u2', userName: 'U2', cartelaId: 4, cardMatrix: [[4]], betAmount: stake, socketId: 's2', isBonus: false, isAutoPlay: false },
      { userId: 'u2', userName: 'U2', cartelaId: 5, cardMatrix: [[5]], betAmount: stake, socketId: 's2', isBonus: false, isAutoPlay: false },
      { userId: 'u2', userName: 'U2', cartelaId: 6, cardMatrix: [[6]], betAmount: stake, socketId: 's2', isBonus: false, isAutoPlay: false }
    ]);
    (gameEngine as any).recalculatePot(room);
    assert.strictEqual(gameEngine.getRealCartelaCount(room), 6);
    assert.strictEqual(room.totalPot, stake * 6);
    const expectedFee = Math.floor(stake * 6 * 0.20);
    assert.strictEqual(room.houseFee, expectedFee);
    assert.strictEqual(room.winnerPayout, stake * 6 - expectedFee, `> 5 cartelas @ ${stake} ETB pays 80%`);
    console.log(`   ${stake} ETB House: 2 cartelas = ${stake * 2} ETB; 6 cartelas = ${stake * 6 - expectedFee} ETB (Fee: ${expectedFee} ETB)`);
  }
  console.log('✅ Test 6 Passed!\n');

  console.log('🎉 ALL PHASE 2 TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runCartelaDerashTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
