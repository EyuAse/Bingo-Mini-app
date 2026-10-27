import { query } from '../db.ts';

async function investigateUsers() {
  console.log('=== USER REGISTRATION & ACTIVITY INVESTIGATION ===\n');

  // 1. Total counts breakdown
  const totalSummary = await query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE role = 'player') as total_players,
      COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
      COUNT(*) FILTER (WHERE role = 'cashier') as total_cashiers,
      COUNT(*) FILTER (WHERE is_bot = true) as total_bots,
      COUNT(*) FILTER (WHERE telegram_id IS NOT NULL) as with_telegram_id,
      COUNT(*) FILTER (WHERE telegram_id IS NULL) as without_telegram_id,
      COUNT(*) FILTER (WHERE phone IS NOT NULL) as with_phone
    FROM users;
  `);
  console.log('--- Overall Users Breakdown ---');
  console.table(totalSummary.rows);

  // 2. Registrations by Date
  const dailyRegistrations = await query(`
    SELECT 
      DATE(created_at) as reg_date,
      COUNT(*) as total_new_users,
      COUNT(*) FILTER (WHERE telegram_id IS NOT NULL) as tg_users,
      COUNT(*) FILTER (WHERE telegram_id IS NULL) as non_tg_users,
      COUNT(*) FILTER (WHERE is_bot = true) as bot_users
    FROM users
    GROUP BY DATE(created_at)
    ORDER BY reg_date DESC
    LIMIT 20;
  `);
  console.log('\n--- Daily Registrations (Last 20 Days) ---');
  console.table(dailyRegistrations.rows);

  // 3. Hourly breakdown for the last 48 hours
  const hourlyRegistrations = await query(`
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD HH24:00') as reg_hour,
      COUNT(*) as count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '48 hours'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD HH24:00')
    ORDER BY reg_hour DESC
    LIMIT 24;
  `);
  console.log('\n--- Hourly Registrations (Last 48 Hours) ---');
  console.table(hourlyRegistrations.rows);

  // 4. Sample recent users
  const recentUsers = await query(`
    SELECT 
      id,
      telegram_id,
      telegram_username,
      first_name,
      last_name,
      full_name,
      role,
      is_bot,
      status,
      created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 15;
  `);
  console.log('\n--- 15 Most Recent Users ---');
  console.table(recentUsers.rows);

  // 5. Check if there are repeated telegram_ids, photos, names
  const repeatedNames = await query(`
    SELECT 
      full_name,
      COUNT(*) as cnt
    FROM users
    GROUP BY full_name
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 10;
  `);
  console.log('\n--- Repeated Names (if any) ---');
  console.table(repeatedNames.rows);

  // 6. Check telegram bot subscribers table or channel members if exists
  try {
    const tgSubs = await query(`
      SELECT COUNT(*) as sub_count FROM bot_subscribers;
    `);
    console.log('\n--- Bot Subscribers Table ---');
    console.table(tgSubs.rows);
  } catch (e: any) {
    console.log('\nNote on bot_subscribers:', e.message);
  }

  // 7. Check user financial activity and games played
  const activitySummary = await query(`
    SELECT 
      COUNT(DISTINCT u.id) as total_users,
      COUNT(DISTINCT wt.user_id) as users_with_wallet_tx,
      COUNT(DISTINCT dr.user_id) as users_with_deposits,
      COUNT(DISTINCT wr.user_id) as users_with_withdrawals
    FROM users u
    LEFT JOIN wallet_transactions wt ON u.id = wt.user_id
    LEFT JOIN deposit_requests dr ON u.id = dr.user_id
    LEFT JOIN withdrawal_requests wr ON u.id = wr.user_id;
  `);
  console.log('\n--- User Financial Activity ---');
  console.table(activitySummary.rows);

  // 8. Check ticket purchases or game participation
  try {
    const gameActivity = await query(`
      SELECT 
        COUNT(DISTINCT user_id) as users_who_bought_tickets
      FROM game_tickets;
    `);
    console.log('\n--- Game Ticket Activity ---');
    console.table(gameActivity.rows);
  } catch (e: any) {
    console.log('\nNote on game_tickets:', e.message);
  }

  // 9. Check wallet balances
  const balanceDistribution = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE balance = 0 AND bonus = 10) as default_free_bonus_only,
      COUNT(*) FILTER (WHERE balance > 0) as has_deposited_cash,
      COUNT(*) FILTER (WHERE balance = 0 AND bonus < 10) as bonus_spent,
      COUNT(*) FILTER (WHERE balance = 0 AND bonus = 0) as completely_empty
    FROM wallets;
  `);
  console.log('\n--- Wallet Balances Distribution ---');
  console.table(balanceDistribution.rows);

  process.exit(0);
}

investigateUsers().catch(err => {
  console.error('Investigation failed:', err);
  process.exit(1);
});
