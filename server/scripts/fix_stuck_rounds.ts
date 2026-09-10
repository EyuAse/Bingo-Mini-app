import dotenv from 'dotenv';
dotenv.config();
import { query } from '../db.ts';

async function healStuckRounds() {
  console.log('🩺 [Database Repair]: Scanning for unfinalized game_rounds in Neon DB...');

  const stuckRes = await query(`
    SELECT id, room_id, round_number, created_at
    FROM game_rounds
    WHERE phase = 'playing' AND ended_at IS NULL
    ORDER BY created_at ASC
  `);

  console.log(`Found ${stuckRes.rows.length} stuck rounds in 'playing' status.`);

  for (const round of stuckRes.rows) {
    console.log(`Fixing round ${round.id} (${round.room_id} #${round.round_number})...`);

    // Check if tickets exist for this round
    const ticketsRes = await query(`
      SELECT id, cartela_id, status FROM game_tickets WHERE round_id = $1
    `, [round.id]);

    // Mark round as ended
    await query(`
      UPDATE game_rounds
      SET phase = 'ended',
          ended_at = created_at + interval '2 minutes',
          winner_names = COALESCE(winner_names, '["House Bot"]'::jsonb),
          winner_cartelas = COALESCE(winner_cartelas, '[100]'::jsonb),
          winner_user_ids = COALESCE(winner_user_ids, '[]'::jsonb),
          drawn_numbers = COALESCE(drawn_numbers, '[]'::jsonb)
      WHERE id = $1
    `, [round.id]);

    // If tickets were still 'active', mark as 'lost'
    if (ticketsRes.rows.length > 0) {
      await query(`
        UPDATE game_tickets
        SET status = 'lost'
        WHERE round_id = $1 AND status = 'active'
      `, [round.id]);
    }
  }

  // Verification
  const verifyRes = await query(`
    SELECT phase, count(*) FROM game_rounds GROUP BY phase
  `);
  console.log('✅ Final game_rounds summary:', JSON.stringify(verifyRes.rows, null, 2));
}

async function main() {
  try {
    await healStuckRounds();
  } catch (err) {
    console.error('Error repairing stuck rounds:', err);
  } finally {
    process.exit(0);
  }
}

main();
