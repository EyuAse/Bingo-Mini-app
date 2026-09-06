import { query } from '../db.ts';

async function cleanupSyntheticAccounts() {
  console.log('🧹 Purging all synthetic test accounts from Neon PostgreSQL...');

  // 1. Delete transactions of synthetic users
  const txRes = await query(`
    DELETE FROM wallet_transactions 
    WHERE user_id IN (
      SELECT id FROM users 
      WHERE full_name LIKE 'Synthetic%' 
         OR phone LIKE '096666%' 
         OR phone LIKE '099999%' 
         OR phone = '0911000099'
    )
  `);
  console.log(`   ✓ Deleted ${txRes.rowCount} test wallet transactions`);

  // 2. Delete wallets of synthetic users
  const walletRes = await query(`
    DELETE FROM wallets 
    WHERE user_id IN (
      SELECT id FROM users 
      WHERE full_name LIKE 'Synthetic%' 
         OR phone LIKE '096666%' 
         OR phone LIKE '099999%' 
         OR phone = '0911000099'
    )
  `);
  console.log(`   ✓ Deleted ${walletRes.rowCount} test wallets`);

  // 3. Delete users
  const userRes = await query(`
    DELETE FROM users 
    WHERE full_name LIKE 'Synthetic%' 
       OR phone LIKE '096666%' 
       OR phone LIKE '099999%' 
       OR phone = '0911000099'
  `);
  console.log(`   ✓ Deleted ${userRes.rowCount} synthetic test users`);

  // 4. Verify remaining users
  const remainingRes = await query(`
    SELECT u.id, u.full_name, u.phone, u.role, u.is_bot, COALESCE(w.balance, 0) as balance
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    ORDER BY u.is_bot ASC, u.created_at ASC
  `);

  console.log('\n📋 Remaining Official Accounts in Neon Database:');
  console.table(remainingRes.rows);

  process.exit(0);
}

cleanupSyntheticAccounts().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
