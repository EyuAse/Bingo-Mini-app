import { query, withTransaction } from '../db.ts';

const ETHIOPIAN_FIRST_NAMES = [
  'Abebe', 'Almaz', 'Bekele', 'Chaltu', 'Dawit', 'Eleni', 'Fikru', 'Genet',
  'Haile', 'Hiwot', 'Kassahun', 'Lemlem', 'Mekonnen', 'Meseret', 'Natnael', 'Rahel',
  'Samuel', 'Selam', 'Tariku', 'Tigist', 'Yonas', 'Zenebech', 'Biruk', 'Desta',
  'Ermias', 'Fasika', 'Girma', 'Hanna', 'Kidus', 'Liya', 'Meron', 'Nebiyu',
  'Robel', 'Saron', 'Tewodros', 'Tsedey', 'Yared', 'Zelalem', 'Bilen', 'Danait',
  'Ephrem', 'Frehiwot', 'Getachew', 'Helen', 'Kalkidan', 'Mahlet', 'Muluken', 'Netsanet',
  'Ruth', 'Solomon', 'Tadesse', 'Tsion', 'Yohannes', 'Zerihun', 'Bethel', 'Daniel',
  'Eyob', 'Fitsum', 'Kaleb', 'Nardos', 'Sintayehu', 'Wondwossen', 'Birtukan', 'Abel'
];

const ETHIOPIAN_LAST_NAMES = [
  'Bikila', 'Tesfaye', 'Mengistu', 'Worku', 'Tadesse', 'Gebre', 'Alemu', 'Kassa',
  'Assefa', 'Desta', 'Girma', 'Haile', 'Kebede', 'Melaku', 'Negash', 'Tilahun',
  'Wolde', 'Yilma', 'Zewde', 'Ayele', 'Berhanu', 'Demissie', 'Fekadu', 'Getahun',
  'Mamo', 'Tefera', 'Woldekidan', 'Bogale', 'Bekele', 'Shiferaw', 'Abebe', 'Balcha'
];

export async function setupBotAccounts() {
  console.log('🤖 [Bot Database Setup] Ensuring is_bot column on users table...');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false');
  await query('CREATE INDEX IF NOT EXISTS idx_users_is_bot ON users(is_bot)');

  console.log('🤖 [Bot Database Setup] Batch Seeding 200 Persistent Ethiopian Bot Accounts...');

  const totalBots = 200;
  const userValues: any[] = [];
  const userPlaceholders: string[] = [];
  const walletValues: any[] = [];
  const walletPlaceholders: string[] = [];

  for (let i = 0; i < totalBots; i++) {
    const fn = ETHIOPIAN_FIRST_NAMES[i % ETHIOPIAN_FIRST_NAMES.length];
    const ln = ETHIOPIAN_LAST_NAMES[(Math.floor(i / ETHIOPIAN_FIRST_NAMES.length) + i * 3) % ETHIOPIAN_LAST_NAMES.length];
    const fullName = `${fn} ${ln}`;
    const botId = `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`;
    const phone = `09${String(11000000 + ((i * 39827) % 88999999)).slice(0, 8)}`;
    const tgUsername = `bot_${fn.toLowerCase()}_${i + 1}`;
    const tgId = 9000000000 + i + 1;

    // Users batch
    const uIdx = i * 7;
    userPlaceholders.push(`($${uIdx + 1}, $${uIdx + 2}, $${uIdx + 3}, $${uIdx + 4}, $${uIdx + 5}, $${uIdx + 6}, $${uIdx + 7}, 'player', 'active', true)`);
    userValues.push(botId, tgId, tgUsername, fn, ln, fullName, phone);

    // Wallets batch
    const wIdx = i * 2;
    walletPlaceholders.push(`($${wIdx + 1}, $${wIdx + 2}, 50.00, 0.00, 'ETB')`);
    walletValues.push(botId, 500.00);
  }

  // 1. Single Query Insert all 200 Users
  await query(`
    INSERT INTO users (id, telegram_id, telegram_username, first_name, last_name, full_name, phone, role, status, is_bot)
    VALUES ${userPlaceholders.join(',\n')}
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      status = 'active',
      is_bot = true
  `, userValues);

  // 2. Single Query Insert all 200 Wallets
  await query(`
    INSERT INTO wallets (user_id, balance, bonus, locked_balance, currency)
    VALUES ${walletPlaceholders.join(',\n')}
    ON CONFLICT (user_id) DO UPDATE SET
      balance = CASE WHEN wallets.balance < 50.00 THEN 500.00 ELSE wallets.balance END,
      locked_balance = 0.00
  `, walletValues);

  const countRes = await query('SELECT COUNT(*) as count FROM users WHERE is_bot = true');
  console.log(`✅ [Bot Database Setup] Successfully verified ${countRes.rows[0].count} bot accounts in Neon PostgreSQL!`);
}

// Self-run if called directly
if (process.argv[1]?.includes('setup_bot_accounts')) {
  setupBotAccounts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ [Bot Database Setup Error]:', err);
      process.exit(1);
    });
}
