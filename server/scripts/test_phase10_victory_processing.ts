import { gameEngine, ARENA_ROOM_ID } from '../game/BingoGameEngine.ts';

async function runPhase10Verification() {
  console.log('🧪 [Test Phase 10] Starting Server Victory Processing & Math Equality Verification...\n');

  const engine = gameEngine;

  // 1. Configure Room 10 with 50 Standby Bots + 3 Real Tickets (530 ETB Pot)
  engine.setBotConfig({
    mode: 'fixed',
    fixedCount: 50,
    livingClock: true
  });

  const room10 = (engine as any).getRoom('room-10') || (engine as any).getRoom(ARENA_ROOM_ID);
  if (!room10) throw new Error('Room 10 not found');

  (engine as any).syncRoom10StandbyBots(room10, true);

  // Add 3 real tickets
  room10.tickets.clear();
  const dummyUserIds = [
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003'
  ];

  dummyUserIds.forEach((uid, idx) => {
    room10.tickets.set(uid, [{
      userId: uid,
      userName: `Player ${idx + 1}`,
      cartelaId: 10 + idx,
      cardMatrix: [],
      betAmount: 10,
      socketId: `sock_${idx}`,
      isAutoPlay: true
    }]);
  });

  // Calculate Pot
  (engine as any).recalculatePot(room10);

  console.log(`📊 [Room 10 Pot Check]`);
  console.log(`   Total Cards: ${room10.opponentCards.length + 3} (50 bots + 3 real players)`);
  console.log(`   Total Room Pot: ${room10.totalPot} ETB (Expected: 530 ETB)`);
  console.log(`   Platform Commission: ${room10.houseFee} ETB (Expected: 106 ETB)`);
  console.log(`   Expected Net Derash: ${room10.winnerPayout} ETB (Expected: 424 ETB)\n`);

  if (room10.totalPot !== 530) throw new Error(`Expected totalPot 530, got ${room10.totalPot}`);
  if (room10.houseFee !== 106) throw new Error(`Expected houseFee 106, got ${room10.houseFee}`);
  if (room10.winnerPayout !== 424) throw new Error(`Expected winnerPayout 424, got ${room10.winnerPayout}`);

  // 2. Simulate Bot Victory in Room 10
  room10.winResult = null;
  room10.isProcessingVictory = false;
  const winningBot = room10.opponentCards[0];
  const botWinningCards = [{
    userName: winningBot.opponentName,
    cartelaId: winningBot.cartelaId,
    isReal: false,
    winningPattern: 'Bingo Line',
    winningIndices: [0, 1, 2, 3, 4]
  }];

  await (engine as any).processRoundVictory(room10, botWinningCards);
  const winResult = room10.winResult;

  console.log(`🏆 [Phase 10 WinResult Payload Verification - Bot Win in Room 10]`);
  console.log(`   Winner Name:          ${winResult.winnerName}`);
  console.log(`   Winner Cartela:       #${winResult.winningCartelaNumber}`);
  console.log(`   Total Pot:            ${winResult.totalPot} ETB`);
  console.log(`   Platform Commission:  ${winResult.houseFee} ETB (20%)`);
  console.log(`   Net Prize Pot:        ${winResult.netPrizePot} ETB`);
  console.log(`   Winner Payout:        ${winResult.winnerPayout} ETB (Expected: 424 ETB, NEVER 141 ETB!)`);
  console.log(`   Share Per Winner:     ${winResult.sharePerWinner} ETB`);
  console.log(`   isSplit:              ${winResult.isSplit} (Expected: false)`);
  console.log(`   Co-Winners:           [${winResult.coWinners.join(', ')}] (Expected: empty)`);

  // Assertions for Room 10
  if (winResult.winnerPayout !== 424) {
    throw new Error(`CRITICAL DEFECT: winnerPayout is ${winResult.winnerPayout} ETB! Must be exactly 424 ETB!`);
  }
  if (winResult.totalPot - winResult.houseFee !== winResult.winnerPayout) {
    throw new Error(`MATH INCONSISTENCY: totalPot (${winResult.totalPot}) - houseFee (${winResult.houseFee}) !== winnerPayout (${winResult.winnerPayout})`);
  }
  if (winResult.isSplit !== false) {
    throw new Error(`CRITICAL DEFECT: isSplit is true on bot victory! Bots must never trigger split mode!`);
  }
  if (winResult.coWinners.length !== 0) {
    throw new Error(`CRITICAL DEFECT: coWinners is not empty on bot victory!`);
  }
  console.log(`✅ [Assertion 1 Passed] 530 ETB Pot -> 106 ETB House Fee -> Exactly 424 ETB Winner Payout! Math is 100% harmonious.\n`);

  // 3. Multi-Room Firewall Check: Room 20 Peer-to-Peer Split Pot
  console.log(`🛡️ [Multi-Room Firewall Check: Room 20 Genuine Human Split]`);
  const room20 = (engine as any).getRoom('room-20');
  if (!room20) throw new Error('Room 20 not found');

  room20.winResult = null;
  room20.isProcessingVictory = false;
  room20.opponentCards = []; // Strictly 0 bots
  room20.tickets.clear();

  // 2 Real players in Room 20 (20 ETB each, 2 cards <= 5 cards -> 0% rake)
  const u1 = 'b0000000-0000-0000-0000-000000000001';
  const u2 = 'b0000000-0000-0000-0000-000000000002';
  room20.tickets.set(u1, [{
    userId: u1,
    userName: 'Human Alpha',
    cartelaId: 201,
    cardMatrix: [],
    betAmount: 20,
    socketId: 'sock_u1',
    isAutoPlay: true
  }]);
  room20.tickets.set(u2, [{
    userId: u2,
    userName: 'Human Beta',
    cartelaId: 202,
    cardMatrix: [],
    betAmount: 20,
    socketId: 'sock_u2',
    isAutoPlay: true
  }]);

  (engine as any).recalculatePot(room20);
  console.log(`   Room 20 Pot: ${room20.totalPot} ETB, House Fee: ${room20.houseFee} ETB (0% fee for <=5 cards)`);
  if (room20.totalPot !== 40) throw new Error(`Expected 40 ETB in Room 20, got ${room20.totalPot}`);
  if (room20.houseFee !== 0) throw new Error(`Expected 0 ETB fee for 2 cards in Room 20, got ${room20.houseFee}`);

  // Both humans call Bingo simultaneously in Room 20
  const humanSplitWinners = [
    {
      userId: u1,
      userName: 'Human Alpha',
      cartelaId: 201,
      isReal: true,
      winningPattern: 'Bingo Line',
      winningIndices: [0, 1, 2, 3, 4]
    },
    {
      userId: u2,
      userName: 'Human Beta',
      cartelaId: 202,
      isReal: true,
      winningPattern: 'Bingo Line',
      winningIndices: [0, 1, 2, 3, 4]
    }
  ];

  await (engine as any).processRoundVictory(room20, humanSplitWinners);
  const winResult20 = room20.winResult;

  console.log(`   Room 20 WinType: ${winResult20.winType}`);
  console.log(`   Room 20 isSplit: ${winResult20.isSplit} (Expected: true)`);
  console.log(`   Room 20 Share Per Winner: ${winResult20.sharePerWinner} ETB (Expected: 20 ETB)`);
  console.log(`   Room 20 Co-Winners: [${winResult20.coWinners.join(', ')}]`);

  if (!winResult20.isSplit) {
    throw new Error('CRITICAL REGRESSION: Room 20 real human split failed! isSplit is not true!');
  }
  if (winResult20.sharePerWinner !== 20) {
    throw new Error(`CRITICAL REGRESSION: Room 20 human share is ${winResult20.sharePerWinner}, expected 20!`);
  }

  console.log(`✅ [Assertion 2 Passed] Room 20 P2P human split pot remains 100% untouched and functional!\n`);

  console.log('🎉 [PHASE 10 PASSED] Server Victory Processing & Math Equality 100% Verified!\n');
  process.exit(0);
}

runPhase10Verification().catch(err => {
  console.error('❌ Phase 10 Verification Failed:', err);
  process.exit(1);
});
