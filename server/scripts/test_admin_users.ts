import { query } from '../db.ts';

async function testAdminUsers() {
  const usersRes = await query(`
    SELECT 
      u.id,
      u.full_name as name,
      COALESCE(u.phone, CONCAT('09', RIGHT(CAST(u.telegram_id AS TEXT), 8))) as phone,
      COALESCE(w.balance, 0.00) as balance,
      u.status,
      u.role
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    WHERE u.role = 'player' 
      AND (u.is_bot IS NULL OR u.is_bot = false)
      AND u.full_name NOT LIKE 'Synthetic%'
    ORDER BY u.created_at DESC
  `);

  console.log('👥 Admin Player Accounts Desk View:');
  console.table(usersRes.rows);

  const botRes = await query(`
    SELECT u.id, u.full_name as name, u.phone, COALESCE(w.balance, 0) as balance, u.is_bot
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    WHERE u.is_bot = true
    ORDER BY u.created_at ASC
  `);

  console.log('\n🤖 Registered Bot Accounts Desk View:');
  console.table(botRes.rows);

  process.exit(0);
}

testAdminUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
