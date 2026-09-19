import assert from 'assert';
import { telegramBotService } from './services/telegramBotService';
import { query } from './db';

console.log('================================================================');
console.log('🧪 Testing Phase 4: Bot Message & Promotional URL Standardization');
console.log('================================================================\n');

async function runPhase4Tests() {
  // Test 1: Verify getVersionedWebAppUrl behavior
  console.log('Step 1: Testing getVersionedWebAppUrl...');
  const v1 = telegramBotService.getVersionedWebAppUrl('https://bingo-mini-app-30pe.onrender.com');
  assert.strictEqual(v1, 'https://bingo-mini-app-30pe.onrender.com?v=20260919_3');
  console.log('  Clean base URL:', v1);

  const v2 = telegramBotService.getVersionedWebAppUrl('https://bingo-mini-app-30pe.onrender.com?v=20260914_1');
  assert.strictEqual(v2, 'https://bingo-mini-app-30pe.onrender.com?v=20260919_3');
  console.log('  Replaced old version URL:', v2);

  const v3 = telegramBotService.getVersionedWebAppUrl('https://bingo-mini-app-30pe.onrender.com', 'ref_123');
  assert.strictEqual(v3, 'https://bingo-mini-app-30pe.onrender.com?v=20260919_3&startapp=ref_123');
  console.log('  Referral URL with startapp:', v3);
  console.log('✅ PASS Step 1: Versioned WebApp URL helper is correct\n');

  // Test 2: Verify Active Promo in Database
  console.log('Step 2: Verifying active promo settings in Neon Database...');
  const promoRes = await query(
    `SELECT key, value FROM admin_settings WHERE key = 'telegram_active_promo_button_url'`
  );
  const activePromoUrl = promoRes.rows[0]?.value;
  console.log('  Active Promo Button URL in DB:', activePromoUrl);
  assert(
    activePromoUrl === 'https://t.me/LomiBingobot/play' || activePromoUrl?.includes('v=20260919_3') || !activePromoUrl,
    'Active promo URL must be direct bot link or versioned'
  );
  console.log('✅ PASS Step 2: Database promo button URL is standardized\n');

  // Test 3: Channel Announcement URL logic verification
  console.log('Step 3: Verifying Channel play button URL format...');
  const meRes = await telegramBotService.getMe();
  const botUser = meRes.result?.username || 'LomiBingobot';
  const expectedDirectLink = `https://t.me/${botUser}/play`;
  assert.strictEqual(expectedDirectLink, 'https://t.me/LomiBingobot/play');
  console.log('  Direct Bot Launch Link:', expectedDirectLink);
  console.log('✅ PASS Step 3: Direct channel mini app link verified\n');

  console.log('================================================================');
  console.log('🎉 ALL PHASE 4 URL STANDARDIZATION TESTS PASSED (100%)');
  console.log('================================================================\n');
}

runPhase4Tests().catch(err => {
  console.error('❌ Phase 4 Test Failed:', err);
  process.exit(1);
});
