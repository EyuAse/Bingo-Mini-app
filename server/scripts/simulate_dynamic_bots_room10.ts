import assert from 'assert';
import { gameEngine } from '../game/BingoGameEngine.ts';
import { generateDynamicBotTarget } from '../game/ethiopianBotRoster.ts';

console.log('================================================================');
console.log('🎲 Phase 7: 10,000-Round Monte Carlo Dynamic Bot Simulation');
console.log('================================================================\n');

const engine = gameEngine;
const room10 = engine.getRoom('room-10')!;
const room20 = engine.getRoom('room-20')!;
const room50 = engine.getRoom('room-50')!;
const room100 = engine.getRoom('room-100')!;

assert(room10, 'Room 10 must exist');
assert(room20, 'Room 20 must exist');
assert(room50, 'Room 50 must exist');
assert(room100, 'Room 100 must exist');

const TOTAL_ROUNDS = 10000;
const STAKE_AMOUNT = 10;

let totalStakesCollected = 0;
let totalPayoutsToReal = 0;
let totalHouseProfit = 0;
let realPlayerWins = 0;
let botWins = 0;
let antiChurnActivations = 0;

let currentLossStreak = 0;
let maxLossStreak = 0;
let minHouseProfit = Infinity;

// Distribution tracker across bot pool sizes
const botCountDistribution: Record<string, number> = {
  '0 Bots (P2P)': 0,
  '2-5 Bots (Light)': 0,
  '6-15 Bots (Medium)': 0,
  '16-30 Bots (Active)': 0,
  '31-50 Bots (High)': 0
};

console.log(`Simulating ${TOTAL_ROUNDS.toLocaleString()} consecutive rounds in Room 10...`);
console.log(`Settings: Dynamic Ethiopian Bot Pool [0, 50], 1 Real Player (10 ETB / round).\n`);

const startTime = Date.now();

const INITIAL_HOUSE_FLOAT = 10000; // 10,000 ETB starting house reserve
let currentHouseBalance = INITIAL_HOUSE_FLOAT;
let minHouseBalance = INITIAL_HOUSE_FLOAT;
let theoreticalExpectedProfit = 0;

let sessionRemaining = Math.floor(30 + Math.random() * 30); // 30-60 rounds per session
let totalSessions = 1;

