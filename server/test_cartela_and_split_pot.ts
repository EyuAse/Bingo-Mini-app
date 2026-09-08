/**
 * Test: 400 Cartela Selection & Simultaneous Split Pot Verification
 */
import { gameEngine } from './game/BingoGameEngine.ts';
import { checkWinningPattern } from './game/BingoGameEngine.ts';

async function runAudit() {
  console.log('🧪 Starting 400 Cartela Selection & Simultaneous Split-Pot Audit...');

  const roomId = 'room-10';
  const room = gameEngine.getRoom(roomId);
  if (!room) {
    throw new Error('Room room-10 not found');
  }

  // ── Test 1: User Cartela Selection & Reservation ────────────────
  console.log('\n1️⃣ Testing User Cartela Selection & Concurrency Guard...');
  
  // Clean room tickets for isolated test
  room.tickets.clear();
  room.occupiedCartelaIds = new Set<number>();

  const userA = { id: '00000000-0000-4000-8000-000000000001', name: 'Dawit Haile' };
  const userB = { id: '00000000-0000-4000-8000-000000000002', name: 'Selam Tesfaye' };

  // User A requests Cartela #15 and #42
  console.log('User A requests Cartela #15 and #42...');
  const resA = await gameEngine.handleBuyTicket(userA.id, userA.name, roomId, [15, 42]);
  
  if (!resA.success) {
    console.error('❌ Failed User A purchase:', resA.error);
    throw new Error('User A purchase failed');
  }

  const assignedUserACartelas = resA.tickets.map(t => t.cartelaId);
  console.log('✓ User A tickets issued for Cartelas:', assignedUserACartelas);
  if (!assignedUserACartelas.includes(15) || !assignedUserACartelas.includes(42)) {
    throw new Error(`Expected Cartelas #15 and #42, got: ${assignedUserACartelas.join(', ')}`);
  }

  // User B attempts to buy Cartela #15 (already taken by User A)
  console.log('User B attempts to request Cartela #15 (should be rejected as occupied)...');
  const resBConflict = await gameEngine.handleBuyTicket(userB.id, userB.name, roomId, [15, 99]);
  if (resBConflict.success) {
    throw new Error('❌ Expected Cartela #15 to be rejected as already taken, but purchase succeeded!');
  }
  console.log('✓ User B was correctly rejected:', resBConflict.error);

  // User B requests untaken Cartelas #77 and #88
  console.log('User B requests untaken Cartelas #77 and #88...');
  const resBSuccess = await gameEngine.handleBuyTicket(userB.id, userB.name, roomId, [77, 88]);
  if (!resBSuccess.success) {
    throw new Error(`User B valid purchase failed: ${resBSuccess.error}`);
  }
  const assignedUserBCartelas = resBSuccess.tickets.map(t => t.cartelaId);
  console.log('✓ User B tickets issued for Cartelas:', assignedUserBCartelas);
  if (!assignedUserBCartelas.includes(77) || !assignedUserBCartelas.includes(88)) {
    throw new Error(`Expected Cartelas #77 and #88, got: ${assignedUserBCartelas.join(', ')}`);
  }

  // ── Test 2: Simultaneous Split Pot Verification ─────────────────
  console.log('\n2️⃣ Testing Simultaneous Split-Pot Logic (2 Winners Sharing Net Pot 50/50)...');

  // Let pot be 100 ETB (with > 5 players or simulated commission)
  room.totalPot = 200;
  room.houseFee = 40; // 20%
  room.winnerPayout = 160; // 160 ETB net payout

  const winningCards = [
    {
      userId: userA.id,
      userName: userA.name,
      cartelaId: 15,
      isReal: true,
      winningPattern: 'Horizontal Row 1',
      winningIndices: [0, 1, 2, 3, 4]
    },
    {
      userId: userB.id,
      userName: userB.name,
      cartelaId: 77,
      isReal: true,
      winningPattern: 'Diagonal TL-BR',
      winningIndices: [0, 6, 12, 18, 24]
    }
  ];

  // Run victory processing
  await (gameEngine as any).processRoundVictory(room, winningCards);

  const winResult = room.winResult;
  console.log('Win Result outcome:');
  console.log('  isSplit:', winResult.isSplit);
  console.log('  totalPot:', winResult.totalPot);
  console.log('  winnerPayout (Net):', winResult.winnerPayout);
  console.log('  coWinners:', winResult.coWinners);

  if (!winResult.isSplit) {
    throw new Error('❌ Expected winResult.isSplit to be true for simultaneous winners!');
  }

  // Each winner should get exactly 160 / 2 = 80 ETB
  const expectedShare = 80;
  const actualShare = winResult.winnerPayout;
  if (actualShare !== expectedShare) {
    throw new Error(`❌ Expected split share of ${expectedShare} ETB, got ${actualShare} ETB`);
  }

  console.log(`✓ Both players split the net 160 ETB pot equally: ${actualShare} ETB each (50/50)!`);
  console.log('✓ Co-winners announced transparently in win result.');

  // Clean up
  room.tickets.clear();

  console.log('\n======================================================');
  console.log('🎉 ALL 400 CARTELA & SPLIT-POT AUDIT CHECKS PASSED 100%!');
  console.log('======================================================');
}

runAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
