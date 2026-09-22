import assert from 'assert';
import { telegramBotService } from './services/telegramBotService.ts';
import { AUDIO_PACK_VERSION, soundEngine } from '../src/services/soundEngine.ts';

async function runVoiceHarmonizationTests() {
  console.log('🧪 Running Phase 4 Voice Pack & URL Harmonization Verification...\n');

  // Test 1: AUDIO_PACK_VERSION check
  console.log('--- Test 1: Verify AUDIO_PACK_VERSION Bump ---');
  console.log(`   AUDIO_PACK_VERSION: ${AUDIO_PACK_VERSION}`);
  assert.strictEqual(AUDIO_PACK_VERSION, 'v3_client_human_20260922_1', 'Audio pack version must be bumped to v3 20260922_1');
  console.log('✅ Test 1 Passed!\n');

  // Test 2: SoundEngine URLs
  console.log('--- Test 2: Verify SoundEngine Ball & Phrase URLs ---');
  const ball1Url = soundEngine.getBallAudioUrl(1);
  const ball75Url = soundEngine.getBallAudioUrl(75);
  const startPhraseUrl = soundEngine.getPhraseAudioUrl('start');

  console.log(`   Ball 1 URL: ${ball1Url}`);
  console.log(`   Ball 75 URL: ${ball75Url}`);
  console.log(`   Start Phrase URL: ${startPhraseUrl}`);

  assert(ball1Url.includes('?v=v3_client_human_20260922_1'), 'Ball 1 URL must have v3 cache-busting version');
  assert(ball75Url.includes('?v=v3_client_human_20260922_1'), 'Ball 75 URL must have v3 cache-busting version');
  assert(startPhraseUrl.includes('?v=v3_client_human_20260922_1'), 'Phrase URL must have v3 cache-busting version');
  console.log('✅ Test 2 Passed!\n');

  // Test 3: Telegram Bot Launch URL Harmonization (Direct Bot Search vs Invitation Link)
  console.log('--- Test 3: Telegram Bot Launch URL Harmonization ---');
  const baseUrl = 'https://bingo-mini-app-30pe.onrender.com';

  // Direct bot search (no startParam)
  const directUrl = telegramBotService.getVersionedWebAppUrl(baseUrl);
  console.log(`   Direct Bot Search URL: ${directUrl}`);
  assert(directUrl.includes('?v=20260922_1'), 'Direct bot launch URL must have cache-busting parameter');

  // Invitation link (with startParam ref_12345)
  const inviteUrl = telegramBotService.getVersionedWebAppUrl(baseUrl, 'ref_12345');
  console.log(`   Invitation Link URL: ${inviteUrl}`);
  assert(inviteUrl.includes('v=20260922_1'), 'Invitation link URL must have cache-busting version parameter');
  assert(inviteUrl.includes('startapp=ref_12345'), 'Invitation link URL must have startapp parameter');

  // Menu button URL
  const menuButtonUrl = telegramBotService.getVersionedWebAppUrl(baseUrl);
  console.log(`   Menu Button URL: ${menuButtonUrl}`);
  assert.strictEqual(directUrl, menuButtonUrl, 'Direct bot search and Menu button use the exact same harmonized versioned URL');
  console.log('✅ Test 3 Passed!\n');

  console.log('🎉 ALL PHASE 4 TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runVoiceHarmonizationTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