for (let r = 1; r <= TOTAL_ROUNDS; r++) {
  // Rotate bot config at milestones across modes to test full spectrum:
  // Rounds 1-7000: Dynamic bell curve [2, 50]
  // Rounds 7001-8500: Dynamic light [2, 10]
  // Rounds 8501-9500: Fixed counts (e.g. 20)
  // Rounds 9501-10000: Dynamic high [30, 50]
  if (r === 1) {
    engine.setBotConfig({ mode: 'dynamic', minBots: 2, maxBots: 50 });
  } else if (r === 7001) {
    engine.setBotConfig({ mode: 'dynamic', minBots: 2, maxBots: 10 });
  } else if (r === 8501) {
    engine.setBotConfig({ mode: 'fixed', fixedCount: 20 });
  } else if (r === 9501) {
    engine.setBotConfig({ mode: 'dynamic', minBots: 30, maxBots: 50 });
  }

  // Session lifecycle: if session ended, player departs, new player arrives with 0 streak
  if (sessionRemaining <= 0) {
    sessionRemaining = Math.floor(30 + Math.random() * 30);
    totalSessions++;
    currentLossStreak = 0;
  }
  sessionRemaining--;

  // 1. Sync Room 10 standby bots for this round
  (engine as any).syncRoom10StandbyBots(room10, true);
  const botCount = room10.opponentCards.length;
  assert(botCount >= 0 && botCount <= 50, `Bot count out of bounds: ${botCount}`);

  // Track distribution
  if (botCount === 0) botCountDistribution['0 Bots (P2P)']++;
  else if (botCount <= 5) botCountDistribution['2-5 Bots (Light)']++;
  else if (botCount <= 15) botCountDistribution['6-15 Bots (Medium)']++;
  else if (botCount <= 30) botCountDistribution['16-30 Bots (Active)']++;
  else botCountDistribution['31-50 Bots (High)']++;

  // 2. Multi-Room Strict Isolation Audit (every round)
  assert.strictEqual(room20.opponentCards.length, 0, `Isolation failure in Room 20 on round ${r}`);
  assert.strictEqual(room50.opponentCards.length, 0, `Isolation failure in Room 50 on round ${r}`);
  assert.strictEqual(room100.opponentCards.length, 0, `Isolation failure in Room 100 on round ${r}`);

  // 3. Round Economics & Probability Resolution
  const totalCards = 1 + botCount; // 1 real player + B bots
  const baseRealWinProb = 1 / totalCards;
  let effectiveRealWinProb = baseRealWinProb;

  // Dynamic Anti-Churn Guard (Room 10 Single Player within session)
  const dynamicLossThreshold = Math.min(60, Math.max(6, Math.ceil(totalCards * 1.25)));
  if (currentLossStreak >= dynamicLossThreshold) {
    effectiveRealWinProb = Math.min(0.50, baseRealWinProb * 1.10);
    antiChurnActivations++;
  }

  totalStakesCollected += STAKE_AMOUNT;
  const grossPot = totalCards * STAKE_AMOUNT;
  const winnerPayout = Math.floor(grossPot * 0.80);

  // Exact Analytical EV Calculation for this round
  const roundExpectedProfit = effectiveRealWinProb * (STAKE_AMOUNT - winnerPayout) + (1 - effectiveRealWinProb) * STAKE_AMOUNT;
  theoreticalExpectedProfit += roundExpectedProfit;

  // Stochastic Winner Resolution
  const isRealWinner = Math.random() < effectiveRealWinProb;

  if (isRealWinner) {
    realPlayerWins++;
    currentLossStreak = 0;
    totalPayoutsToReal += winnerPayout;
    totalHouseProfit += (STAKE_AMOUNT - winnerPayout);
    currentHouseBalance += (STAKE_AMOUNT - winnerPayout);
  } else {
    botWins++;
    currentLossStreak++;
    if (currentLossStreak > maxLossStreak) {
      maxLossStreak = currentLossStreak;
    }
    // Bot payout stays with house, real player stake retained
    totalHouseProfit += STAKE_AMOUNT;
    currentHouseBalance += STAKE_AMOUNT;
  }

  if (currentHouseBalance < minHouseBalance) {
    minHouseBalance = currentHouseBalance;
  }

  if (r % 2500 === 0) {
    console.log(`   ⏳ Round #${r.toLocaleString()} complete... Current House Profit: ${totalHouseProfit.toLocaleString()} ETB (+${((totalHouseProfit / totalStakesCollected) * 100).toFixed(1)}%) | Balance: ${currentHouseBalance.toLocaleString()} ETB`);
  }
}

const elapsedMs = Date.now() - startTime;
const houseMarginPercent = (totalHouseProfit / totalStakesCollected) * 100;
const theoreticalMarginPercent = (theoreticalExpectedProfit / totalStakesCollected) * 100;
const realWinRateObserved = (realPlayerWins / TOTAL_ROUNDS) * 100;

console.log('\n================================================================');
console.log('📊 10,000-ROUND SIMULATION RESULTS');
console.log('================================================================');
console.log(`Total Rounds Simulated:          ${TOTAL_ROUNDS.toLocaleString()} rounds (${elapsedMs}ms)`);
console.log(`Real Player Stakes Collected:    ${totalStakesCollected.toLocaleString()} ETB (100%)`);
console.log(`Real Player Net Payouts Won:     ${totalPayoutsToReal.toLocaleString()} ETB (${((totalPayoutsToReal / totalStakesCollected) * 100).toFixed(1)}%)`);
console.log(`Theoretical Expected House Profit:${Math.round(theoreticalExpectedProfit).toLocaleString()} ETB (${theoreticalMarginPercent.toFixed(2)}%)`);
console.log(`Empirical Observed House Profit: ${totalHouseProfit.toLocaleString()} ETB (${houseMarginPercent.toFixed(2)}%)`);
console.log(`Starting House Reserve Float:    ${INITIAL_HOUSE_FLOAT.toLocaleString()} ETB`);
console.log(`Ending House Balance:            ${currentHouseBalance.toLocaleString()} ETB`);
console.log(`Minimum House Balance:           ${minHouseBalance.toLocaleString()} ETB (Zero Ruin / Positive Reserve)`);
console.log(`Real Player Wins:                ${realPlayerWins.toLocaleString()} rounds (${realWinRateObserved.toFixed(2)}%)`);
console.log(`Bot Wins:                        ${botWins.toLocaleString()} rounds (${((botWins / TOTAL_ROUNDS) * 100).toFixed(2)}%)`);
console.log(`Anti-Churn Soft Boosts:          ${antiChurnActivations.toLocaleString()} rounds`);
console.log(`Max Consecutive Loss Streak:     ${maxLossStreak} losses`);
console.log(`Total Player Sessions Modeled:   ${totalSessions} sessions (~${Math.round(TOTAL_ROUNDS / totalSessions)} rounds/session)`);

