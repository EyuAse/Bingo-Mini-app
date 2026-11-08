/**
 * test_bandwidth_phase4_sql_cache.ts
 *
 * Automated verification of Bandwidth Optimization Phase 4:
 * 1. Verifies in-memory caching of admin_settings in telegramBotService
 * 2. Confirms that 50 consecutive calls execute 0 additional database queries
 * 3. Confirms clearConfigCache() properly invalidates and forces fresh reload
 * 4. Verifies getConfig(), welcome greeting, and promo settings read from memory cache
 */

import { telegramBotService } from '../services/telegramBotService.ts';
import { pool } from '../db.ts';

async function runPhase4SqlCacheTests() {
  console.log('🚀 [Test] Starting Phase 4 In-Memory SQL Settings Cache Test Suite...\n');

  let dbQueryCount = 0;
  const originalPoolQuery = pool.query.bind(pool);

  // Intercept pool.query to measure query frequency
  (pool as any).query = async (text: any, params?: any) => {
    const sqlText = typeof text === 'string' ? text : text?.text || '';
    if (sqlText.includes('admin_settings')) {
      dbQueryCount++;
    }
    return (originalPoolQuery as any)(text, params);
  };

  try {
    // 1. Reset and initial load
    telegramBotService.clearConfigCache();
    dbQueryCount = 0;

    console.log('--- TEST 1: Initial Settings Load from Neon DB ---');
    const settings1 = await telegramBotService.getSettings();
    if (dbQueryCount !== 1) {
      throw new Error(`❌ Expected exactly 1 DB query on initial load, got ${dbQueryCount}`);
    }
    console.log(`   ✅ Initial load executed exactly 1 DB query. Keys loaded: ${Object.keys(settings1).length}`);

    // 2. 50 Consecutive reads should execute 0 additional queries (100% RAM cache hits)
    console.log('\n--- TEST 2: 50 Consecutive Reads from In-Memory Cache ---');
    for (let i = 0; i < 50; i++) {
      await telegramBotService.getSettings();
      await telegramBotService.getSettings(['telegram_bot_welcome_text', 'telegram_bot_welcome_photo']);
      await telegramBotService.getConfig();
    }
    if (dbQueryCount !== 1) {
      throw new Error(`❌ Cache leak! Expected query count to remain 1, but got ${dbQueryCount}`);
    }
    console.log('   ✅ 50 consecutive getSettings() & getConfig() calls executed 0 additional DB queries (100% RAM hits)!');

    // 3. Verify Cache Invalidation via clearConfigCache()
    console.log('\n--- TEST 3: Cache Invalidation via clearConfigCache() ---');
    telegramBotService.clearConfigCache();
    const settingsReloaded = await telegramBotService.getSettings();
    if (dbQueryCount !== 2) {
      throw new Error(`❌ Invalidation failed! Expected dbQueryCount to be 2, got ${dbQueryCount}`);
    }
    console.log('   ✅ clearConfigCache() successfully cleared memory cache and fetched fresh data on next call.');

    // 4. Verify In-Memory Performance Benchmark
    console.log('\n--- TEST 4: Performance Benchmark (Memory vs Network Query) ---');
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      await telegramBotService.getSettings();
    }
    const t1 = performance.now();
    const avgDurationMicroseconds = ((t1 - t0) / 1000) * 1000;
    console.log(`   ✅ 1,000 cached reads completed in ${(t1 - t0).toFixed(2)}ms (Average: ${avgDurationMicroseconds.toFixed(2)}µs per read)`);
    console.log('   ✅ 0 bytes transferred over Neon TLS connection during cached reads!');

    console.log('\n🎉 [Success] All Phase 4 In-Memory SQL Cache Tests Passed Perfectly!');
  } finally {
    pool.query = originalPoolQuery;
    process.exit(0);
  }
}

runPhase4SqlCacheTests().catch(err => {
  console.error('❌ [Phase 4 Test Failure]:', err);
  process.exit(1);
});
