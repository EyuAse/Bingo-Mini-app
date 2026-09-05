import { query } from './db.ts';

async function resetBalances() {
  console.log('🔄 Resetting NATAN and Eyu Ase balances in Neon PostgreSQL...');
  
  // NATAN: ID 09903e0d-119d-4c60-beae-4d3db10aae0c (0 In / 0 Out -> 0.00 ETB)
  await query('UPDATE wallets SET balance = 0.00, bonus = 0.00, updated_at = NOW() WHERE user_id = $1', [
    '09903e0d-119d-4c60-beae-4d3db10aae0c'
  ]);

  // Eyu Ase: ID c91c3275-f863-41b3-af81-16333e58c219 (100 In - 50 Out -> 50.00 ETB)
  await query('UPDATE wallets SET balance = 50.00, bonus = 0.00, updated_at = NOW() WHERE user_id = $1', [
    'c91c3275-f863-41b3-af81-16333e58c219'
  ]);

  const res = await query(
    'SELECT u.id, u.full_name, w.balance, w.bonus FROM users u JOIN wallets w ON u.id = w.user_id WHERE u.id IN ($1, $2)',
    ['09903e0d-119d-4c60-beae-4d3db10aae0c', 'c91c3275-f863-41b3-af81-16333e58c219']
  );

  console.log('✅ Balances Successfully Reset:');
  console.log(res.rows);
  process.exit(0);
}

resetBalances().catch(err => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
