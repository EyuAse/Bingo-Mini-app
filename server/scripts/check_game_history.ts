import dotenv from 'dotenv';
dotenv.config();
import { query } from '../db.ts';

async function testGameHistory(userId: string) {
  console.log(`Checking game history query for user ${userId}...`);
  const ticketsRes = await query(`
    SELECT 
      gt.id as ticket_id,
      gt.round_id,
      gt.cartela_id,
      gt.card_matrix,
      gt.bet_amount,
      gt.status as ticket_status,
      gt.created_at as bet_time,
      gr.room_id,
      gr.round_number,
      gr.phase,
      gr.drawn_numbers,
      gr.total_pot,
      gr.winner_payout,
      gr.winner_user_ids,
      gr.winner_cartelas,
      gr.winner_names,
      gr.ended_at,
      COALESCE(rm.name, gr.room_id) as room_name
    FROM game_tickets gt
    JOIN game_rounds gr ON gt.round_id = gr.id
    LEFT JOIN game_rooms rm ON gr.room_id = rm.id
    WHERE gt.user_id = $1
    ORDER BY gt.created_at DESC
    LIMIT 100
  `, [userId]);

  console.log(`Rows returned from SQL query: ${ticketsRes.rows.length}`);
  if (ticketsRes.rows.length > 0) {
    console.log('Sample row:', JSON.stringify(ticketsRes.rows[0], null, 2));
  }

  // Also check wallet_transactions for this user
  const txRes = await query(`
    SELECT type, amount, status, description, created_at
    FROM wallet_transactions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 10
  `, [userId]);
  console.log(`Recent transactions (${txRes.rows.length}):`, JSON.stringify(txRes.rows.slice(0, 5), null, 2));
}

async function testUserHistory(userId: string, userName: string) {
  try {
    const ticketsRes = await query(`
      SELECT 
        gt.id as ticket_id,
        gt.round_id,
        gt.cartela_id,
        gt.card_matrix,
        gt.bet_amount,
        gt.status as ticket_status,
        gt.created_at as bet_time,
        gr.room_id,
        gr.round_number,
        gr.phase,
        gr.drawn_numbers,
        gr.total_pot,
        gr.winner_payout,
        gr.winner_user_ids,
        gr.winner_cartelas,
        gr.winner_names,
        gr.ended_at,
        COALESCE(rm.name, gr.room_id) as room_name
      FROM game_tickets gt
      JOIN game_rounds gr ON gt.round_id = gr.id
      LEFT JOIN game_rooms rm ON gr.room_id = rm.id
      WHERE gt.user_id = $1
      ORDER BY gt.created_at DESC
      LIMIT 100
    `, [userId]);

    const roundsMap = new Map<string, any>();

    for (const row of ticketsRes.rows) {
      if (!roundsMap.has(row.round_id)) {
        const winnerUserIds = Array.isArray(row.winner_user_ids)
          ? row.winner_user_ids
          : (typeof row.winner_user_ids === 'string' ? JSON.parse(row.winner_user_ids || '[]') : []);
        const winnerCartelas = Array.isArray(row.winner_cartelas)
          ? row.winner_cartelas
          : (typeof row.winner_cartelas === 'string' ? JSON.parse(row.winner_cartelas || '[]') : []);
        const winnerNames = Array.isArray(row.winner_names)
          ? row.winner_names
          : (typeof row.winner_names === 'string' ? JSON.parse(row.winner_names || '[]') : []);
        const drawnNumbers = Array.isArray(row.drawn_numbers)
          ? row.drawn_numbers
          : (typeof row.drawn_numbers === 'string' ? JSON.parse(row.drawn_numbers || '[]') : []);

        roundsMap.set(row.round_id, {
          roundId: row.round_id,
          roomId: row.room_id,
          roomName: row.room_name,
          roundNumber: row.round_number,
          phase: row.phase,
          totalPot: parseFloat(row.total_pot || '0'),
          winnerPayout: parseFloat(row.winner_payout || '0'),
          winnerNames,
          winnerCartelas,
          winnerUserIds,
          drawnNumbers,
          endedAt: row.ended_at,
          betTime: row.bet_time,
          tickets: [],
          totalStake: 0,
          isWinner: false,
          userWonAmount: 0,
          netPnl: 0,
        });
      }

      const round = roundsMap.get(row.round_id);
      const betAmt = parseFloat(row.bet_amount || '0');
      round.totalStake += betAmt;

      const isWinningCartela = round.winnerCartelas.includes(row.cartela_id);
      if (isWinningCartela) {
        round.isWinner = true;
      }

      let cardMatrix = row.card_matrix;
      if (typeof cardMatrix === 'string') {
        try {
          cardMatrix = JSON.parse(cardMatrix);
        } catch {
          cardMatrix = [];
        }
      }

      round.tickets.push({
        id: row.ticket_id,
        cartelaId: row.cartela_id,
        cardMatrix,
        betAmount: betAmt,
        isWinner: isWinningCartela,
        status: row.ticket_status
      });
    }

    const rounds = Array.from(roundsMap.values());
    let totalGames = rounds.length;
    let totalWins = 0;
    let totalLosses = 0;
    let totalStaked = 0;
    let totalWon = 0;

    for (const r of rounds) {
      totalStaked += r.totalStake;
      if (r.winnerUserIds.includes(userId)) {
        r.isWinner = true;
      }

      if (r.isWinner) {
        totalWins++;
        const userWinningCartelaCount = r.tickets.filter((t: any) => t.isWinner).length;
        const totalWinningCards = r.winnerCartelas.length || 1;
        const perCard = r.winnerPayout / totalWinningCards;
        r.userWonAmount = (userWinningCartelaCount > 0 ? userWinningCartelaCount : 1) * perCard;
        totalWon += r.userWonAmount;
      } else {
        totalLosses++;
        r.userWonAmount = 0;
      }
      r.netPnl = r.userWonAmount - r.totalStake;
    }

    const netProfit = totalWon - totalStaked;
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 1000) / 10 : 0;

    console.log(`[${userName}] Games: ${totalGames}, Wins: ${totalWins}, Losses: ${totalLosses}, NetProfit: ${netProfit}`);
  } catch (err) {
    console.error(`ERROR for ${userName}:`, err);
  }
}

async function main() {
  await testUserHistory('73315c5b-4c84-4c69-917f-9d7deace5ad4', 'Eyu Ase');
  await testUserHistory('f6ef9c82-d67f-4264-a810-8cd76ac6138a', 'Test Friend');
  await testUserHistory('f6f72409-f94c-4b8f-ad46-4f3d773b4071', 'Meti Mety');
  process.exit(0);
}

main();
