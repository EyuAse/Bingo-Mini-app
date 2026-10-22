import { query } from '../db.ts';

async function main() {
  console.log('🔍 [Neon Bandwidth Audit]: Measuring network payload sizes...\n');

  // 1. Receipt images in deposit_requests
  const receipts = await query(`
    SELECT 
      COUNT(*) as count,
      ROUND(AVG(LENGTH(receipt_image)) / 1024, 2) as avg_kb,
      ROUND(MAX(LENGTH(receipt_image)) / 1024, 2) as max_kb,
      ROUND(SUM(LENGTH(receipt_image)) / 1024 / 1024, 2) as total_mb
    FROM deposit_requests 
    WHERE receipt_image IS NOT NULL AND receipt_image != ''
  `);
  console.log('1. Deposit Receipt Images in DB:');
  console.log(receipts.rows[0]);

  // 2. Average payload size of 1 call to GET /api/admin/deposits
  const depQuerySize = await query(`
    SELECT 
      ROUND(SUM(LENGTH(d.receipt_image)) / 1024 / 1024, 2) as query_mb
    FROM (
      SELECT receipt_image FROM deposit_requests ORDER BY created_at DESC LIMIT 100
    ) d
    WHERE d.receipt_image IS NOT NULL
  `);
  console.log('\n2. Single execution of GET /api/admin/deposits (LIMIT 100):');
  console.log(`Transfers: ${depQuerySize.rows[0].query_mb} MB per call!`);

  // 3. Card matrix in game_tickets
  const tickets = await query(`
    SELECT 
      COUNT(*) as count,
      ROUND(AVG(LENGTH(card_matrix::text)), 2) as avg_bytes,
      ROUND(SUM(LENGTH(card_matrix::text)) / 1024 / 1024, 2) as total_mb
    FROM game_tickets
    WHERE card_matrix IS NOT NULL
  `);
  console.log('\n3. game_tickets card_matrix JSON payload:');
  console.log(tickets.rows[0]);

  // 4. Table sizes in Neon DB
  const tableSizes = await query(`
    SELECT 
      relname as table_name,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size,
      pg_total_relation_size(relid) as bytes
    FROM pg_catalog.pg_statio_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
  `);
  console.log('\n4. Table Disk Sizes in Neon:');
  console.log(tableSizes.rows);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
