import { query } from '../db.ts';

async function main() {
  console.log('🔍 [Forensic Audit]: Analyzing deposit_requests table in Neon DB...\n');

  // 1. Group by status
  const statusBreakdown = await query(`
    SELECT 
      status,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_amount
    FROM deposit_requests
    GROUP BY status
  `);
  console.log('--- 1. Deposit Requests Grouped By Status ---');
  console.log(statusBreakdown.rows);

  // 2. Sample 5 Approved Deposits
  const approved = await query(`
    SELECT 
      d.id,
      u.full_name as user_name,
      d.amount,
      d.payment_method,
      d.status,
      d.transaction_ref,
      d.created_at,
      d.reviewed_at
    FROM deposit_requests d
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.status = 'approved'
    ORDER BY d.created_at DESC
    LIMIT 5
  `);
  console.log('\n--- 2. Sample Latest Approved Deposits ---');
  console.log(approved.rows);

  // 3. Rejected summary
  const rejectedCount = await query(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
    FROM deposit_requests 
    WHERE status = 'rejected'
  `);
  console.log('\n--- 3. Rejected Deposits Summary ---');
  console.log(rejectedCount.rows[0]);

  // 4. Pending summary
  const pendingCount = await query(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
    FROM deposit_requests 
    WHERE status = 'pending'
  `);
  console.log('\n--- 4. Pending Deposits Summary ---');
  console.log(pendingCount.rows[0]);

  // 5. Approved Today vs All Time
  const approvedToday = await query(`
    SELECT 
      COUNT(*) as count, 
      COALESCE(SUM(amount), 0) as total_amount 
    FROM deposit_requests 
    WHERE status = 'approved' 
      AND reviewed_at >= CURRENT_DATE
  `);
  console.log('\n--- 5. Approved TODAY (reviewed_at >= CURRENT_DATE) ---');
  console.log(approvedToday.rows[0]);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
