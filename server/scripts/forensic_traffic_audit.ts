import { query } from '../db.ts';

async function forensicAudit() {
  console.log('=== FORENSIC TRAFFIC & USER SOURCE AUDIT ===\n');

  // 1. Referral breakdown
  try {
    const refStats = await query(`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(DISTINCT referrer_id) as unique_referrers,
        COUNT(DISTINCT referred_user_id) as unique_referred_users
      FROM referrals;
    `);
    console.log('--- Referral Stats ---');
    console.table(refStats.rows);

    const topReferrers = await query(`
      SELECT 
        u.telegram_username,
        u.full_name,
        u.referral_code,
        COUNT(r.id) as invite_count
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      GROUP BY u.id, u.telegram_username, u.full_name, u.referral_code
      ORDER BY invite_count DESC
      LIMIT 10;
    `);
    console.log('\n--- Top 10 Referrers (Viral Referral Traffic) ---');
    console.table(topReferrers.rows);
  } catch (e: any) {
    console.log('Referrals query error:', e.message);
  }

  // 2. Deposit requests activity recently
  const recentDeposits = await query(`
    SELECT 
      DATE(created_at) as deposit_date,
      status,
      payment_method,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM deposit_requests
    GROUP BY DATE(created_at), status, payment_method
    ORDER BY deposit_date DESC
    LIMIT 15;
  `);
  console.log('\n--- Recent Deposit Requests (Real Money) ---');
  console.table(recentDeposits.rows);

  // 3. Withdrawal requests activity recently
  const recentWithdrawals = await query(`
    SELECT 
      DATE(created_at) as withdrawal_date,
      status,
      payment_method,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM withdrawal_requests
    GROUP BY DATE(created_at), status, payment_method
    ORDER BY withdrawal_date DESC
    LIMIT 15;
  `);
  console.log('\n--- Recent Withdrawal Requests ---');
  console.table(recentWithdrawals.rows);

  // 4. Ticket purchases by day
  const recentTickets = await query(`
    SELECT 
      DATE(created_at) as game_date,
      COUNT(*) as total_tickets,
      COUNT(DISTINCT user_id) as active_ticket_buyers
    FROM game_tickets
    GROUP BY DATE(created_at)
    ORDER BY game_date DESC
    LIMIT 10;
  `);
  console.log('\n--- Daily Ticket Purchases & Active Players ---');
  console.table(recentTickets.rows);

  // 5. Broadcasts sent
  try {
    const broadcasts = await query(`
      SELECT id, title, target_type, sent_count, failed_count, created_at
      FROM telegram_broadcasts
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    console.log('\n--- Recent Telegram Broadcasts ---');
    console.table(broadcasts.rows);
  } catch (e: any) {
    console.log('Broadcasts error:', e.message);
  }

  // 6. Are there any synthetic / test users remaining?
  const syntheticCheck = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE full_name ILIKE '%test%' OR telegram_username ILIKE '%test%') as test_keyword_count,
      COUNT(*) FILTER (WHERE is_bot = true) as is_bot_count,
      COUNT(*) FILTER (WHERE full_name ILIKE 'Synthetic%') as synthetic_name_count
    FROM users;
  `);
  console.log('\n--- Test / Synthetic Checks ---');
  console.table(syntheticCheck.rows);

  process.exit(0);
}

forensicAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
