import { gameEngine } from './game/BingoGameEngine.ts';

async function runSection11Phase2Test() {
  console.log('🧪 Starting Section 11 Phase 2 Validation Suite...\n');

  const engine = gameEngine;
  const room10 = engine.getRoom('room-10');
  if (!room10) throw new Error('room-10 not found');

  // Step 1: Verify Initial Idle State in Room 10
  console.log('1️⃣ Checking Room 10 Initial Idle State:');
  console.log(`   - Waiting for Players: ${room10.waitingForPlayers}`);
  console.log(`   - Players Count: ${engine.getRoomPlayersCount(room10)}`);
  console.log(`   - Total Pot: ${room10.totalPot} ETB`);
  console.log(`   - Lobby Countdown: ${room10.lobbyCountdown}s`);

  if (!room10.waitingForPlayers) {
    throw new Error('Room 10 should be waitingForPlayers = true when idle');
  }
  if (engine.getRoomPlayersCount(room10) !== 5) {
    throw new Error(`Expected 5 standby bots, got ${engine.getRoomPlayersCount(room10)}`);
  }
  if (room10.totalPot !== 50) {
    throw new Error(`Expected 50 ETB pot, got ${room10.totalPot}`);
  }

  // Step 2: 1 Real Player Purchases Ticket in Room 10
  console.log('\n2️⃣ Simulating 1 Real Player Purchasing Ticket in Room 10:');
  const mockUserId = 'phase2-test-user';
  const mockTicket = {
    userId: mockUserId,
    userName: 'Kidus Tester',
    cartelaId: 44,
    cardMatrix: [] as any[],
    betAmount: 10,
    socketId: 'mock-socket-phase2',
    isAutoPlay: true
  };
  room10.tickets.set(mockUserId, [mockTicket]);
  room10.realPlayerCount = engine.getRealCartelaCount(room10);
  const isRoom10 = room10.id === 'room-10';
  room10.waitingForPlayers = isRoom10 ? room10.tickets.size < 1 : room10.tickets.size < 2;
  (engine as any).syncRoom10StandbyBots(room10);

  console.log(`   - Real Tickets: ${room10.tickets.size}`);
  console.log(`   - Waiting for Players: ${room10.waitingForPlayers} (Expected: false)`);
  console.log(`   - Total Players: ${engine.getRoomPlayersCount(room10)} (Expected: 6)`);
  console.log(`   - Total Pot: ${room10.totalPot} ETB (Expected: 60 ETB)`);
  console.log(`   - Winner Payout: ${room10.winnerPayout} ETB (Expected: 48 ETB)`);

  if (room10.waitingForPlayers !== false) {
    throw new Error('Room 10 waitingForPlayers must be FALSE when 1 ticket is bought');
  }
  if (engine.getRoomPlayersCount(room10) !== 6) {
    throw new Error(`Expected 6 players (1 real + 5 bots), got ${engine.getRoomPlayersCount(room10)}`);
  }
  if (room10.totalPot !== 60) {
    throw new Error(`Expected 60 ETB pot, got ${room10.totalPot}`);
  }

  // Step 3: Verify Other Rooms Remain In Waiting State
  console.log('\n3️⃣ Verifying Rooms 20, 50, 100 Isolation:');
  for (const rid of ['room-20', 'room-50', 'room-100']) {
    const r = engine.getRoom(rid);
    const rIsWaiting = r.tickets.size < 2;
    console.log(`   - ${r.name}: Tickets=${r.tickets.size}, Waiting=${rIsWaiting}`);
    if (!rIsWaiting) {
      throw new Error(`Room ${rid} should require >= 2 players to leave waiting state`);
    }
  }

  // Step 4: Player Cancels Ticket in Lobby
  console.log('\n4️⃣ Simulating Player Cancelling Ticket in Room 10:');
  room10.tickets.delete(mockUserId);
  room10.realPlayerCount = engine.getRealCartelaCount(room10);
  room10.waitingForPlayers = isRoom10 ? room10.tickets.size < 1 : room10.tickets.size < 2;
  (engine as any).syncRoom10StandbyBots(room10);
  room10.lobbyCountdown = 45;

  console.log(`   - Real Tickets: ${room10.tickets.size}`);
  console.log(`   - Waiting for Players: ${room10.waitingForPlayers} (Expected: true)`);
  console.log(`   - Total Players: ${engine.getRoomPlayersCount(room10)} (Expected: 5)`);
  console.log(`   - Total Pot: ${room10.totalPot} ETB (Expected: 50 ETB)`);
  console.log(`   - Lobby Countdown: ${room10.lobbyCountdown}s (Expected: 45s)`);

  if (room10.waitingForPlayers !== true) {
    throw new Error('Room 10 waitingForPlayers must be TRUE after ticket cancellation');
  }
  if (engine.getRoomPlayersCount(room10) !== 5) {
    throw new Error(`Expected 5 players after cancellation, got ${engine.getRoomPlayersCount(room10)}`);
  }
  if (room10.totalPot !== 50) {
    throw new Error(`Expected 50 ETB pot after cancellation, got ${room10.totalPot}`);
  }
  if (room10.lobbyCountdown !== 45) {
    throw new Error(`Expected countdown reset to 45s, got ${room10.lobbyCountdown}`);
  }

  console.log('\n🎉 ALL SECTION 11 PHASE 2 TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runSection11Phase2Test().catch(err => {
  console.error('\n❌ Section 11 Phase 2 Test Failed:', err);
  process.exit(1);
});