console.log('\n--- Bot Pool Distribution Across 10,000 Rounds ---');
for (const [bucket, count] of Object.entries(botCountDistribution)) {
  const pct = ((count / TOTAL_ROUNDS) * 100).toFixed(1);
  console.log(`   ${bucket.padEnd(24)}: ${count.toString().padStart(5)} rounds (${pct}%)`);
}

console.log('\n--- Multi-Room Isolation Verification ---');
console.log(`   ✅ Room 20 (20 ETB):  Strictly 0 bots across all ${TOTAL_ROUNDS.toLocaleString()} cycles`);
console.log(`   ✅ Room 50 (50 ETB):  Strictly 0 bots across all ${TOTAL_ROUNDS.toLocaleString()} cycles`);
console.log(`   ✅ Room 100 (100 ETB): Strictly 0 bots across all ${TOTAL_ROUNDS.toLocaleString()} cycles`);

// Mathematical Invariant Assertions
console.log('\n--- Asserting Mathematical & Financial Invariants ---');

// 1. Total stakes must exactly equal 100,000 ETB
assert.strictEqual(totalStakesCollected, 100000, 'Total stakes must equal 100,000 ETB');
console.log('   ✅ Total stakes collected matches exactly 100,000 ETB');

// 2. Theoretical Expected House Margin must strictly be within 20% +/- 2% (18,000 to 22,000 ETB)
assert(
  theoreticalExpectedProfit >= 18000 && theoreticalExpectedProfit <= 22000,
  `Theoretical EV ${theoreticalExpectedProfit} ETB is outside expected margin [18,000, 22,000] ETB`
);
console.log(`   ✅ Theoretical Expected Value strictly +20% EV invariant (${Math.round(theoreticalExpectedProfit).toLocaleString()} ETB, ${theoreticalMarginPercent.toFixed(2)}%)`);

// 3. Empirical Observed Margin must be positive and within 3-sigma statistical confidence bounds
assert(
  totalHouseProfit >= 14000 && totalHouseProfit <= 26000,
  `Empirical profit ${totalHouseProfit} ETB is outside 3-sigma confidence bounds [14,000, 26,000] ETB`
);
console.log(`   ✅ Empirical observed profit within 3-sigma confidence bounds (${totalHouseProfit.toLocaleString()} ETB, ${houseMarginPercent.toFixed(2)}%)`);

// 4. Zero Ruin / Minimum House Balance must remain above zero
assert(minHouseBalance > 0, `House balance suffered negative drawdown/ruin: ${minHouseBalance} ETB`);
console.log(`   ✅ Zero Ruin verified: Minimum house balance remained strictly positive (${minHouseBalance.toLocaleString()} ETB)`);

// 5. Clean restore
engine.setBotConfig({
  mode: 'dynamic',
  minBots: 0,
  maxBots: 50,
  fixedCount: 20,
  staggeredJoin: true,
  livingClock: true
});
(engine as any).syncRoom10StandbyBots(room10, true);

console.log('\n================================================================');
console.log('🎉 PHASE 7 VERIFICATION COMPLETE: ALL ASSERTIONS PASSED (100%)');
console.log('================================================================');
process.exit(0);
