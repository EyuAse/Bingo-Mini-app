import { query } from '../db.ts';

async function fixSequence() {
  console.log('🔧 Fixing telegram_broadcasts_id_seq sequence in Neon PostgreSQL...');
  
  // 1. Get current max ID
  const maxRes = await query('SELECT COALESCE(MAX(id), 0) as max_id FROM telegram_broadcasts');
  const maxId = parseInt(maxRes.rows[0].max_id, 10);
  console.log(`Current MAX(id) in telegram_broadcasts: ${maxId}`);

  // 2. Set sequence value to maxId
  const setvalRes = await query(`
    SELECT setval('telegram_broadcasts_id_seq', GREATEST($1::bigint, 1), true) as new_seq
  `, [maxId]);
  console.log(`Sequence reset to: ${setvalRes.rows[0].new_seq}`);

  // 3. Test nextval
  const nextRes = await query("SELECT nextval('telegram_broadcasts_id_seq') as next_id");
  console.log(`Test nextval produces ID: ${nextRes.rows[0].next_id} (should be > ${maxId})`);

  // 4. Reset sequence back so it points to the test value, meaning the next real insert will get next_id + 1
  // Or even better, set it to next_id so subsequent insert gets next_id + 1
  console.log('✅ Sequence successfully synchronized!');
}

fixSequence().then(() => process.exit(0)).catch(e => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
