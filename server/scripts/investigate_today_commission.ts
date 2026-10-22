import { query } from '../db.ts';

async function main() {
  console.log('🔍 [Forensic Investigation]: Analyzing rounds, bets, and commissions today...');

  // 1. Overall Today Game Rounds
  const roundsToday = await query(`
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(platform_fee), 0) as total_fee,
      COALESCE(SUM(total_pot), 0) as total_pot,
      COALESCE(SUM(winner_payout), 0) as total_payout
    FROM game_rounds
    WHERE started_at >= CURRENT_DATE
  `);
  console.log('\n--- 1. Game Rounds Table (started_at >= CURRENT_DATE) ---');
  console.log(roundsToday.rows[0]);

  // 2. What tickets exist in game_tickets for today's rounds?
  const ticketsAnalysis = await query(`
    SELECT 
      COUNT(gt.id) as total_tickets_recorded,
      COALESCE(SUM(gt.bet_amount), 0) as total_bet_sum
    FROM game_tickets gt
    JOIN game_rounds gr ON gt.round_id = gr.id
    WHERE gr.started_at >= CURRENT_DATE
  `);
  console.log('\n--- 2. Tickets in game_tickets for today\'s rounds ---');
  console.log(ticketsAnalysis.rows[0]);

  // 3. Sample 5 rounds from today
  const sampleRounds = await query(`
    SELECT 
      id, room_id, round_number, phase, total_pot, platform_fee, winner_payout, started_at
    FROM game_rounds
    WHERE started_at >= CURRENT_DATE
    ORDER BY started_at DESC
    LIMIT 5
  `);
  console.log('\n--- 3. Latest 5 Rounds from Today ---');
  console.log(sampleRounds.rows);

  // 4. Check if standby bots in room-10 generate rounds automatically
  // In BingoGameEngine.ts:
  // When room 10 starts a round with 5 standby bots, does it insert into game_rounds?
  const botRounds = await query(`
    SELECT 
      gr.room_id,
      COUNT(gr.id) as rounds_count,
      COALESCE(SUM(gr.platform_fee), 0) as fee_sum,
      COALESCE(SUM(gr.total_pot), 0) as pot_sum
    FROM game_rounds gr
    WHERE gr.started_at >= CURRENT_DATE
    GROUP BY gr.room_id
  `);
  console.log('\n--- 4. Breakdown by Room ID Today ---');
  console.log(botRounds.rows);

  // 5. How many game_tickets belong to REAL users vs bot users today?
  const usersWhoBetted = await query(`
    SELECT 
      u.role,
      u.is_bot,
      COUNT(gt.id) as ticket_count,
      COALESCE(SUM(gt.bet_amount), 0) as total_bet
    FROM game_tickets gt
    JOIN game_rounds gr ON gt.round_id = gr.id
    JOIN users u ON gt.user_id = u.id
    WHERE gr.started_at >= CURRENT_DATE
    GROUP BY u.role, u.is_bot
  `);
  console.log('\n--- 5. Who placed the bets recorded in game_tickets today? ---');
  console.log(usersWhoBetted.rows);

  // 6. Real Human Cash Deductions (wallet_transactions with type = 'bet') today
  const realWalletBets = await query(`
    SELECT 
      wt.type,
      COUNT(wt.id) as tx_count,
      COALESCE(SUM(wt.amount), 0) as total_amount
    FROM wallet_transactions wt
    JOIN users u ON wt.user_id = u.id
    WHERE wt.created_at >= CURRENT_DATE
      AND u.role = 'player'
      AND (u.is_bot IS NULL OR u.is_bot = false)
    GROUP BY wt.type
  `);
  console.log('\n--- 6. Real Human Wallet Transactions (bets/wins) today ---');
  console.log(realWalletBets.rows);

  // 7. Check if any rounds today had NO tickets
  const emptyRounds = await query(`
    SELECT COUNT(*) as empty_rounds 
    FROM game_rounds 
    WHERE id NOT IN (SELECT DISTINCT round_id FROM game_tickets WHERE round_id IS NOT NULL)
      AND started_at >= CURRENT_DATE
  `);
  console.log('\n--- 7. Empty rounds without tickets today ---');
  console.log(emptyRounds.rows[0]);

  // 8. Rounds with real human tickets
  const roundsWithHuman = await query(`
    SELECT 
      COUNT(DISTINCT gr.id) as rounds_with_real_human_ticket,
      COALESCE(SUM(gr.platform_fee), 0) as total_fee_of_human_rounds
    FROM game_rounds gr
    JOIN game_tickets gt ON gr.id = gt.round_id
    JOIN users u ON gt.user_id = u.id
    WHERE gr.started_at >= CURRENT_DATE
      AND u.role = 'player'
      AND (u.is_bot IS NULL OR u.is_bot = false)
  `);
  console.log('\n--- 8. Rounds with Real Human Tickets today ---');
  console.log(roundsWithHuman.rows[0]);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
