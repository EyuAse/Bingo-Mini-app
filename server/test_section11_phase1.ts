import { gameEngine } from './game/BingoGameEngine.ts';

async function runSection11Phase1Test() {
  console.log('🧪 Starting Section 11 Phase 1 Validation Suite...\n');

  const engine = gameEngine;

  // 1. Validate Initial Room 10 State
  console.log('1️⃣ Checking Room 10 Pre-Seeded Standby Bots in Lobby:');
  const room10 = engine.getRoom('room-10');
  if (!room10) throw new Error('room-10 not found');

  console.log(`   - Name: ${room10.name}`);
  console.log(`   - Opponent Bots Count: ${room10.opponentCards.length}`);
  console.log(`   - Total Pot: ${room10.totalPot} ETB`);
  console.log(`   - Players Count: ${engine.getRoomPlayersCount(room10)}`);
  console.log(`   - Waiting for Players: ${room10.waitingForPlayers}`);

  if (room10.opponentCards.length !== 5) {
    throw new Error(`Expected 5 standby bots, got ${room10.opponentCards.length}`);
  }
  if (room10.totalPot !== 50) {
    throw new Error(`Expected initial pot of 50 ETB from 5 bots, got ${room10.totalPot}`);
  }
  if (engine.getRoomPlayersCount(room10) !== 5) {
    throw new Error(`Expected players count 5, got ${engine.getRoomPlayersCount(room10)}`);
  }

  // 2. Validate Other Rooms Are 100% Untouched
  console.log('\n2️⃣ Verifying Rooms 20, 50, 100 Are Strictly Untouched (0 bots, 0 pot):');
  for (const rid of ['room-20', 'room-50', 'room-100']) {
    const r = engine.getRoom(rid);
    console.log(`   - ${r.name} (${rid}): Bots=${r.opponentCards.length}, Pot=${r.totalPot}, Players=${engine.getRoomPlayersCount(r)}`);
    if (r.opponentCards.length !== 0) {
      throw new Error(`Room ${rid} has ${r.opponentCards.length} bots; MUST be 0!`);
    }
    if (r.totalPot !== 0) {
      throw new Error(`Room ${rid} has pot ${r.totalPot}; MUST be 0!`);
    }
    if (engine.getRoomPlayersCount(r) !== 0) {
      throw new Error(`Room ${rid} has players ${engine.getRoomPlayersCount(r)}; MUST be 0!`);
    }
  }

  // 3. Validate getStakeRoomsSummary() for Selector Modal
  console.log('\n3️⃣ Checking getStakeRoomsSummary() for Stake Room Selector Modal:');
  const summary = engine.getStakeRoomsSummary();
  console.log('   - Summary:', summary);
  if (summary[10] !== 5) {
    throw new Error(`Stake summary for 10 ETB room should be 5, got ${summary[10]}`);
  }
  if (summary[20] !== 0 || summary[50] !== 0 || summary[100] !== 0) {
    throw new Error(`Rooms 20, 50, 100 must report 0, got ${JSON.stringify(summary)}`);
  }

  // 4. Validate getAllRooms()
  console.log('\n4️⃣ Checking getAllRooms() API response:');
  const allRooms = engine.getAllRooms();
  const summary10 = allRooms.find(r => r.id === 'room-10');
  const summary20 = allRooms.find(r => r.id === 'room-20');
  if (!summary10 || summary10.playersCount !== 5 || summary10.totalPot !== 50) {
    throw new Error(`getAllRooms summary for room-10 mismatch: ${JSON.stringify(summary10)}`);
  }
  if (!summary20 || summary20.playersCount !== 0 || summary20.totalPot !== 0) {
    throw new Error(`getAllRooms summary for room-20 mismatch: ${JSON.stringify(summary20)}`);
  }
  console.log('   ✓ Room 10 reports 5 players / 50 ETB pot; Room 20 reports 0 players / 0 pot');

  // 5. Test Simulation: 1 Real Player Joins & Buys Ticket
  console.log('\n5️⃣ Simulating 1 Real Player Ticket in Room 10:');
  const mockTicket = {
    userId: 'test-real-user-1',
    userName: 'Abebe Tester',
    cartelaId: 101,
    cardMatrix: [] as any[],
    betAmount: 10,
    socketId: 'mock-socket-1',
    isAutoPlay: true
  };
  room10.tickets.set('test-real-user-1', [mockTicket]);
  // Trigger sync
  (engine as any).syncRoom10StandbyBots(room10);

  console.log(`   - Real Players: ${room10.tickets.size}`);
  console.log(`   - Bot Opponents: ${room10.opponentCards.length}`);
  console.log(`   - Total Pot: ${room10.totalPot} ETB (Target: 60 ETB)`);
  console.log(`   - Winner Payout: ${room10.winnerPayout} ETB (Target: 48 ETB)`);
  console.log(`   - House Fee: ${room10.houseFee} ETB (Target: 12 ETB)`);
  console.log(`   - Total Players Count: ${engine.getRoomPlayersCount(room10)} (Target: 6)`);
  console.log(`   - Selector Summary [10]: ${engine.getStakeRoomsSummary()[10]}`);

  if (room10.opponentCards.length !== 5) {
    throw new Error(`Standby bots should remain 5 when 1 real player is present, got ${room10.opponentCards.length}`);
  }
  if (room10.totalPot !== 60) {
    throw new Error(`Expected totalPot 60 ETB (1 real + 5 bots), got ${room10.totalPot}`);
  }
  if (room10.winnerPayout !== 48) {
    throw new Error(`Expected winnerPayout 48 ETB, got ${room10.winnerPayout}`);
  }
  if (room10.houseFee !== 12) {
    throw new Error(`Expected houseFee 12 ETB, got ${room10.houseFee}`);
  }
  if (engine.getRoomPlayersCount(room10) !== 6) {
    throw new Error(`Expected players count 6, got ${engine.getRoomPlayersCount(room10)}`);
  }
  if (engine.getStakeRoomsSummary()[10] !== 6) {
    throw new Error(`Expected stake summary 6, got ${engine.getStakeRoomsSummary()[10]}`);
  }

  // 6. Test Simulation: 2nd Real Player Joins -> Bots Yield
  console.log('\n6️⃣ Simulating 2nd Real Player Joining (Bots must yield cleanly):');
  const mockTicket2 = {
    userId: 'test-real-user-2',
    userName: 'Chala Tester',
    cartelaId: 102,
    cardMatrix: [] as any[],
    betAmount: 10,
    socketId: 'mock-socket-2',
    isAutoPlay: true
  };
  room10.tickets.set('test-real-user-2', [mockTicket2]);
  (engine as any).syncRoom10StandbyBots(room10);

  console.log(`   - Real Players: ${room10.tickets.size}`);
  console.log(`   - Bot Opponents: ${room10.opponentCards.length} (Expected: 0)`);
  console.log(`   - Total Pot: ${room10.totalPot} ETB (Expected: 20 ETB)`);
  console.log(`   - Total Players Count: ${engine.getRoomPlayersCount(room10)} (Expected: 2)`);

  if (room10.opponentCards.length !== 0) {
    throw new Error(`Standby bots must yield when >= 2 real players join, got ${room10.opponentCards.length}`);
  }
  if (room10.totalPot !== 20) {
    throw new Error(`Expected totalPot 20 ETB with 2 real players, got ${room10.totalPot}`);
  }

  // 7. Reset Room 10 back to 0 real players
  room10.tickets.clear();
  (engine as any).syncRoom10StandbyBots(room10);
  console.log('\n7️⃣ Resetting Room 10 back to idle:');
  console.log(`   - Opponents Count: ${room10.opponentCards.length} (Expected: 5)`);
  console.log(`   - Total Pot: ${room10.totalPot} ETB (Expected: 50 ETB)`);
  console.log(`   - Stake Summary [10]: ${engine.getStakeRoomsSummary()[10]} (Expected: 5)`);

  if (room10.opponentCards.length !== 5 || room10.totalPot !== 50) {
    throw new Error('Failed to restore idle 5-bot lobby state on ticket clear');
  }

  console.log('\n🎉 ALL SECTION 11 PHASE 1 TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runSection11Phase1Test().catch(err => {
  console.error('\n❌ Section 11 Phase 1 Test Failed:', err);
  process.exit(1);
});
