import dotenv from 'dotenv';
dotenv.config();
import { query } from '../db.ts';

async function main() {
  try {
    const usersRes = await query(`
      SELECT u.id, u.full_name, u.phone, u.role, u.is_bot,
        (SELECT count(*) FROM game_tickets gt WHERE gt.user_id = u.id) as ticket_count,
        (SELECT count(*) FROM wallet_transactions wt WHERE wt.user_id = u.id) as tx_count
      FROM users u
      ORDER BY ticket_count DESC, u.created_at DESC
    `);
    console.log('All Users:', JSON.stringify(usersRes.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
