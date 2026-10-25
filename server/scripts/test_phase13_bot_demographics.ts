import assert from 'assert';
import { ETHIOPIAN_200_BOT_ROSTER, sampleStandbyBots, getStandbyBotById } from '../game/ethiopianBotRoster.ts';

console.log('================================================================');
console.log('🔬 PHASE 13: TELEGRAM-AUTHENTIC BOT IDENTITY & DEMOGRAPHICS TEST');
console.log('================================================================\n');

// 1. Total Count Verification
console.log('[Test 1] Verifying Total Bot Count...');
assert.strictEqual(ETHIOPIAN_200_BOT_ROSTER.length, 200, `Expected 200 bots, got ${ETHIOPIAN_200_BOT_ROSTER.length}`);
console.log(`  ✅ Exactly 200 bots in master roster (ETHIOPIAN_200_BOT_ROSTER.length = 200)\n`);

// 2. ID Uniqueness & Valid Formatting
console.log('[Test 2] Verifying Unique IDs & Phone Format...');
const seenIds = new Set<string>();
const seenPhones = new Set<string>();

for (let i = 0; i < ETHIOPIAN_200_BOT_ROSTER.length; i++) {
  const bot = ETHIOPIAN_200_BOT_ROSTER[i];
  const expectedId = `bot_standby_${String(i + 1).padStart(3, '0')}`;
  
  assert.strictEqual(bot.id, expectedId, `Bot at index ${i} has ID ${bot.id}, expected ${expectedId}`);
  assert(!seenIds.has(bot.id), `Duplicate bot ID detected: ${bot.id}`);
  seenIds.add(bot.id);

  assert(bot.name && bot.name.trim().length > 0, `Bot ${bot.id} has empty name`);
  assert(bot.phone && /^0(9|7)\d{8}$/.test(bot.phone), `Bot ${bot.id} has invalid Ethiopian phone: ${bot.phone}`);
  assert(!seenPhones.has(bot.phone), `Duplicate phone number detected: ${bot.phone}`);
  seenPhones.add(bot.phone);
}
console.log(`  ✅ All 200 bot IDs are sequentially ordered ('bot_standby_001' ... 'bot_standby_200') and unique`);
console.log(`  ✅ All 200 phone numbers are valid, unique Ethiopian mobile numbers (09xx, 07xx)\n`);

// 3. Gender Demographics (Strict 20% Female Rule)
console.log('[Test 3] Verifying Gender Demographics (Strict 20% Female Rule)...');
const femaleBots = ETHIOPIAN_200_BOT_ROSTER.filter(b => b.gender === 'female');
const maleBots = ETHIOPIAN_200_BOT_ROSTER.filter(b => b.gender === 'male');

const femaleCount = femaleBots.length;
const maleCount = maleBots.length;
const femalePercentage = (femaleCount / ETHIOPIAN_200_BOT_ROSTER.length) * 100;
const malePercentage = (maleCount / ETHIOPIAN_200_BOT_ROSTER.length) * 100;

console.log(`  • Female Bots: ${femaleCount} (${femalePercentage.toFixed(1)}%)`);
console.log(`  • Male/Neutral Bots: ${maleCount} (${malePercentage.toFixed(1)}%)`);

assert.strictEqual(femaleCount, 40, `Expected exactly 40 female bots (20%), got ${femaleCount}`);
assert.strictEqual(maleCount, 160, `Expected exactly 160 male bots (80%), got ${maleCount}`);
assert.strictEqual(femalePercentage, 20.0, 'Female percentage must be exactly 20.0%');
assert.strictEqual(malePercentage, 80.0, 'Male percentage must be exactly 80.0%');
console.log(`  ✅ Demographics PASSED: Exactly 20.0% Female (40 bots) & 80.0% Male (160 bots)\n`);

// 4. Stylistic Distribution (30% Nicknames + Emojis, Fidel, Handles, Initials)
console.log('[Test 4] Verifying Stylistic & Aesthetic Distribution...');
// Regex detecting emojis, pictographs, symbols
const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}ツ]/u;
// Regex detecting Ethiopic/Ge'ez Fidel script
const fidelRegex = /[\u{1200}-\u{137F}]/u;
// Regex detecting First + Initial
const initialRegex = /^[A-Z][a-z]+ [A-Z]\.$/;
// Regex detecting handle style with _ or numbers
const handleRegex = /^[a-z0-9_]+$/;

