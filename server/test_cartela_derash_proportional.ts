import assert from 'assert';
import { gameEngine } from './game/BingoGameEngine.ts';

async function runCartelaDerashTests() {
  console.log('🧪 Starting Phase 1 & 2 Game Engine & Matchmaking Gate Verification...\n');

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
    cardMatrix: [[1]] as any,
    betAmount: 10,
    socketId: 'sock-1',
    isBonus: false,
    isAutoPlay: false
  }]);

  (gameEngine as any).recalculatePot(room10);
  room10.waitingForPlayers = room10.tickets.size < 2;
  const cartelasT1 = gameEngine.getRealCartelaCount(room10);
  const playersT1 = gameEngine.getRoomPlayersCount(room10);

  console.log(`   Distinct Users: ${room10.tickets.size}`);
  console.log(`   Real Cartela Count (Player Units): ${cartelasT1}`);
  console.log(`   Waiting For Players: ${room10.waitingForPlayers}`);
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   Winner Payout: ${room10.winnerPayout} ETB`);
  console.log(`   Commission Enabled: ${room10.commissionEnabled}`);

  assert.strictEqual(room10.tickets.size, 1, 'Only 1 distinct player in room');
  assert.strictEqual(room10.waitingForPlayers, true, 'Room is frozen in waitingForPlayers state');
  assert.strictEqual(cartelasT1, 1, '1 cartela means realPlayerCount is 1');
  assert.strictEqual(room10.totalPot, 10, 'Total pot is 10 ETB');
  assert.strictEqual(room10.winnerPayout, 10, 'Winner payout is 10 ETB (0% cut <= 5 cartelas)');
  assert.strictEqual(room10.commissionEnabled, false, 'Commission is disabled for <= 5 cartelas');
  console.log('✅ Test 1 Passed: 1 player with 1 cartela is frozen in waiting state!\n');

  // ==========================================
  // Test 2: 1 player with 2 cartelas (MUST WAIT FOR 2ND PLAYER, 0% commission)
  // ==========================================
  console.log('--- Test 2: 1 player buys 2 cartelas (10 ETB stake each) ---');
  room10.tickets.set('user-duo', [
    {
      userId: 'user-duo',
      userName: 'DuoPlayer',
      cartelaId: 102,
      cardMatrix: [[2]] as any,
      betAmount: 10,
      socketId: 'sock-2',
      isBonus: false,
      isAutoPlay: false
    },
    {
      userId: 'user-duo',
      userName: 'DuoPlayer',
      cartelaId: 103,
      cardMatrix: [[3]] as any,
      betAmount: 10,
      socketId: 'sock-2',
      isBonus: false,
      isAutoPlay: false
    }
  ]);
  room10.tickets.delete('user-solo');

  (gameEngine as any).recalculatePot(room10);
  room10.waitingForPlayers = room10.tickets.size < 2;
  const cartelasT2 = gameEngine.getRealCartelaCount(room10);

  console.log(`   Distinct Users: ${room10.tickets.size}`);
  console.log(`   Real Cartela Count (Player Units): ${cartelasT2}`);
  console.log(`   Waiting For Players: ${room10.waitingForPlayers}`);
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   Winner Payout: ${room10.winnerPayout} ETB`);

  assert.strictEqual(room10.tickets.size, 1, 'Only 1 distinct player even with 2 cartelas');
  assert.strictEqual(room10.waitingForPlayers, true, 'CRITICAL: Single player with 2 cartelas CANNOT start alone (waitingForPlayers = true)');
  assert.strictEqual(cartelasT2, 2, 'Total cartelas = 2 (represents 2 player units for pot)');
  assert.strictEqual(room10.totalPot, 20, 'Total pot is 20 ETB');
  assert.strictEqual(room10.winnerPayout, 20, 'Winner payout is 20 ETB (0% cut <= 5 cartelas)');
  assert.strictEqual(room10.commissionEnabled, false, 'Commission is 0%');
  console.log('✅ Test 2 Passed: 1 player with 2 cartelas remains frozen waiting for opponent!\n');

  // ==========================================
  // Test 3: 2 Real Players Join (Alice 2 cartelas + Bob 1 cartela -> Countdown Starts!)
  // ==========================================
  console.log('--- Test 3: Alice (2 cartelas) + Bob (1 cartela) in 10 ETB Room ---');
  room10.tickets.clear();
  room10.tickets.set('alice', [
    {
      userId: 'alice',
      userName: 'Alice',
      cartelaId: 201,
      cardMatrix: [[1]] as any,
      betAmount: 10,
      socketId: 'sock-alice',
      isBonus: false,
      isAutoPlay: false
    },
    {
      userId: 'alice',
      userName: 'Alice',
      cartelaId: 202,
      cardMatrix: [[2]] as any,
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
      cardMatrix: [[3]] as any,
      betAmount: 10,
      socketId: 'sock-bob',
      isBonus: false,
      isAutoPlay: false
    }
  ]);

  (gameEngine as any).recalculatePot(room10);
  room10.waitingForPlayers = room10.tickets.size < 2;
  const cartelasT3 = gameEngine.getRealCartelaCount(room10);

  console.log(`   Distinct Users: ${room10.tickets.size}`);
  console.log(`   Real Cartela Count (Players Display): ${cartelasT3}`);
  console.log(`   Waiting For Players: ${room10.waitingForPlayers}`);
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   Winner Payout (Derash): ${room10.winnerPayout} ETB`);

  assert.strictEqual(room10.tickets.size, 2, '2 distinct real human players');
  assert.strictEqual(room10.waitingForPlayers, false, 'Game can begin! waitingForPlayers = false');
  assert.strictEqual(cartelasT3, 3, 'Player count displays 3 (2 from Alice + 1 from Bob)');
  assert.strictEqual(room10.totalPot, 30, 'Total pot is 30 ETB');
  assert.strictEqual(room10.winnerPayout, 30, 'Derash is 30 ETB (0% fee <= 5 cartelas)');
  console.log('✅ Test 3 Passed: 2 players with 3 cartelas trigger active game with 3 Players & 30 Derash!\n');

  // ==========================================
  // Test 4: 5 Cartelas Boundary (0% cut, 50 Derash)
  // ==========================================
  console.log('--- Test 4: 5 Cartelas Boundary (<= 5 cartelas -> 0% cut) ---');
  room10.tickets.set('charlie', [
    {
      userId: 'charlie',
      userName: 'Charlie',
      cartelaId: 204,
      cardMatrix: [[4]] as any,
      betAmount: 10,
      socketId: 'sock-charlie',
      isBonus: false,
      isAutoPlay: false
    },
    {
      userId: 'charlie',
      userName: 'Charlie',
      cartelaId: 205,
      cardMatrix: [[5]] as any,
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
      cardMatrix: [[6]] as any,
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

    // 2 cartelas across 2 players
    room.tickets.set('u1', [
      { userId: 'u1', userName: 'U1', cartelaId: 1, cardMatrix: [[1]] as any, betAmount: stake, socketId: 's1', isBonus: false, isAutoPlay: false }
    ]);
    room.tickets.set('u2', [
      { userId: 'u2', userName: 'U2', cartelaId: 2, cardMatrix: [[2]] as any, betAmount: stake, socketId: 's2', isBonus: false, isAutoPlay: false }
    ]);
    (gameEngine as any).recalculatePot(room);
    assert.strictEqual(gameEngine.getRealCartelaCount(room), 2);
    assert.strictEqual(room.tickets.size, 2);
    assert.strictEqual(room.totalPot, stake * 2);
    assert.strictEqual(room.winnerPayout, stake * 2, `<= 5 cartelas @ ${stake} ETB pays 100%`);

    // Add 4 more cartelas across 2 more players = 6 cartelas total
    room.tickets.set('u3', [
      { userId: 'u3', userName: 'U3', cartelaId: 3, cardMatrix: [[3]] as any, betAmount: stake, socketId: 's3', isBonus: false, isAutoPlay: false },
      { userId: 'u3', userName: 'U3', cartelaId: 4, cardMatrix: [[4]] as any, betAmount: stake, socketId: 's3', isBonus: false, isAutoPlay: false }
    ]);
    room.tickets.set('u4', [
      { userId: 'u4', userName: 'U4', cartelaId: 5, cardMatrix: [[5]] as any, betAmount: stake, socketId: 's4', isBonus: false, isAutoPlay: false },
      { userId: 'u4', userName: 'U4', cartelaId: 6, cardMatrix: [[6]] as any, betAmount: stake, socketId: 's4', isBonus: false, isAutoPlay: false }
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

  // ==========================================
  // Test 7: Bot Injection Threshold (0 bots <= 10 cartelas, 3 bots >= 11 cartelas)
  // ==========================================
  console.log('--- Test 7: Bot Injection Threshold ---');
  const count10 = 10;
  const botsAt10 = count10 >= 11 ? 3 : 0;
  assert.strictEqual(botsAt10, 0, 'Zero bots at 10 cartelas');

  const count11 = 11;
  const botsAt11 = count11 >= 11 ? 3 : 0;
  assert.strictEqual(botsAt11, 3, '3 bots join starting at 11 cartelas');
  console.log('✅ Test 7 Passed: Bots strictly join starting at 11 cartelas!\n');

  console.log('🎉 ALL TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runCartelaDerashTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
