import { gameEngine, ARENA_ROOM_ID } from '../game/BingoGameEngine.ts';
import { checkWinningPattern } from '../game/cartelaGenerator.ts';

async function runPhase12Verification() {
  console.log('=================================================================');
  console.log('🏆 PHASE 12: DERASH PAYOUT HARMONY & MULTI-ROOM SAFETY AUDIT');
  console.log('=================================================================\n');

  const engine = gameEngine;

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 1: The Exact 530 ETB Pot from User's Screenshot
  // ─────────────────────────────────────────────────────────────
  console.log('[Test Suite 1] Testing Exact 530 ETB Pot (50 Bots + 3 Real Players)...');
  engine.setBotConfig({
    mode: 'fixed',
    fixedCount: 50,
    livingClock: true
  });

  const room10 = (engine as any).getRoom('room-10') || (engine as any).getRoom(ARENA_ROOM_ID);
  if (!room10) throw new Error('Room 10 not found');

  (engine as any).syncRoom10StandbyBots(room10, true);

  // Set up 3 real player tickets
  room10.tickets.clear();
  const realUserIds = [
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003'
  ];

  realUserIds.forEach((uid, idx) => {
    room10.tickets.set(uid, [{
      userId: uid,
      userName: `Real User ${idx + 1}`,
      cartelaId: 101 + idx,
      cardMatrix: [],
      betAmount: 10,
      socketId: `sock_${idx}`,
      isAutoPlay: true
    }]);
  });

  (engine as any).recalculatePot(room10);

  console.log(`  Pot Audit:`);
  console.log(`  - Standby Bots Count:       ${room10.opponentCards.length}`);
  console.log(`  - Real Players Count:       ${room10.tickets.size}`);
  console.log(`  - Total Cartelas:           ${room10.opponentCards.length + room10.tickets.size}`);
  console.log(`  - Total Gross Pot:          ${room10.totalPot} ETB`);
  console.log(`  - Platform Commission:      ${room10.houseFee} ETB (20%)`);
  console.log(`  - Expected Net Derash:      ${room10.winnerPayout} ETB`);

  if (room10.totalPot !== 530) throw new Error(`Expected 530 ETB pot, got ${room10.totalPot}`);
  if (room10.houseFee !== 106) throw new Error(`Expected 106 ETB commission, got ${room10.houseFee}`);
  if (room10.winnerPayout !== 424) throw new Error(`Expected 424 ETB payout, got ${room10.winnerPayout}`);

  // Simulate Bot Victory
  room10.winResult = null;
  room10.isProcessingVictory = false;
  const winningBot = room10.opponentCards[0];
  const botWinningCards = [{
    userName: winningBot.opponentName,
    cartelaId: winningBot.cartelaId,
    isReal: false,
    winningPattern: 'Horizontal Line',
    winningIndices: [0, 1, 2, 3, 4]
  }];

  await (engine as any).processRoundVictory(room10, botWinningCards);
  const winResult = room10.winResult;

  console.log(`\n  Bot Victory WinResult:`);
  console.log(`  - Declared Winner:          ${winResult.winnerName} (Cartela #${winResult.winningCartelaNumber})`);
  console.log(`  - Gross Room Pot:           ${winResult.totalPot} ETB`);
  console.log(`  - Platform Fee:             ${winResult.houseFee} ETB (-20%)`);
  console.log(`  - Displayed Winner Payout:  ${winResult.winnerPayout} ETB (Expected: 424 ETB)`);
  console.log(`  - Share Per Winner:         ${winResult.sharePerWinner} ETB`);
  console.log(`  - isSplit Mode:             ${winResult.isSplit}`);
  console.log(`  - Co-Winners:               [${winResult.coWinners.join(', ')}]`);

  if (winResult.winnerPayout !== 424) {
    throw new Error(`CRITICAL FAILURE: winnerPayout is ${winResult.winnerPayout} ETB! Must be exactly 424 ETB!`);
  }
  if (winResult.totalPot - winResult.houseFee !== winResult.winnerPayout) {
    throw new Error(`CRITICAL ARITHMETIC DISCREPANCY: ${winResult.totalPot} - ${winResult.houseFee} !== ${winResult.winnerPayout}`);
  }
  if (winResult.isSplit !== false) {
    throw new Error('CRITICAL FAILURE: isSplit is true on bot victory! Bots must never split among themselves!');
  }
  if (winResult.coWinners.length > 0) {
    throw new Error('CRITICAL FAILURE: coWinners is populated on bot victory!');
  }
  console.log('  ✅ [Suite 1 PASSED] 530 ETB Pot produces exactly 424 ETB Derash with 0 ETB discrepancy!\n');

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 2: Real Player Solo Win in Room 10
  // ─────────────────────────────────────────────────────────────
  console.log('[Test Suite 2] Testing Real Player Solo Win in Room 10 (530 ETB Pot)...');
  room10.winResult = null;
  room10.isProcessingVictory = false;

  const realWinningCards = [{
    userId: realUserIds[0],
    userName: 'Real User 1',
    cartelaId: 101,
    isReal: true,
    winningPattern: 'Bingo Line',
    winningIndices: [0, 1, 2, 3, 4]
  }];

  await (engine as any).processRoundVictory(room10, realWinningCards);
  const realWinResult = room10.winResult;

  console.log(`  Real Win WinResult:`);
  console.log(`  - Winner Name:              ${realWinResult.winnerName}`);
  console.log(`  - Winner User ID:           ${realWinResult.winnerId}`);
  console.log(`  - Awarded Payout:           ${realWinResult.winnerPayout} ETB (Expected: 424 ETB)`);
  console.log(`  - User Share:               ${realWinResult.userShare} ETB`);

  if (realWinResult.winnerPayout !== 424 || realWinResult.userShare !== 424) {
    throw new Error(`CRITICAL FAILURE: Real player was not awarded full 424 ETB! Payout: ${realWinResult.winnerPayout}`);
  }
  console.log('  ✅ [Suite 2 PASSED] Real player receives full 424 ETB Net Derash!\n');

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 3: Strict Multi-Room Firewall Audit (Rooms 20, 50, 100)
  // ─────────────────────────────────────────────────────────────
  console.log('[Test Suite 3] Auditing Strict Multi-Room Isolation Firewall (Rooms 20, 50, 100)...');

  for (const roomId of ['room-20', 'room-50', 'room-100']) {
    const room = (engine as any).getRoom(roomId);
    if (!room) throw new Error(`${roomId} not found`);

    console.log(`  Testing ${roomId}:`);

    // Invariant 1: Strictly 0 Bots
    if (room.opponentCards.length !== 0) {
      throw new Error(`CRITICAL ISOLATION BREACH: ${roomId} has ${room.opponentCards.length} bots! Must be strictly 0!`);
    }
    console.log(`    ✓ Bot Count: 0 bots (Strictly human P2P)`);

    // Invariant 2: Tiered Commission Math (<= 5 cartelas = 0%, > 5 cartelas = 20%)
    room.tickets.clear();
    const stake = room.stakeAmount;

    // 2 players (2 cards <= 5 cards)
    const roomIndex = roomId === 'room-20' ? 2 : (roomId === 'room-50' ? 5 : 8);
    const uA = `c0000000-0000-0000-0000-00000000000${roomIndex}`;
    const uB = `c0000000-0000-0000-0000-00000000000${roomIndex + 1}`;
    room.tickets.set(uA, [{ userId: uA, userName: 'User A', cartelaId: 1, cardMatrix: [], betAmount: stake, socketId: 's1', isAutoPlay: true }]);
    room.tickets.set(uB, [{ userId: uB, userName: 'User B', cartelaId: 2, cardMatrix: [], betAmount: stake, socketId: 's2', isAutoPlay: true }]);

    (engine as any).recalculatePot(room);
    console.log(`    ✓ Tiered Rake (2 cards): Pot = ${room.totalPot} ETB, House Fee = ${room.houseFee} ETB (0% fee, Expected: 0 ETB)`);
    if (room.houseFee !== 0) throw new Error(`Expected 0 fee for <=5 cards in ${roomId}, got ${room.houseFee}`);

    // 6 players (> 5 cards)
    for (let i = 3; i <= 6; i++) {
      const uX = `c0000000-0000-0000-0000-00000000001${i}`;
      room.tickets.set(uX, [{ userId: uX, userName: `User ${i}`, cartelaId: i, cardMatrix: [], betAmount: stake, socketId: `s${i}`, isAutoPlay: true }]);
    }
    (engine as any).recalculatePot(room);
    const expectedPot = 6 * stake;
    const expectedFee = Math.floor(expectedPot * 0.20);
    console.log(`    ✓ Tiered Rake (6 cards): Pot = ${room.totalPot} ETB, House Fee = ${room.houseFee} ETB (20% fee, Expected: ${expectedFee} ETB)`);
    if (room.houseFee !== expectedFee) throw new Error(`Expected ${expectedFee} fee for 6 cards in ${roomId}, got ${room.houseFee}`);

    // Invariant 3: Real Human Multiplayer Split Pot
    room.winResult = null;
    room.isProcessingVictory = false;
    const splitWinners = [
      { userId: uA, userName: 'User A', cartelaId: 1, isReal: true, winningPattern: 'Bingo Line', winningIndices: [0, 1, 2, 3, 4] },
      { userId: uB, userName: 'User B', cartelaId: 2, isReal: true, winningPattern: 'Bingo Line', winningIndices: [0, 1, 2, 3, 4] }
    ];

    await (engine as any).processRoundVictory(room, splitWinners);
    const splitRes = room.winResult;
    const netPool = room.winnerPayout;
    const expectedShare = Math.floor(netPool / 2);

    console.log(`    ✓ Real Human Split Pot: isSplit = ${splitRes.isSplit}, Share Per Winner = ${splitRes.sharePerWinner} ETB (Expected: ${expectedShare} ETB)`);
    if (!splitRes.isSplit) throw new Error(`Real human split pot failed in ${roomId}! isSplit is false`);
    if (splitRes.sharePerWinner !== expectedShare) throw new Error(`Human share calculation incorrect in ${roomId}!`);
    console.log(`    ✅ ${roomId} is 100% isolated, healthy, and untouched.\n`);
  }

  console.log('=================================================================');
  console.log('🎉 ALL 3 TEST SUITES PASSED WITH 100% SUCCESS!');
  console.log('=================================================================\n');

  process.exit(0);
}

runPhase12Verification().catch(err => {
  console.error('❌ Phase 12 Verification Failed:', err);
  process.exit(1);
});
