import assert from 'assert';
import {
  ETHIOPIAN_200_BOT_ROSTER,
  STANDBY_BOT_COUNT,
  sampleStandbyBots,
  isStandbyBotId,
  getStandbyBotById
} from '../game/ethiopianBotRoster.ts';

console.log('================================================================');
console.log('🧪 Starting Phase 1 Verification Test: 50-Bot Sampling & Roster');
console.log('================================================================\n');

// 1. Verify Constant and Roster Size
console.log('1. Checking STANDBY_BOT_COUNT and Master Roster Size...');
assert.strictEqual(STANDBY_BOT_COUNT, 50, `STANDBY_BOT_COUNT must be 50, got: ${STANDBY_BOT_COUNT}`);
assert.strictEqual(ETHIOPIAN_200_BOT_ROSTER.length, 200, `Roster must contain 200 bots, got: ${ETHIOPIAN_200_BOT_ROSTER.length}`);
console.log(`   ✅ STANDBY_BOT_COUNT = ${STANDBY_BOT_COUNT}`);
console.log(`   ✅ ETHIOPIAN_200_BOT_ROSTER.length = ${ETHIOPIAN_200_BOT_ROSTER.length}\n`);

// 2. Verify Default Sampling (Must sample exactly 50 bots)
console.log('2. Testing sampleStandbyBots() default count...');
const sample50 = sampleStandbyBots();
assert.strictEqual(sample50.length, 50, `Default sample must be 50 bots, got: ${sample50.length}`);
console.log(`   ✅ Successfully sampled ${sample50.length} bots by default\n`);

// 3. Verify Uniqueness & Valid Ethiopian Identity Integrity
console.log('3. Validating 50 Bot Personas for Uniqueness & Completeness...');
const ids = new Set<string>();
const names = new Set<string>();
const phones = new Set<string>();

for (const bot of sample50) {
  assert(bot.id && bot.id.startsWith('bot_standby_'), `Invalid bot id: ${bot.id}`);
  assert(bot.name && bot.name.length > 3, `Invalid bot name: ${bot.name}`);
  assert(bot.phone && (bot.phone.startsWith('09') || bot.phone.startsWith('07')), `Invalid Ethiopian phone: ${bot.phone}`);
  assert(isStandbyBotId(bot.id), `isStandbyBotId returned false for: ${bot.id}`);

  // Test fast lookup
  const lookedUp = getStandbyBotById(bot.id);
  assert.strictEqual(lookedUp?.id, bot.id, `Lookup failed for: ${bot.id}`);

  ids.add(bot.id);
  names.add(bot.name);
  phones.add(bot.phone);
}

assert.strictEqual(ids.size, 50, `Expected 50 unique IDs, got: ${ids.size}`);
assert.strictEqual(names.size, 50, `Expected 50 unique names, got: ${names.size}`);
assert.strictEqual(phones.size, 50, `Expected 50 unique phone numbers, got: ${phones.size}`);
console.log('   ✅ All 50 sampled bots have 100% unique IDs, names, and phone numbers\n');

// 4. Verify Randomization across multiple draws
console.log('4. Verifying True Randomization / Fisher-Yates Rotation...');
const draw1 = sampleStandbyBots(50).map(b => b.id);
const draw2 = sampleStandbyBots(50).map(b => b.id);
const draw3 = sampleStandbyBots(50).map(b => b.id);

const isIdentical12 = draw1.every((id, idx) => id === draw2[idx]);
const isIdentical23 = draw2.every((id, idx) => id === draw3[idx]);

assert.strictEqual(isIdentical12, false, 'Draw 1 and Draw 2 must not be identical');
assert.strictEqual(isIdentical23, false, 'Draw 2 and Draw 3 must not be identical');
console.log('   ✅ True dynamic shuffling verified across consecutive draws\n');

// 5. Verify Exclude IDs functionality
console.log('5. Testing excludeIds functionality...');
const excludedBots = new Set(sample50.slice(0, 10).map(b => b.id));
const sampleWithExclude = sampleStandbyBots(50, excludedBots);

assert.strictEqual(sampleWithExclude.length, 50, `Expected 50 bots with exclude, got ${sampleWithExclude.length}`);
for (const bot of sampleWithExclude) {
  assert(!excludedBots.has(bot.id), `Excluded bot ${bot.id} was sampled!`);
}
console.log('   ✅ Successfully excluded 10 bot IDs while still returning 50 distinct bots\n');

console.log('================================================================');
console.log('🎉 PHASE 1 VERIFICATION COMPLETE: ALL ASSERTIONS PASSED (100%)');
console.log('================================================================');
process.exit(0);
