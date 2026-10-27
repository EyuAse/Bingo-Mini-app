import dotenv from 'dotenv';
dotenv.config();

import { query, pool } from '../db.ts';

async function checkBonusBreakdown() {
  const sql = `
    SELECT 
      COUNT(*) as total_bonus_only_users,
      COUNT(*) FILTER (WHERE w.bonus = 10 AND (w.balance = 0 OR w.balance IS NULL)) as untouched_full_10_bonus,
      COUNT(*) FILTER (WHERE w.bonus > 0 AND w.bonus < 10) as partial_bonus_remaining,
      COUNT(*) FILTER (WHERE (w.bonus = 0 OR w.bonus IS NULL) AND (w.balance = 0 OR w.balance IS NULL)) as spent_all_bonus_empty_wallet,
      COUNT(*) FILTER (WHERE w.balance > 0) as won_money_from_bonus_has_balance,
      COALESCE(SUM(w.bonus), 0) as total_unspent_bonus_etb,
      COALESCE(SUM(w.balance), 0) as total_balance_held_by_un_deposited_users
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    WHERE u.has_deposited = false;
  `;

  const res = await query(sql);
  console.log('📊 [Bonus-Only Users Wallet State Breakdown]:\n');
  console.table(res.rows[0]);

  // Let's also see top balances among un-deposited users who won
  const winnersSql = `
    SELECT 
      u.id, 
      u.full_name, 
      u.telegram_username, 
      w.balance, 
      w.bonus,
      u.created_at
    FROM users u
    JOIN wallets w ON u.id = w.user_id
    WHERE u.has_deposited = false AND w.balance > 0
    ORDER BY w.balance DESC
    LIMIT 10;
  `;
  const winnersRes = await query(winnersSql);
  if (winnersRes.rows.length > 0) {
    console.log('\n🏆 [Top Un-Deposited Users Who Won Money from 10 ETB Bonus]:');
    console.table(winnersRes.rows);
  }

  await pool.end();
  process.exit(0);
}

checkBonusBreakdown().catch(err => {
  console.error(err);
  process.exit(1);
});
