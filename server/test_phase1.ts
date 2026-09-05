import { gameEngine } from './game/BingoGameEngine.ts';

async function testPhase1() {
  console.log('🧪 Starting Phase 1 Backend Engine Verification...\n');

  // 1. Verify Rooms and Stakes
  console.log('1️⃣ Checking Room Stakes (10, 20, 50, 100 ETB)...');
  const rooms = gameEngine.getAllRooms();
  const stakes = rooms.map(r => r.stakeAmount);
  console.log('Room Stakes:', stakes);
  if (JSON.stringify(stakes) !== JSON.stringify([10, 20, 50, 100])) {
    throw new Error('Room stakes do not match [10, 20, 50, 100]!');
  }

  // 2. Verify 45-Second Gap & 50-Player Pot Calculation
  console.log('\n2️⃣ Checking 45s Gap & 50-Player Pot Economics with 10% System Lock...');
  const room10 = gameEngine.getRoom('room-10')!;
  console.log(`Room: ${room10.name}`);
  console.log(`Lobby Countdown: ${room10.lobbyCountdown}s (Target: 45s)`);
  console.log(`Total Pot: ${room10.totalPot} ETB (50 x 10 ETB = 500 ETB)`);
  console.log(`House Fee (10%): ${room10.houseFee} ETB`);
  console.log(`Winner Payout (90%): ${room10.winnerPayout} ETB`);

  if (room10.lobbyCountdown !== 45) {
    throw new Error(`Expected lobbyCountdown to be 45s, got ${room10.lobbyCountdown}`);
  }
  if (room10.totalPot !== 500 || room10.houseFee !== 50 || room10.winnerPayout !== 450) {
    throw new Error('50-player 10% system lock pot calculation mismatch!');
  }

  // 3. Verify Room-20
  const room20 = gameEngine.getRoom('room-20')!;
  console.log(`\nRoom: ${room20.name}`);
  console.log(`Total Pot: ${room20.totalPot} ETB (50 x 20 ETB = 1000 ETB)`);
  console.log(`Winner Payout: ${room20.winnerPayout} ETB (900 ETB)`);
  if (room20.totalPot !== 1000 || room20.winnerPayout !== 900) {
    throw new Error('Room-20 pot calculation mismatch!');
  }

  // 4. Test System Lock Toggle (ON / OFF)
  console.log('\n3️⃣ Testing Admin System Lock Toggle (ON / OFF)...');
  gameEngine.setHouseCommission(false);
  console.log(`Commission OFF - Total Pot: ${room10.totalPot}, Winner Payout: ${room10.winnerPayout}, House Fee: ${room10.houseFee}`);
  if (room10.winnerPayout !== 500 || room10.houseFee !== 0) {
    throw new Error('Expected 100% payout when commission is disabled!');
  }
  // Restore Commission ON
  gameEngine.setHouseCommission(true, 10);
  console.log(`Commission Restored ON (10%) - Winner Payout: ${room10.winnerPayout}, House Fee: ${room10.houseFee}`);
  if (room10.winnerPayout !== 450 || room10.houseFee !== 50) {
    throw new Error('Expected 450 payout when commission is 10%!');
  }

  // 5. Test Win Rate Configuration
  console.log('\n4️⃣ Testing Win Rate Configuration (20% Owner / 30% Bot / 50% Real)...');
  gameEngine.setWinRates(20, 30, 50);
  console.log('✓ Win rates configured successfully.');

  console.log('\n✅ [PHASE 1 COMPLETE AND FULLY VERIFIED]');
  process.exit(0);
}

testPhase1().catch(err => {
  console.error('❌ Phase 1 test failed:', err);
  process.exit(1);
});
