import assert from 'node:assert';
import {
  sampleStandbyBots,
  generateDynamicBotTarget,
  MIN_STANDBY_BOT_COUNT,
  MAX_STANDBY_BOT_COUNT,
  DEFAULT_STANDBY_BOT_COUNT,
  STANDBY_BOT_COUNT,
  ETHIOPIAN_200_BOT_ROSTER
} from '../game/ethiopianBotRoster.ts';
import { gameEngine } from '../game/BingoGameEngine.ts';

async function runPhase1Tests() {
  console.log('=================================================================');
  console.log('🧪 RUNNING PHASE 1 VERIFICATION: Dynamic Bot Roster & Distribution');
  console.log('=================================================================');

  // Test 1: Constant bounds & backwards compatibility
  console.log('\n[Test 1] Checking Constants & Exported Bounds...');
  assert.strictEqual(MIN_STANDBY_BOT_COUNT, 0, 'MIN_STANDBY_BOT_COUNT must be 0');
  assert.strictEqual(MAX_STANDBY_BOT_COUNT, 50, 'MAX_STANDBY_BOT_COUNT must be 50');
  assert.strictEqual(DEFAULT_STANDBY_BOT_COUNT, 20, 'DEFAULT_STANDBY_BOT_COUNT must be 20');
  assert.strictEqual(STANDBY_BOT_COUNT, 50, 'STANDBY_BOT_COUNT must remain 50 for backwards compatibility');
  assert.strictEqual(ETHIOPIAN_200_BOT_ROSTER.length, 200, 'Master roster must contain 200 bot profiles');
  console.log('  ✅ Bounds and compatibility aliases verified.');

  // Test 2: Zero bots sampling (Disabled mode)
  console.log('\n[Test 2] Sampling count <= 0 (Disabled Mode)...');
  const zeroBots = sampleStandbyBots(0);
  assert.strictEqual(zeroBots.length, 0, 'sampleStandbyBots(0) must return empty array []');
  const negativeBots = sampleStandbyBots(-5);
  assert.strictEqual(negativeBots.length, 0, 'sampleStandbyBots(-5) must return empty array []');
  console.log('  ✅ Zero/negative sampling cleanly returns [] without errors.');

  // Test 3: Variable sampling across 2, 7, 15, 30, 50
  console.log('\n[Test 3] Variable count sampling across [2, 50]...');
  const testCounts = [2, 7, 15, 30, 50];
  for (const count of testCounts) {
    const sampled = sampleStandbyBots(count);
    assert.strictEqual(sampled.length, count, `Expected ${count} bots, got ${sampled.length}`);
    
    // Assert all IDs and names are unique
    const uniqueIds = new Set(sampled.map(b => b.id));
    const uniquePhones = new Set(sampled.map(b => b.phone));
    assert.strictEqual(uniqueIds.size, count, `Bot IDs must be unique in sample of ${count}`);
    assert.strictEqual(uniquePhones.size, count, `Bot phones must be unique in sample of ${count}`);
    assert.ok(sampled.every(b => b.id.startsWith('bot_standby_')), 'All bots must have valid standby prefix');
    console.log(`  ✅ sampleStandbyBots(${count}) returned ${sampled.length} unique profiles.`);
  }

  // Test 4: Organic Distribution Curve Generator (1,000 iterations)
  console.log('\n[Test 4] Testing generateDynamicBotTarget() over 1,000 rounds...');
  let quietCount = 0;  // 2 to 9
  let normalCount = 0; // 10 to 30
  let peakCount = 0;   // 31 to 50

  for (let i = 0; i < 1000; i++) {
    const target = generateDynamicBotTarget(2, 50);
    assert.ok(target >= 2 && target <= 50, `Target ${target} out of bounds [2, 50]`);
    if (target <= 9) quietCount++;
    else if (target <= 30) normalCount++;
    else peakCount++;
  }

  console.log(`  Distribution across 1,000 runs:`);
  console.log(`    - Quiet (2-9 bots):   ${quietCount} / 1000 (${(quietCount / 10).toFixed(1)}% | Expected ~15%)`);
  console.log(`    - Normal (10-30 bots): ${normalCount} / 1000 (${(normalCount / 10).toFixed(1)}% | Expected ~60%)`);
  console.log(`    - Peak (31-50 bots):   ${peakCount} / 1000 (${(peakCount / 10).toFixed(1)}% | Expected ~25%)`);
  assert.ok(quietCount > 50 && quietCount < 250, 'Quiet count within statistical tolerance');
  assert.ok(normalCount > 450 && normalCount < 750, 'Normal count within statistical tolerance');
  assert.ok(peakCount > 150 && peakCount < 350, 'Peak count within statistical tolerance');
  console.log('  ✅ Organic distribution curve generates realistic traffic spreads.');

  // Test 5: Custom Admin bounds support
  console.log('\n[Test 5] Testing custom Admin bounds (min=10, max=25)...');
  for (let i = 0; i < 200; i++) {
    const customTarget = generateDynamicBotTarget(10, 25);
    assert.ok(customTarget >= 10 && customTarget <= 25, `Custom target ${customTarget} out of bounds [10, 25]`);
  }
  console.log('  ✅ Custom Admin bounds strictly respected.');

  // Test 6: STRICT MULTI-ROOM ISOLATION AUDIT
  console.log('\n[Test 6] Multi-Room Isolation Audit for Rooms 20, 50, 100...');
  const room20 = gameEngine.getRoom('room-20');
  const room50 = gameEngine.getRoom('room-50');
  const room100 = gameEngine.getRoom('room-100');

  assert.ok(room20, 'room-20 must exist');
  assert.ok(room50, 'room-50 must exist');
  assert.ok(room100, 'room-100 must exist');

  assert.strictEqual(room20.opponentCards.length, 0, 'room-20 MUST have strictly 0 bots');
  assert.strictEqual(room50.opponentCards.length, 0, 'room-50 MUST have strictly 0 bots');
  assert.strictEqual(room100.opponentCards.length, 0, 'room-100 MUST have strictly 0 bots');
  console.log('  ✅ Rooms 20, 50, and 100 maintain strictly 0 bots (100% human P2P isolated).');

  console.log('\n=================================================================');
  console.log('🎉 PHASE 1 VERIFICATION 100% PASSED: ZERO ERRORS & CLEAN ISOLATION');
  console.log('=================================================================\n');
  process.exit(0);
}

runPhase1Tests().catch(err => {
  console.error('❌ Phase 1 test failed:', err);
  process.exit(1);
});
