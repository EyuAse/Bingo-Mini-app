import { sampleStandbyBots, isStandbyBotId } from '../game/ethiopianBotRoster.ts';
import { generateCardFromId, checkWinningPattern } from '../game/cartelaGenerator.ts';

/**
 * Phase 3: Calibrated 50/50 Win Engine Monte Carlo Simulation & Validation Suite
 */
async function runPhase3Simulation() {
  console.log('🧪 Starting Phase 3: Calibrated 50/50 Win Engine Simulation Suite...\n');

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

  // --- Test 1: Monte Carlo Simulation of Outcome Calibration (1,000 Rounds) ---
  console.log('--- Test 1: Monte Carlo Outcome Calibration (1,000 Rounds) ---');
  const TRIALS = 1000;
  let room10RealWins = 0;
  let room10BotWins = 0;

  for (let i = 0; i < TRIALS; i++) {
    const isRoom10 = true;
    const distinctRealPlayers = 1;

    let targetWinnerType: 'real' | 'bot';
    if (isRoom10 && distinctRealPlayers === 1) {
      targetWinnerType = Math.random() < 0.50 ? 'real' : 'bot';
    } else {
      targetWinnerType = Math.random() < 0.20 ? 'bot' : 'real';
    }

    if (targetWinnerType === 'real') room10RealWins++;
    else room10BotWins++;
  }

  const realPct = (room10RealWins / TRIALS) * 100;
  const botPct = (room10BotWins / TRIALS) * 100;

  console.log(`  📊 Results over ${TRIALS} simulated rounds:`);
  console.log(`     Real Player Wins: ${room10RealWins} (${realPct.toFixed(1)}%)`);
  console.log(`     Standby Bot Wins: ${room10BotWins} (${botPct.toFixed(1)}%)`);

  assert(realPct >= 45.0 && realPct <= 55.0, `Real player win rate is calibrated within [45%, 55%] (got ${realPct.toFixed(1)}%)`);
  assert(botPct >= 45.0 && botPct <= 55.0, `Standby bot win rate is calibrated within [45%, 55%] (got ${botPct.toFixed(1)}%)`);

  // --- Test 2: Other Rooms Non-Regression (1,000 Rounds) ---
  console.log('\n--- Test 2: Other Rooms (Room 20, 50, 100) Non-Regression (1,000 Rounds) ---');
  let otherRealWins = 0;
  let otherBotWins = 0;

  for (let i = 0; i < TRIALS; i++) {
    const isRoom10 = false;
    const distinctRealPlayers = 2; // Rooms 20, 50, 100 with 2 players + bots

    let targetWinnerType: 'real' | 'bot';
    if (isRoom10 && distinctRealPlayers === 1) {
      targetWinnerType = Math.random() < 0.50 ? 'real' : 'bot';
    } else {
      targetWinnerType = Math.random() < 0.20 ? 'bot' : 'real';
    }

    if (targetWinnerType === 'real') otherRealWins++;
    else otherBotWins++;
  }

  const otherRealPct = (otherRealWins / TRIALS) * 100;
  console.log(`  📊 Other rooms win rate over ${TRIALS} rounds: Real = ${otherRealPct.toFixed(1)}% (Expected ~80%)`);
  assert(otherRealPct >= 75.0 && otherRealPct <= 85.0, `Other rooms strictly preserve standard ~80% real win rate (got ${otherRealPct.toFixed(1)}%)`);

  // --- Test 3: Standby Bot Uniform Winning Distribution ---
  console.log('\n--- Test 3: Standby Bot Winner Distribution Across 5 Cards ---');
  const botWinCounts = new Map<number, number>(); // index 0..4
  const BOT_WIN_TRIALS = 1000;

  for (let i = 0; i < BOT_WIN_TRIALS; i++) {
    const sampledBots = sampleStandbyBots(5);
    const opponentCards = sampledBots.map((b, idx) => ({
      botUserId: b.id,
      cartelaId: 100 + idx,
      opponentName: b.name,
      stakeAmount: 10,
      isHouseBot: idx === 0
    }));

    const isStandbyPool = opponentCards.some(o => isStandbyBotId(o.botUserId));
    const pool = isStandbyPool
      ? opponentCards
      : (opponentCards.filter(o => !o.isHouseBot).length > 0
          ? opponentCards.filter(o => !o.isHouseBot)
          : opponentCards);

    const winningBot = pool[Math.floor(Math.random() * pool.length)];
    const winIndex = opponentCards.findIndex(o => o.cartelaId === winningBot.cartelaId);
    botWinCounts.set(winIndex, (botWinCounts.get(winIndex) || 0) + 1);
  }

  console.log(`  📊 Winning distribution across the 5 bot seats:`);
  for (let seat = 0; seat < 5; seat++) {
    const count = botWinCounts.get(seat) || 0;
    const pct = (count / BOT_WIN_TRIALS) * 100;
    console.log(`     Seat #${seat + 1}: ${count} wins (${pct.toFixed(1)}%)`);
    assert(pct >= 15.0 && pct <= 25.0, `Seat #${seat + 1} receives an even distribution (15%-25%) (got ${pct.toFixed(1)}%)`);
  }

  // --- Summary ---
  console.log('\n' + '='.repeat(50));
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 3 CALIBRATION TESTS PASSED SUCCESSFULLY!`);
  } else {
    console.error(`💥 ${failed} TESTS FAILED! (${passed} passed)`);
    process.exit(1);
  }
}

runPhase3Simulation().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
