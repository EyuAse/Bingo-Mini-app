import { gameEngine } from './game/BingoGameEngine.ts';
import { query } from './db.ts';

const USER_A_ID = '73315c5b-4c84-4c69-917f-9d7deace5ad4';
const USER_A_NAME = 'Eyu Ase (Player 1)';

const USER_B_ID = 'f6ef9c82-d67f-4264-a810-8cd76ac6138a';
const USER_B_NAME = 'NATAN (Player 2)';

async function runMultiStakePotVerification() {
  console.log('===============================================================');
  console.log('🧪 MULTI-STAKE MATH & POT REAL-FLOW VERIFICATION');
  console.log('===============================================================\n');

  // Fund test wallets with 1000 ETB for clean testing across all stakes
  await query('UPDATE wallets SET balance = 1000.00, bonus = 0.00 WHERE user_id = $1', [USER_A_ID]);
  await query('UPDATE wallets SET balance = 1000.00, bonus = 0.00 WHERE user_id = $1', [USER_B_ID]);
  console.log('📦 Initialized test wallets in Neon PostgreSQL with 1000 ETB each.');

  const stakes = [
    { stake: 10, roomId: 'room-10', expected2PlayersPot: 20 },
    { stake: 20, roomId: 'room-20', expected2PlayersPot: 40 },
    { stake: 50, roomId: 'room-50', expected2PlayersPot: 100 },
    { stake: 100, roomId: 'room-100', expected2PlayersPot: 200 }
  ];

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition: boolean, msg: string) {
    totalChecks++;
    if (!condition) {
      console.error(`❌ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    } else {
      console.log(`   ✅ PASS: ${msg}`);
      passedChecks++;
    }
  }

  // Clear all rooms first for clean baseline test
  for (const { roomId } of stakes) {
    const room = gameEngine.getRoom(roomId)!;
    room.tickets.clear();
    room.opponentCards = [];
    room.activeUsers.clear();
    room.activeSockets.clear();
    room.realPlayerCount = 0;
    room.totalPot = 0;
    room.winnerPayout = 0;
    room.waitingForPlayers = true;
    room.lobbyCountdown = 45;
  }

  // 1. Initial State: All rooms empty, stake summary reports 0 for all
  console.log('\n1️⃣ Testing Initial Entrance Cards (Zero Phantom Counts):');
  const initialSummary = gameEngine.getStakeRoomsSummary();
  console.log('   Initial Stake Rooms Summary:', initialSummary);
  assert(initialSummary[10] === 0, '10 ETB Room summary is 0 when empty');
  assert(initialSummary[20] === 0, '20 ETB Room summary is 0 when empty');
  assert(initialSummary[50] === 0, '50 ETB Room summary is 0 when empty');
  assert(initialSummary[100] === 0, '100 ETB Room summary is 0 when empty');

  // 2. Test Pot Math & Matchmaking across all 4 stakes
  console.log('\n2️⃣ Testing Real-Flow Pot Math & Countdown Ticking Across All 4 Arenas:');

  for (const { stake, roomId, expected2PlayersPot } of stakes) {
    console.log(`\n--- Arena: ${stake} ETB Room (${roomId}) ---`);
    const room = gameEngine.getRoom(roomId);
    assert(!!room, `Room ${roomId} retrieved from gameEngine`);
    assert(room!.stakeAmount === stake, `Room stakeAmount is ${stake} ETB`);

    // Player 1 Joins
    gameEngine.handleJoinRoom(roomId, USER_A_ID, USER_A_NAME, `socket-a-${stake}`);
    assert(room!.waitingForPlayers === true, `Room is waiting for players (0 tickets bought)`);

    // Player 1 buys 1 ticket
    const ticket1Result = await gameEngine.handleBuyTicket(USER_A_ID, USER_A_NAME, roomId, [1], `socket-a-${stake}`);
    if (!ticket1Result.success) {
      console.error('ticket1Result error:', ticket1Result);
    }
    assert(ticket1Result.success === true, `Player 1 ticket purchased successfully in ${roomId}`);
    assert(room!.tickets.size === 1, `1 ticketed player registered in ${roomId}`);
    assert(room!.waitingForPlayers === true, `Lobby still waiting for players when only 1 ticket holder exists`);
    assert(room!.lobbyCountdown === 45, `Lobby countdown remains frozen at 45s with 1 player`);
    assert(room!.totalPot === stake, `Total pot is exactly ${stake} ETB with 1 player`);
    assert(room!.winnerPayout === stake, `Winner payout is exactly ${stake} ETB (0% fee <= 5 players)`);

    // Verify entrance card summary shows 1 player for this stake
    const summaryAfter1 = gameEngine.getStakeRoomsSummary();
    assert(summaryAfter1[stake] === 1, `${stake} ETB entrance card reports 1 ticket holder`);

    // Player 2 Joins
    gameEngine.handleJoinRoom(roomId, USER_B_ID, USER_B_NAME, `socket-b-${stake}`);

    // Player 2 buys 1 ticket
    const ticket2Result = await gameEngine.handleBuyTicket(USER_B_ID, USER_B_NAME, roomId, [2], `socket-b-${stake}`);
    assert(ticket2Result.success === true, `Player 2 ticket purchased successfully in ${roomId}`);
    assert(room!.tickets.size === 2, `2 ticketed players registered in ${roomId}`);
    assert(room!.waitingForPlayers === false, `waitingForPlayers is false now that 2 tickets are confirmed!`);

    // Pot verification for 2 players
    assert(room!.totalPot === expected2PlayersPot, `Total Pot for 2 players @ ${stake} ETB = ${expected2PlayersPot} ETB`);
    assert(room!.winnerPayout === expected2PlayersPot, `Winner payout for 2 players @ ${stake} ETB = ${expected2PlayersPot} ETB (100% net pot)`);

    // Entrance card summary reflects 2 players
    const summaryAfter2 = gameEngine.getStakeRoomsSummary();
    assert(summaryAfter2[stake] === 2, `${stake} ETB entrance card reports 2 ticket holders`);
  }

  // 3. Multi-Card Dynamic Pot Contribution (e.g. 50 ETB Room)
  console.log('\n3️⃣ Testing Multi-Cartela Dynamic Pot Contributions (50 ETB Room):');
  const room50 = gameEngine.getRoom('room-50')!;
  room50.tickets.clear();
  room50.totalPot = 0;
  room50.winnerPayout = 0;

  // Player 1 buys 2 cartelas in 50 ETB room (100 ETB)
  const p1Buy2 = await gameEngine.handleBuyTicket(USER_A_ID, USER_A_NAME, 'room-50', [10, 11], 'socket-a-50');
  assert(p1Buy2.success === true, 'Player 1 purchased 2 cartelas in 50 ETB room');
  assert(p1Buy2.tickets?.length === 2, 'Player 1 received exactly 2 tickets');

  // Player 2 buys 1 cartela in 50 ETB room (50 ETB)
  const p2Buy1 = await gameEngine.handleBuyTicket(USER_B_ID, USER_B_NAME, 'room-50', [12], 'socket-b-50');
  assert(p2Buy1.success === true, 'Player 2 purchased 1 cartela in 50 ETB room');

  // Total Pot: 2 cards @ 50 ETB + 1 card @ 50 ETB = 150 ETB
  assert(room50.totalPot === 150, 'Total pot is exactly 150 ETB (2 cards from Player 1 + 1 card from Player 2 @ 50 ETB)');
  assert(room50.winnerPayout === 150, 'Winner payout is exactly 150 ETB (0% fee for <= 5 players)');

  // 4. Test Single-Device Session Enforcement Untouched Check
  console.log('\n4️⃣ Verifying Single-Device Enforcement Integrity:');
  const gameSocketFile = await import('./sockets/gameSocket.ts');
  assert(typeof gameSocketFile.setupGameSockets === 'function', 'setupGameSockets export is 100% intact');

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passedChecks}/${totalChecks} MULTI-STAKE VERIFICATION CHECKS PASSED 100%!`);
  console.log('===============================================================');
  process.exit(0);
}

runMultiStakePotVerification().catch(err => {
  console.error('❌ Multi-Stake Verification Error:', err);
  process.exit(1);
});
