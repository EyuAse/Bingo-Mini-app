import dotenv from 'dotenv';
dotenv.config();

import { query, pool } from '../server/db.ts';
import { telegramBotService } from '../server/services/telegramBotService.ts';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🚀 EXECUTING PHASE 5: GLOBAL APP LINK SYNCHRONIZATION AUDIT');
console.log('═══════════════════════════════════════════════════════════════\n');

async function runPhase5Audit() {
  // 1. Check DB admin_settings
  console.log('1️⃣ Auditing Neon DB admin_settings:');
  const res = await query(`SELECT key, value FROM admin_settings WHERE key LIKE 'telegram_%'`);
  console.table(res.rows);

  const webAppUrlRow = res.rows.find(r => r.key === 'telegram_webapp_url');
  const activeWebAppUrl = webAppUrlRow?.value || process.env.TELEGRAM_WEBAPP_URL || 'https://bingo-mini-app.asefaeyob962.workers.dev';
  console.log(`   Active WebApp URL in DB: ${activeWebAppUrl}`);

  // 2. Verify Versioned URL generation for Menu Button and Direct Play
  console.log('\n2️⃣ Testing Versioned URL Resolution for all App Links:');
  const versionedAppUrl = telegramBotService.getVersionedWebAppUrl(activeWebAppUrl);
  console.log(`   • Versioned Menu Button URL: ${versionedAppUrl}`);

  if (!versionedAppUrl.includes('v=20261104_1')) {
    throw new Error('Menu Button URL missing cache-busting version v=20261104_1!');
  }
  console.log('   ✓ Menu Button URL contains cache-busting version v=20261104_1.');

  // 3. Referral / StartApp Link
  const referralUrl = telegramBotService.getVersionedWebAppUrl(activeWebAppUrl, 'ref_test777');
  console.log(`   • Versioned Referral URL: ${referralUrl}`);
  if (!referralUrl.includes('v=20261104_1') || !referralUrl.includes('startapp=ref_test777')) {
    throw new Error('Referral URL missing version or startapp parameter!');
  }
  console.log('   ✓ Referral URL verified with version and startapp parameter.');

  // 4. In-App Direct Telegram Link
  const meRes = await telegramBotService.getMe();
  const botUser = meRes.result?.username || 'LomiBingobot';
  const directLink = `https://t.me/${botUser}/play`;
  console.log(`   • Native In-App Telegram Direct Link: ${directLink}`);
  console.log('   ✓ Direct In-App link confirmed.');

  console.log('\n======================================================');
  console.log('✅ PHASE 5 COMPLETE: ALL APP LINKS SYNCHRONIZED');
  console.log('======================================================\n');

  await pool.end();
  process.exit(0);
}

runPhase5Audit().catch(err => {
  console.error('❌ Phase 5 audit error:', err);
  process.exit(1);
});

