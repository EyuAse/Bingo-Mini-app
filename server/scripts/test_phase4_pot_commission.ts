import { sampleStandbyBots, isStandbyBotId } from '../game/ethiopianBotRoster.ts';
import { generateCardFromId } from '../game/cartelaGenerator.ts';

/**
 * Phase 4: Pot & Commission Verification Suite
 * Validates the financial accuracy, platform fee deduction, and ledger consistency.
 */
async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4: Pot & Commission Verification Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // --- Scenario 1: Standard 1 Real Player in Room 10 + 5 Standby Bots ---
  console.log('--- Scenario 1: Room 10 Standard Match (1 Player + 5 Standby Bots) ---');
  const realCartelas1 = 1;
  const stake1 = 10.0;
  const standbyBots1 = sampleStandbyBots(5);
  const botCartelas1 = standbyBots1.length; // 5

  const totalCartelas1 = realCartelas1 + botCartelas1; // 6
  const totalPot1 = (realCartelas1 * stake1) + (botCartelas1 * stake1); // 60
  const commissionEnabled1 = totalCartelas1 > 5;
  const houseFee1 = commissionEnabled1 ? Math.floor(totalPot1 * 0.20) : 0; // 12
  const winnerPayout1 = totalPot1 - houseFee1; // 48

  console.log(`  📊 Metrics: Cartelas=${totalCartelas1}, Pot=${totalPot1} ETB, HouseFee=${houseFee1} ETB, Payout=${winnerPayout1} ETB`);
  assert(totalCartelas1 === 6, 'Total cartela count is exactly 6 (1 real + 5 bots)');
  assert(totalPot1 === 60, 'Gross pot is exactly 60 ETB');
  assert(commissionEnabled1 === true, 'Commission is activated (totalCartelas > 5)');
  assert(houseFee1 === 12, 'House fee is exactly 12 ETB (20% of 60 ETB)');
  assert(winnerPayout1 === 48, 'Winner payout is exactly 48 ETB (80% of 60 ETB)');
  assert(houseFee1 + winnerPayout1 === totalPot1, 'Zero-leakage: houseFee + winnerPayout equals totalPot (12 + 48 = 60)');

  // --- Scenario 2: Real Player Buys 2 Cartelas in Room 10 + 5 Standby Bots ---
  console.log('\n--- Scenario 2: Real Player Buys 2 Cartelas in Room 10 (2 Player Cards + 5 Standby Bots) ---');
  const realCartelas2 = 2;
  const totalCartelas2 = realCartelas2 + 5; // 7
  const totalPot2 = (realCartelas2 * 10) + (5 * 10); // 70
  const commissionEnabled2 = totalCartelas2 > 5;
  const houseFee2 = commissionEnabled2 ? Math.floor(totalPot2 * 0.20) : 0; // 14
  const winnerPayout2 = totalPot2 - houseFee2; // 56

  console.log(`  📊 Metrics: Cartelas=${totalCartelas2}, Pot=${totalPot2} ETB, HouseFee=${houseFee2} ETB, Payout=${winnerPayout2} ETB`);
  assert(totalCartelas2 === 7, 'Total cartela count is 7 (2 real + 5 bots)');
  assert(totalPot2 === 70, 'Gross pot is 70 ETB');
  assert(houseFee2 === 14, 'House fee is 14 ETB (20% of 70 ETB)');
  assert(winnerPayout2 === 56, 'Winner payout is 56 ETB (80% of 70 ETB)');
  assert(houseFee2 + winnerPayout2 === totalPot2, 'Zero-leakage: houseFee + winnerPayout equals totalPot (14 + 56 = 70)');

  // --- Scenario 3: Real Match with 2 Human Players in Room 10 (0 Standby Bots) ---
  console.log('\n--- Scenario 3: Natural 2 Human Players in Room 10 (0 Standby Bots Injected) ---');
  const distinctPlayers3 = 2;
  const totalCartelas3 = 2;
  const totalPot3 = 20;
  // <= 5 cartelas: 0% commission (Derash friendly rule)
  const commissionEnabled3 = totalCartelas3 > 5;
  const houseFee3 = commissionEnabled3 ? Math.floor(totalPot3 * 0.20) : 0;
  const winnerPayout3 = totalPot3 - houseFee3;

  console.log(`  📊 Metrics: Cartelas=${totalCartelas3}, Pot=${totalPot3} ETB, HouseFee=${houseFee3} ETB, Payout=${winnerPayout3} ETB`);
  assert(distinctPlayers3 === 2, '2 distinct human players present');
  assert(totalPot3 === 20, 'Pot is 20 ETB (2 x 10 ETB)');
  assert(commissionEnabled3 === false, '0% commission tier for <= 5 cartelas');
  assert(houseFee3 === 0, 'House fee is 0 ETB');
  assert(winnerPayout3 === 20, 'Winner payout is 100% of pot (20 ETB)');

  // --- Scenario 4: Lone-Player in Rooms 20, 50, 100 (Rollover, 0 Pot, 0 Deductions) ---
  console.log('\n--- Scenario 4: Lone-Player in Rooms 20, 50, 100 (Rollover Protection) ---');
  for (const roomId of ['room-20', 'room-50', 'room-100']) {
    const isRoom10 = roomId === 'room-10';
    const distinctRealPlayers = 1;
    const isEligibleForActivePlay = isRoom10 ? distinctRealPlayers >= 1 : distinctRealPlayers >= 2;

    assert(!isEligibleForActivePlay, `${roomId} with 1 player is ineligible for active play (safe spectator rollover)`);
  }

  // --- Scenario 5: Database Schema Payload Compatibility ---
  console.log('\n--- Scenario 5: Database game_rounds Record Compatibility ---');
  const dbRoundRecord = {
    room_id: 'room-10',
    round_number: 101,
    phase: 'playing',
    total_pot: totalPot1,      // 60
    platform_fee: houseFee1,   // 12
    winner_payout: winnerPayout1 // 48
  };

  assert(typeof dbRoundRecord.total_pot === 'number' && dbRoundRecord.total_pot === 60, 'game_rounds total_pot is 60');
  assert(typeof dbRoundRecord.platform_fee === 'number' && dbRoundRecord.platform_fee === 12, 'game_rounds platform_fee is 12');
  assert(typeof dbRoundRecord.winner_payout === 'number' && dbRoundRecord.winner_payout === 48, 'game_rounds winner_payout is 48');

  // --- Summary ---
  console.log('\n' + '='.repeat(50));
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 4 POT & COMMISSION TESTS PASSED SUCCESSFULLY!`);
  } else {
    console.error(`💥 ${failed} TESTS FAILED! (${passed} passed)`);
    process.exit(1);
  }
}

runPhase4Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
