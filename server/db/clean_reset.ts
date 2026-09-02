import { query, withTransaction, checkDbConnection } from '../db.ts';
import bcrypt from 'bcryptjs';

async function resetAndCleanDatabase() {
  console.log('🔄 [Neon DB Clean Reset] Connecting to Neon PostgreSQL...');
  const health = await checkDbConnection();
  if (!health.connected) {
    console.error('❌ Cannot connect to Neon DB:', health.error);
    process.exit(1);
  }
  console.log(`✅ Connected to Neon DB (${health.latencyMs}ms)`);

  await withTransaction(async (client) => {
    console.log('🧹 [Wiping Tables] Cleaning all previous test users, wallets, deposits, withdrawals, tickets...');

    // Truncate tables with cascade
    await client.query(`
      TRUNCATE TABLE 
        game_tickets, 
        game_rounds, 
        wallet_transactions, 
        deposit_requests, 
        withdrawal_requests, 
        otp_verifications,
        wallets, 
        users, 
        game_rooms 
      CASCADE;
    `);

    console.log('🌱 [Seeding Official Admin Cashier]...');
    const hashedPin = await bcrypt.hash('1234', 10);
    const adminUserRes = await client.query(`
      INSERT INTO users (phone, full_name, pin_hash, role, status)
      VALUES ('0998983344', 'Mekonen Woldekidane (Cashier)', $1, 'admin', 'active')
      RETURNING id, full_name, role;
    `, [hashedPin]);

    const adminId = adminUserRes.rows[0].id;

    // Admin Cashier has no game wallet balance (manages deposits/withdrawals only)
    await client.query(`
      INSERT INTO wallets (user_id, balance, bonus, currency)
      VALUES ($1, 0.00, 0.00, 'ETB');
    `, [adminId]);

    console.log('🎮 [Seeding 4 Official Game Rooms]...');
    await client.query(`
      INSERT INTO game_rooms (id, name, stake_amount, min_players, max_players, house_commission_percent, is_active)
      VALUES 
        ('room-10', '10 Birr Quick Bingo', 10.00, 2, 200, 15.0, true),
        ('room-25', '25 Birr Standard Room', 25.00, 2, 200, 15.0, true),
        ('room-50', '50 Birr High Roller', 50.00, 2, 200, 15.0, true),
        ('room-100', '100 Birr VIP Champion', 100.00, 2, 200, 15.0, true);
    `);

    console.log('✨ [Neon DB Reset Complete] Database is 100% spotless and ready for production!');
  });

  process.exit(0);
}

resetAndCleanDatabase().catch(err => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
