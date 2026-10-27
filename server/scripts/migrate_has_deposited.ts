import dotenv from 'dotenv';
dotenv.config();

import { query, pool } from '../db.ts';

async function runPhase1Migration() {
  console.log('🚀 [Phase 1 Migration]: Starting has_deposited column setup and backfill on Neon DB...\n');

  // 1. Add column if not exists
  console.log('1️⃣ Adding `has_deposited` column to users table...');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS has_deposited BOOLEAN DEFAULT false;');
  console.log('   ✓ Column `has_deposited` verified.');

  // 2. Add index for rapid querying
  console.log('2️⃣ Ensuring index `idx_users_has_deposited` exists...');
  await query('CREATE INDEX IF NOT EXISTS idx_users_has_deposited ON users(has_deposited);');
  console.log('   ✓ Index created/verified.');

  // 3. Backfill from deposit_requests (approved status)
  console.log('3️⃣ Backfilling from approved `deposit_requests`...');
  const resDep = await query(`
    UPDATE users 
    SET has_deposited = true 
    WHERE id IN (
      SELECT DISTINCT user_id 
      FROM deposit_requests 
      WHERE status = 'approved'
    ) AND has_deposited = false
    RETURNING id;
  `);
  console.log(`   ✓ Updated ${resDep.rowCount || 0} users from approved deposit_requests.`);

  // 4. Backfill from wallet_transactions (completed deposits)
  console.log('4️⃣ Backfilling from completed `wallet_transactions` deposits...');
  const resTx = await query(`
    UPDATE users 
    SET has_deposited = true 
    WHERE id IN (
      SELECT DISTINCT user_id 
      FROM wallet_transactions 
      WHERE type = 'deposit' AND status = 'completed'
    ) AND has_deposited = false
    RETURNING id;
  `);
  console.log(`   ✓ Updated ${resTx.rowCount || 0} additional users from wallet_transactions.`);

  // 5. Verification & Summary Metrics
  console.log('\n📊 [Phase 1 Verification Metrics]:');
  const metricsRes = await query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE has_deposited = true) as deposited_users,
      COUNT(*) FILTER (WHERE has_deposited = false OR has_deposited IS NULL) as bonus_only_users
    FROM users;
  `);

  const metrics = metricsRes.rows[0];
  console.table({
    'Total Registered Users': metrics.total_users,
    'Verified Deposited Users (Normal Win Probability)': metrics.deposited_users,
    'Bonus-Only Users (0% Win Probability Protected)': metrics.bonus_only_users
  });

  console.log('\n🎉 [Phase 1 Complete]: Live Neon DB successfully migrated with persistent has_deposited flags!');
  await pool.end();
  process.exit(0);
}

runPhase1Migration().catch(err => {
  console.error('❌ [Phase 1 Migration Error]:', err);
  process.exit(1);
});
