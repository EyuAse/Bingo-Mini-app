import {
  ETHIOPIAN_200_BOT_ROSTER,
  sampleStandbyBots,
  isStandbyBotId,
  getStandbyBotById
} from '../game/ethiopianBotRoster.ts';

console.log('=== Ethiopian Bot Roster Unit Test ===');

// 1. Length check
if (ETHIOPIAN_200_BOT_ROSTER.length !== 200) {
  throw new Error(`Roster length expected 200, got: ${ETHIOPIAN_200_BOT_ROSTER.length}`);
}
console.log('✅ Exactly 200 bot profiles present');

// 2. Uniqueness check
const ids = new Set<string>();
const names = new Set<string>();
const phones = new Set<string>();

for (const bot of ETHIOPIAN_200_BOT_ROSTER) {
  if (!bot.id || !isStandbyBotId(bot.id)) {
    throw new Error(`Invalid bot id: ${bot.id}`);
  }
  if (!bot.name || !bot.name.includes(' ')) {
    throw new Error(`Invalid bot name format: ${bot.name}`);
  }
  if (!bot.phone || (!bot.phone.startsWith('09') && !bot.phone.startsWith('07'))) {
    throw new Error(`Invalid Ethiopian phone format: ${bot.phone}`);
  }
  ids.add(bot.id);
  names.add(bot.name);
  phones.add(bot.phone);
}

if (ids.size !== 200) throw new Error('Duplicate IDs found!');
if (names.size !== 200) throw new Error('Duplicate names found!');
if (phones.size !== 200) throw new Error('Duplicate phones found!');
console.log('✅ 100% uniqueness verified across all 200 IDs, Names, and Phones');

// 3. Sampling test
const sample1 = sampleStandbyBots(5);
if (sample1.length !== 5) throw new Error(`Expected 5 sampled bots, got ${sample1.length}`);
const sample1Ids = new Set(sample1.map(b => b.id));
if (sample1Ids.size !== 5) throw new Error('Duplicate bots in single sample!');

const sample2 = sampleStandbyBots(5);
console.log('Sample 1 (5 bots):', sample1.map(b => b.name).join(', '));
console.log('Sample 2 (5 bots):', sample2.map(b => b.name).join(', '));
console.log('✅ Fisher-Yates sampling produces distinct, non-repeating bot sets');

// 4. Exclusion test
const excludedId = sample1[0].id;
const sampleWithExclude = sampleStandbyBots(5, new Set([excludedId]));
if (sampleWithExclude.some(b => b.id === excludedId)) {
  throw new Error('Excluded bot was present in sample!');
}
console.log('✅ Exclude filter strictly honored');

// 5. Lookup tests
const testLookup = getStandbyBotById('bot_standby_042');
if (!testLookup || testLookup.name !== 'Teshome Wondimu') {
  throw new Error(`Lookup failed for bot_standby_042: ${JSON.stringify(testLookup)}`);
}
console.log('✅ Fast ID lookup verified:', testLookup.name);

console.log('🎉 ALL UNIT TESTS PASSED FOR PHASE 1!');
process.exit(0);
