import { query } from '../db.ts';

async function main() {
  const maxRes = await query('SELECT MAX(id) as max_id, COUNT(*) as cnt FROM telegram_broadcasts');
  const seqRes = await query("SELECT last_value FROM pg_sequences WHERE sequencename = 'telegram_broadcasts_id_seq'");
  const allRows = await query('SELECT id, title, created_at FROM telegram_broadcasts ORDER BY id ASC');

  console.log('--- telegram_broadcasts Table Stats ---');
  console.log('Max ID in table:', maxRes.rows[0].max_id);
  console.log('Total count in table:', maxRes.rows[0].cnt);
  console.log('Sequence last_value in pg_sequences:', seqRes.rows[0]?.last_value);
  console.log('Existing IDs:', allRows.rows.map(r => r.id));

  // Check all sequences
  const allSeqs = await query(`
    SELECT sequencename, last_value 
    FROM pg_sequences 
    ORDER BY sequencename;
  `);
  console.log('\n--- All Database Sequences ---');
  for (const s of allSeqs.rows) {
    console.log(`Sequence: ${s.sequencename} -> last_value: ${s.last_value}`);
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
