import { query, withTransaction } from '../db.ts';

export const REGISTERED_BOT_ACCOUNTS = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    firstName: 'Dawit',
    lastName: 'Haile',
    fullName: 'Dawit Haile',
    phone: '0911445566',
    tgUsername: 'dawit_haile',
    tgId: 9000000001,
    balance: 1000.00
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    firstName: 'Selam',
    lastName: 'Tesfaye',
    fullName: 'Selam Tesfaye',
    phone: '0922334455',
    tgUsername: 'selam_tesfaye',
    tgId: 9000000002,
    balance: 1000.00
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    firstName: 'Abebe',
    lastName: 'Bikila',
    fullName: 'Abebe Bikila',
    phone: '0933221100',
    tgUsername: 'abebe_bikila',
    tgId: 9000000003,
    balance: 1000.00
  }
];

export async function setup3RegisteredBots() {
  console.log('🧹 [Bots Setup] Deleting old 200 bots from Neon PostgreSQL...');

  await withTransaction(async (client) => {
    // 1. Delete transactions of existing bots
    await client.query(`
      DELETE FROM wallet_transactions 
      WHERE user_id IN (SELECT id FROM users WHERE is_bot = true)
    `);

    // 2. Delete wallets of existing bots
    await client.query(`
      DELETE FROM wallets 
      WHERE user_id IN (SELECT id FROM users WHERE is_bot = true)
    `);

    // 3. Delete old bots from users table
    await client.query(`
      DELETE FROM users 
      WHERE is_bot = true
    `);
  });

  console.log('✅ [Bots Setup] Old bots purged. Registering exactly 3 bots as real users...');

  // 4. Register the 3 designated bots as real user entities
  for (const bot of REGISTERED_BOT_ACCOUNTS) {
    await query(`
      INSERT INTO users (
        id, telegram_id, telegram_username, first_name, last_name, full_name, phone, role, status, is_bot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'player', 'active', true)
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        status = 'active',
        is_bot = true
    `, [
      bot.id,
      bot.tgId,
      bot.tgUsername,
      bot.firstName,
      bot.lastName,
      bot.fullName,
      bot.phone
    ]);

    await query(`
      INSERT INTO wallets (user_id, balance, bonus, locked_balance, currency)
      VALUES ($1, $2, 0.00, 0.00, 'ETB')
      ON CONFLICT (user_id) DO UPDATE SET
        balance = EXCLUDED.balance,
        locked_balance = 0.00
    `, [bot.id, bot.balance]);

    console.log(`   ✓ Registered Bot: ${bot.fullName} (${bot.phone}) with ${bot.balance} ETB wallet`);
  }

  // 5. Verify count
  const countRes = await query('SELECT COUNT(*) as count FROM users WHERE is_bot = true');
  const count = parseInt(countRes.rows[0].count, 10);
  console.log(`\n🎉 [Bots Setup Complete] Confirmed exactly ${count} registered bot accounts in Neon DB!`);
  if (count !== 3) {
    throw new Error(`Expected 3 bot accounts, found ${count}`);
  }
}

// Direct execution
setup3RegisteredBots()
  .then(() => {
    console.log('🚀 Database bot setup finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Bot setup error:', err);
    process.exit(1);
  });