const emojiBots = ETHIOPIAN_200_BOT_ROSTER.filter(b => emojiRegex.test(b.name));
const fidelBots = ETHIOPIAN_200_BOT_ROSTER.filter(b => fidelRegex.test(b.name));
const initialBots = ETHIOPIAN_200_BOT_ROSTER.filter(b => initialRegex.test(b.name));
const handleBots = ETHIOPIAN_200_BOT_ROSTER.filter(b => handleRegex.test(b.name));
const traditionalBots = ETHIOPIAN_200_BOT_ROSTER.filter(b => 
  !emojiRegex.test(b.name) && 
  !fidelRegex.test(b.name) && 
  !initialRegex.test(b.name) && 
  !handleRegex.test(b.name)
);

const emojiPercentage = (emojiBots.length / ETHIOPIAN_200_BOT_ROSTER.length) * 100;
console.log(`  • Emojis & Aesthetic Traits: ${emojiBots.length} (${emojiPercentage.toFixed(1)}%) [Requirement: >= 30%]`);
console.log(`  • Amharic Fidel Script: ${fidelBots.length} (${((fidelBots.length / 200) * 100).toFixed(1)}%)`);
console.log(`  • First Name + Initial: ${initialBots.length} (${((initialBots.length / 200) * 100).toFixed(1)}%)`);
console.log(`  • Telegram Handles / Gamer Tags: ${handleBots.length} (${((handleBots.length / 200) * 100).toFixed(1)}%)`);
console.log(`  • Traditional Two-Word Names: ${traditionalBots.length} (${((traditionalBots.length / 200) * 100).toFixed(1)}%)`);

assert(emojiBots.length >= 60, `Expected at least 60 bots with emojis/symbols (>=30%), got ${emojiBots.length}`);
assert(fidelBots.length >= 25, `Expected at least 25 Fidel script bots, got ${fidelBots.length}`);
assert(initialBots.length >= 40, `Expected at least 40 First+Initial bots, got ${initialBots.length}`);
assert(handleBots.length >= 25, `Expected at least 25 handle bots, got ${handleBots.length}`);
console.log(`  ✅ Stylistic distribution PASSED: Vibrant mix of Telegram display names!\n`);

// 5. Sampling Verification (Random dynamic rotation)
console.log('[Test 5] Verifying sampleStandbyBots()...');
const sample40 = sampleStandbyBots(40);
assert.strictEqual(sample40.length, 40, 'Sample must return exactly 40 bots');
const sampleIds = new Set(sample40.map(b => b.id));
assert.strictEqual(sampleIds.size, 40, 'Sampled bots must all be distinct');

// Check that sampling preserves realistic female representation (sample of 40 contains both male and female)
const sampledFemales = sample40.filter(b => b.gender === 'female');
console.log(`  • Sample of 40 bots contains ${sampledFemales.length} female bots (${((sampledFemales.length / 40) * 100).toFixed(1)}%)`);
assert(sampledFemales.length >= 3 && sampledFemales.length <= 15, `Sampled female count (${sampledFemales.length}) is reasonable`);
console.log(`  ✅ Sampling rotation PASSED\n`);

// 6. getStandbyBotById Verification
console.log('[Test 6] Verifying getStandbyBotById()...');
const bot1 = getStandbyBotById('bot_standby_001');
assert(bot1, 'bot_standby_001 must exist');
assert.strictEqual(bot1.name, 'Selam 🌸');
assert.strictEqual(bot1.gender, 'female');

const bot71 = getStandbyBotById('bot_standby_071');
assert(bot71, 'bot_standby_071 must exist');
assert.strictEqual(bot71.name, 'ናቲ');
assert.strictEqual(bot71.gender, 'male');
console.log(`  ✅ getStandbyBotById PASSED\n`);

console.log('================================================================');
console.log('🎉 ALL PHASE 13 BOT REALISM & DEMOGRAPHIC TESTS PASSED (100%)');
console.log('================================================================');
process.exit(0);
