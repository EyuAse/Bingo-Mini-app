import { query, withTransaction, checkDbConnection } from '../db.ts';
import bcrypt from 'bcryptjs';
import { REGISTERED_BOT_ACCOUNTS } from '../db/setup_3_registered_bots.ts';

export async function executeCleanHandoverReset() {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('🧹 STARTING NEON POSTGRESQL PRODUCTION CLEAN HANDOVER RESET');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  const health = await checkDbConnection();
  if (!health.connected) {
    console.error('❌ Cannot connect to Neon DB:', health.error);
    process.exit(1);
  }
  console.log(`✅ Connected to Neon DB (${health.latencyMs}ms latency)\n`);

  await withTransaction(async (client) => {
    // 1. Purge all test transactions and cashier requests
    console.log('1️⃣ Purging all test cashier requests & financial ledgers...');
    await client.query('TRUNCATE TABLE deposit_requests, withdrawal_requests, wallet_transactions CASCADE;');
    console.log('   ✓ Cleared deposit_requests (0 pending/approved)');
    console.log('   ✓ Cleared withdrawal_requests (0 pending/approved)');
    console.log('   ✓ Cleared wallet_transactions (clean financial ledger)');

    // 2. Purge all test rounds and tickets
    console.log('\n2️⃣ Purging all test game rounds & tickets...');
    await client.query('TRUNCATE TABLE game_tickets, game_rounds CASCADE;');
    console.log('   ✓ Cleared game_tickets');
    console.log('   ✓ Cleared game_rounds (0 test rounds)');

    // 3. Purge test real player accounts (Preserving bots and admin)
    console.log('\n3️⃣ Purging test player accounts (strictly keeping Bots & Admin)...');
    const deleteWalletsRes = await client.query(`
      DELETE FROM wallets 
      WHERE user_id IN (
        SELECT id FROM users 
        WHERE (is_bot = false OR is_bot IS NULL) 
          AND role != 'admin'
      )
    `);
    console.log(`   ✓ Removed ${deleteWalletsRes.rowCount} test player wallets`);

    const deleteUsersRes = await client.query(`
      DELETE FROM users 
      WHERE (is_bot = false OR is_bot IS NULL) 
        AND role != 'admin'
    `);
    console.log(`   ✓ Removed ${deleteUsersRes.rowCount} test player accounts`);

    // 4. Ensure official Admin Cashier exists
    console.log('\n4️⃣ Verifying Official Super Admin Cashier...');
    const hashedPin = await bcrypt.hash('1234', 10);
    const existingAdmin = await client.query("SELECT id, full_name, phone FROM users WHERE phone = '0998983344' OR role = 'admin' LIMIT 1");
    let adminId: string;

    if (existingAdmin.rows.length > 0) {
      adminId = existingAdmin.rows[0].id;
      await client.query(`
        UPDATE users 
        SET pin_hash = $1, status = 'active', role = 'admin', full_name = 'Mekonen Woldekidane (Cashier)', phone = '0998983344', is_bot = false 
        WHERE id = $2
      `, [hashedPin, adminId]);
      console.log(`   ✓ Updated Official Admin Account (ID: ${adminId}) with PIN: 1234`);
    } else {
      const adminRes = await client.query(`
        INSERT INTO users (phone, full_name, pin_hash, role, status, is_bot)
        VALUES ('0998983344', 'Mekonen Woldekidane (Cashier)', $1, 'admin', 'active', false)
        RETURNING id, full_name, phone, role;
      `, [hashedPin]);
      adminId = adminRes.rows[0].id;
      console.log(`   ✓ Created Official Admin Account: ${adminRes.rows[0].full_name} (${adminRes.rows[0].phone}) with PIN: 1234`);
    }

    await client.query(`
      INSERT INTO wallets (user_id, balance, bonus, currency)
      VALUES ($1, 0.00, 0.00, 'ETB')
      ON CONFLICT (user_id) DO UPDATE SET
        balance = 0.00,
        bonus = 0.00;
    `, [adminId]);

    // 5. Verify & Seed 3 Registered Bots
    console.log('\n5️⃣ Verifying & Seeding Registered Bot Accounts...');
    for (const bot of REGISTERED_BOT_ACCOUNTS) {
      await client.query(`
        INSERT INTO users (
          id, telegram_id, telegram_username, first_name, last_name, full_name, phone, role, status, is_bot
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'player', 'active', true)
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          status = 'active',
          is_bot = true;
      `, [
        bot.id,
        bot.tgId,
        bot.tgUsername,
        bot.firstName,
        bot.lastName,
        bot.fullName,
        bot.phone
      ]);

      await client.query(`
        INSERT INTO wallets (user_id, balance, bonus, locked_balance, currency)
        VALUES ($1, $2, 0.00, 0.00, 'ETB')
        ON CONFLICT (user_id) DO UPDATE SET
          balance = EXCLUDED.balance,
          locked_balance = 0.00;
      `, [bot.id, bot.balance]);
      console.log(`   ✓ Bot Active: ${bot.fullName} (${bot.phone}) with ${bot.balance} ETB wallet`);
    }

    // 6. Ensure 4 Official Game Rooms exist
    console.log('\n6️⃣ Verifying Official 4 Game Rooms...');
    await client.query(`
      INSERT INTO game_rooms (id, name, stake_amount, min_players, max_players, house_commission_percent, is_active)
      VALUES
        ('room-10', '10 Birr Quick Bingo', 10.00, 2, 200, 15.0, true),
        ('room-20', '20 Birr Standard Room', 20.00, 2, 200, 15.0, true),
        ('room-50', '50 Birr High Roller', 50.00, 2, 200, 15.0, true),
        ('room-100', '100 Birr VIP Champion', 100.00, 2, 200, 15.0, true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        stake_amount = EXCLUDED.stake_amount,
        is_active = true;
    `);
    console.log('   ✓ 4 Game Rooms verified in active state (10, 20, 50, 100 ETB)');
  });

  // 7. Print Final Verification Summary
  console.log('\n══════════════════════════════════════════════════════════════════════════════');
  console.log('📊 FINAL DATABASE STATE VERIFICATION');
  console.log('══════════════════════════════════════════════════════════════════════════════');

  const usersCount = await query('SELECT role, is_bot, count(*) as count FROM users GROUP BY role, is_bot;');
  console.log('\n👥 User Entities in Database:');
  console.table(usersCount.rows);

  const txCount = await query('SELECT count(*) as count FROM wallet_transactions;');
  const depCount = await query('SELECT count(*) as count FROM deposit_requests;');
  const withCount = await query('SELECT count(*) as count FROM withdrawal_requests;');
  const roundCount = await query('SELECT count(*) as count FROM game_rounds;');

  console.log('📈 Financial & Game Ledger Counts:');
  console.log(`   • Wallet Transactions: ${txCount.rows[0].count}`);
  console.log(`   • Deposit Requests:    ${depCount.rows[0].count}`);
  console.log(`   • Withdrawal Requests: ${withCount.rows[0].count}`);
  console.log(`   • Game Rounds History: ${roundCount.rows[0].count}`);

  console.log('\n🎉 [CLEAN HANDOVER COMPLETE] Database is 100% spotless and ready for client submission! ✅\n');
}

// Self-run when executed directly
executeCleanHandoverReset()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Reset error:', err);
    process.exit(1);
  });
