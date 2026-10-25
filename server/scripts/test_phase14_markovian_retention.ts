import assert from 'assert';
import { generateNextRoundBotTarget, generateDynamicBotTarget } from '../game/ethiopianBotRoster.ts';

console.log('================================================================');
console.log('🔬 PHASE 14: MARKOVIAN INTER-ROUND PLAYER RETENTION & DRIFT TEST');
console.log('================================================================\n');

// 1. Initial Target Generation (Server Startup / Empty Room)
console.log('[Test 1] Testing Initial Target Generation (undefined previousTarget)...');
for (let i = 0; i < 20; i++) {
  const initial = generateNextRoundBotTarget(undefined, 2, 50);
  assert(initial >= 2 && initial <= 50, `Initial target ${initial} out of bounds [2, 50]`);
}
console.log('  ✅ Initial round targets generate naturally within bounds [2, 50]\n');

// 2. Strict Delta Boundedness (|B_t - B_{t-1}| <= 6) across 500 Consecutive Rounds
console.log('[Test 2] Simulating 500 Consecutive Rounds for Zero-Whiplash Guarantee...');
let currentBots = 20;
let maxDeltaSeen = 0;
const history: number[] = [currentBots];

for (let round = 1; round <= 500; round++) {
  const nextBots = generateNextRoundBotTarget(currentBots, 2, 50);
  const delta = Math.abs(nextBots - currentBots);
  
  if (delta > maxDeltaSeen) {
    maxDeltaSeen = delta;
  }

  assert(delta <= 6, `Whiplash detected at round ${round}: ${currentBots} -> ${nextBots} (delta = ${delta} > 6)`);
  assert(nextBots >= 2 && nextBots <= 50, `Next target ${nextBots} out of bounds [2, 50]`);

  currentBots = nextBots;
  history.push(currentBots);
}

console.log(`  • 500 consecutive rounds simulated.`);
console.log(`  • Maximum step delta observed across all 500 rounds: ${maxDeltaSeen} bots (Rule: <= 6 bots)`);
console.log(`  • Trajectory sample (first 15 rounds): ${history.slice(0, 15).join(' -> ')}`);
console.log('  ✅ ZERO WHIPLASH GUARANTEE PASSED: |B_t - B_{t-1}| <= 6 strictly enforced!\n');

// 3. Client Scenario: A 40-Bot Table Must NOT Drop to 10 Bots
console.log('[Test 3] Testing Client Scenario: 40-Bot Table Retention...');
const start40Rounds = 50;
let violations40to10 = 0;
const immediateNextCounts: number[] = [];

for (let trial = 0; trial < start40Rounds; trial++) {
  const next = generateNextRoundBotTarget(40, 2, 50);
  immediateNextCounts.push(next);
  if (next < 34) {
    violations40to10++;
  }
}

const minObserved = Math.min(...immediateNextCounts);
const maxObserved = Math.max(...immediateNextCounts);
console.log(`  • Starting from 40 bots across 50 trials:`);
console.log(`  • Observed immediate next round range: [${minObserved}, ${maxObserved}] bots`);
console.log(`  • Drops below 34 bots: ${violations40to10}`);

assert.strictEqual(violations40to10, 0, `Detected ${violations40to10} drops below 34 from a 40-bot table!`);
assert(minObserved >= 34, `Expected min >= 34 from a 40-bot table, got ${minObserved}`);
console.log('  ✅ 40-BOT RETENTION PASSED: A 40-bot table stays buzzing and never crashes to 10!\n');

// 4. Rush-Hour Momentum Persistence (5 Consecutive Rounds from 42 bots)
console.log('[Test 4] Testing Rush-Hour Momentum Persistence...');
let rushTarget = 42;
const rushSequence: number[] = [rushTarget];

for (let r = 1; r <= 5; r++) {
  rushTarget = generateNextRoundBotTarget(rushTarget, 2, 50);
  rushSequence.push(rushTarget);
}

console.log(`  • 5-Round Rush Hour Sequence: ${rushSequence.join(' -> ')}`);
// After 5 rounds, rush target should still remain high or healthy
assert(rushSequence.every(c => c >= 20), 'Rush hour sequence should not crash');
console.log('  ✅ Momentum persistence confirmed: Table cools down gracefully over time.\n');

// 5. Backwards Compatibility with generateDynamicBotTarget
console.log('[Test 5] Testing generateDynamicBotTarget Backwards Compatibility...');
const compat1 = generateDynamicBotTarget(2, 50, 30);
assert(Math.abs(compat1 - 30) <= 6, `generateDynamicBotTarget should respect previousTarget (delta <= 6)`);
const compat2 = generateDynamicBotTarget(5, 25);
assert(compat2 >= 5 && compat2 <= 25, 'generateDynamicBotTarget without previousTarget should respect bounds');
console.log('  ✅ Backwards compatibility verified.\n');

// 6. Admin Custom Bounds Respect
console.log('[Test 6] Testing Admin Custom Bounds [10, 25]...');
let boundedTarget = 15;
for (let i = 0; i < 50; i++) {
  boundedTarget = generateNextRoundBotTarget(boundedTarget, 10, 25);
  assert(boundedTarget >= 10 && boundedTarget <= 25, `Target ${boundedTarget} outside custom bounds [10, 25]`);
}
console.log('  ✅ Custom bounds [10, 25] strictly respected across all rounds.\n');

console.log('================================================================');
console.log('🎉 ALL PHASE 14 MARKOVIAN RETENTION TESTS PASSED (100%)');
console.log('================================================================');
process.exit(0);
