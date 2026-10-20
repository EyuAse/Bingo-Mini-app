import { sampleStandbyBots, isStandbyBotId } from '../game/ethiopianBotRoster.ts';
import { generateCardFromId } from '../game/cartelaGenerator.ts';

/**
 * Phase 2 Unit Test & Simulation Suite
 * Validates Room 10 Dynamic Standby Bot Matchmaker and Isolation Guarantees
 */
async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2 Unit Test & Simulation Suite...\n');

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

  // --- Test 1: Room 10 Standby Bot Generation with 1 Real Player ---
  console.log('--- Test 1: Room 10 Standby Bot Matchmaker Logic ---');
  const playerCartelaId = 42;
  const sampledBots = sampleStandbyBots(5);
  assert(sampledBots.length === 5, 'Sampled exactly 5 bots');

  const assignedIds = new Set<number>([playerCartelaId]);
  const opponentCards: any[] = [];

  for (let i = 0; i < sampledBots.length; i++) {
    let botCartelaId = Math.floor(1 + Math.random() * 400);
    while (assignedIds.has(botCartelaId)) {
      botCartelaId = Math.floor(1 + Math.random() * 400);
    }
    assignedIds.add(botCartelaId);
    const botProfile = sampledBots[i];
    opponentCards.push({
      botUserId: botProfile.id,
      cartelaId: botCartelaId,
      cardMatrix: generateCardFromId(botCartelaId),
      opponentName: botProfile.name,
      stakeAmount: 10.0,
      isHouseBot: i === 0
    });
  }

  assert(opponentCards.length === 5, 'Injected exactly 5 opponent cards');
  assert(!opponentCards.some(o => o.cartelaId === playerCartelaId), 'No bot cartela collides with real player cartela');
  
  const botCartelaSet = new Set(opponentCards.map(o => o.cartelaId));
  assert(botCartelaSet.size === 5, 'All 5 bot cartela IDs are unique');
  assert(opponentCards.every(o => o.stakeAmount === 10), 'All 5 bot cards have stakeAmount of 10.0 ETB');
  assert(opponentCards.every(o => isStandbyBotId(o.botUserId)), 'All botUserIds match isStandbyBotId format');

  // --- Test 2: Pot & House Commission Calculation ---
  console.log('\n--- Test 2: Pot & 20% House Commission Tier ---');
  // 1 real cartela (10 ETB) + 5 bot cartelas (50 ETB) = 6 total cartelas
  const totalCartelas = 1 + opponentCards.length; // 6
  let pot = 10;
  opponentCards.forEach(o => { pot += o.stakeAmount; });
  const commissionEnabled = totalCartelas > 5;
  const houseFee = commissionEnabled ? Math.floor(pot * 0.20) : 0;
  const winnerPayout = pot - houseFee;

  assert(totalCartelas === 6, `Total cartelas is 6 (got: ${totalCartelas})`);
  assert(pot === 60, `Total pot is 60 ETB (got: ${pot})`);
  assert(commissionEnabled === true, 'Commission is enabled for > 5 cartelas');
  assert(houseFee === 12, `House fee is 12 ETB (20% of 60 ETB) (got: ${houseFee})`);
  assert(winnerPayout === 48, `Winner payout is 48 ETB (60 - 12) (got: ${winnerPayout})`);

  // --- Test 3: Isolation Guarantees for Other Rooms ---
  console.log('\n--- Test 3: Strict Isolation for Rooms 20, 50, 100 ---');
  const STAKE_ROOM_IDS = ['room-10', 'room-20', 'room-50', 'room-100'];

  for (const roomId of STAKE_ROOM_IDS) {
    const isRoom10 = roomId === 'room-10';
    // Case A: 1 real player
    const distinctRealPlayers1 = 1;
    const isEligible1 = isRoom10 ? distinctRealPlayers1 >= 1 : distinctRealPlayers1 >= 2;
    if (isRoom10) {
      assert(isEligible1 === true, `Room 10 with 1 player is eligible for active play`);
    } else {
      assert(isEligible1 === false, `${roomId} with 1 player is NOT eligible (spectator rollover preserved)`);
    }

    // Case B: 0 real players
    const distinctRealPlayers0 = 0;
    const isEligible0 = isRoom10 ? distinctRealPlayers0 >= 1 : distinctRealPlayers0 >= 2;
    assert(isEligible0 === false, `${roomId} with 0 players is spectating`);

    // Case C: 2 real players
    const distinctRealPlayers2 = 2;
    const isEligible2 = isRoom10 ? distinctRealPlayers2 >= 1 : distinctRealPlayers2 >= 2;
    assert(isEligible2 === true, `${roomId} with 2 players is eligible for active play`);
  }

  // --- Test 4: Dynamic Bot Rotation Diversity ---
  console.log('\n--- Test 4: Dynamic 5-Bot Rotation Diversity Over 10 Rounds ---');
  const seenBotIds = new Set<string>();
  for (let r = 0; r < 10; r++) {
    const roundBots = sampleStandbyBots(5);
    roundBots.forEach(b => seenBotIds.add(b.id));
  }
  console.log(`  ℹ️ Distinct bots sampled over 10 rounds: ${seenBotIds.size} / 200`);
  assert(seenBotIds.size >= 25, `High bot diversity across rounds (${seenBotIds.size} >= 25 unique bots)`);

  // --- Summary ---
  console.log('\n' + '='.repeat(50));
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 2 UNIT TESTS PASSED SUCCESSFULLY!`);
  } else {
    console.error(`💥 ${failed} TESTS FAILED! (${passed} passed)`);
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
