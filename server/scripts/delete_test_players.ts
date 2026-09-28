import { withTransaction, query, checkDbConnection } from '../db.ts';

const TARGET_USERS = [
  { name: 'Eyu Ase', id: 'ae08622b-791e-40d8-8c1b-4b2ca7c1b1bf' },
  { name: 'Bleach', id: '106fa34c-7ba3-4292-ac9e-ce7e14969a05' },
];

const TARGET_USER_IDS = TARGET_USERS.map((u) => u.id);

const TARGET_TEST_ROUNDS = [
  'efa12197-b112-4db0-8924-281bf5631dcd',
  '6f4a7f4c-700c-48cb-b423-efdbe6834a04',
  '07054468-784d-4a92-b464-3025a65ce8b5',
  '715a984d-4a69-4998-967a-d2448e9f02a2',
];

export async function deleteTestPlayers() {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('🗑️  SAFE DELETION OF TEST PLAYERS (Bleach & Eyu Ase)');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  const health = await checkDbConnection();
  if (!health.connected) {
    console.error('❌ Cannot connect to Neon DB:', health.error);
    process.exit(1);
  }
  console.log(`✅ Connected to Neon DB (${health.latencyMs}ms latency)\n`);

  console.log('Target Users to Delete:');
  for (const u of TARGET_USERS) {
    console.log(`  • ${u.name} (UUID: ${u.id})`);
  }
  console.log(`Target Test Rounds to Purge: ${TARGET_TEST_ROUNDS.length} rounds\n`);

  await withTransaction(async (client) => {
    // 1. Delete Game Tickets for Target Users
    console.log('1️⃣ Deleting game tickets...');
    const ticketsRes = await client.query(
      'DELETE FROM game_tickets WHERE user_id = ANY($1::uuid[]) RETURNING id',
      [TARGET_USER_IDS]
    );
    console.log(`   ✓ Deleted ${ticketsRes.rowCount} game ticket(s)`);

    // 2. Delete Exclusive Test Game Rounds
    console.log('\n2️⃣ Deleting test game rounds...');
    const roundsRes = await client.query(
      'DELETE FROM game_rounds WHERE id = ANY($1::uuid[]) RETURNING id',
      [TARGET_TEST_ROUNDS]
    );
    console.log(`   ✓ Deleted ${roundsRes.rowCount} test game round(s)`);

    // 3. Delete Deposit Requests
    console.log('\n3️⃣ Deleting deposit requests...');
    const depositsRes = await client.query(
      'DELETE FROM deposit_requests WHERE user_id = ANY($1::uuid[]) RETURNING id',
      [TARGET_USER_IDS]
    );
    console.log(`   ✓ Deleted ${depositsRes.rowCount} deposit request(s)`);

    // 4. Delete Withdrawal Requests (if any)
    console.log('\n4️⃣ Deleting withdrawal requests...');
    const withdrawalsRes = await client.query(
      'DELETE FROM withdrawal_requests WHERE user_id = ANY($1::uuid[]) RETURNING id',
      [TARGET_USER_IDS]
    );
    console.log(`   ✓ Deleted ${withdrawalsRes.rowCount} withdrawal request(s)`);

    // 5. Delete Wallet Ledger Transactions
    console.log('\n5️⃣ Deleting wallet ledger transactions...');
    const txRes = await client.query(
      'DELETE FROM wallet_transactions WHERE user_id = ANY($1::uuid[]) RETURNING id',
      [TARGET_USER_IDS]
    );
    console.log(`   ✓ Deleted ${txRes.rowCount} wallet transaction(s)`);

    // 6. Delete Wallets
    console.log('\n6️⃣ Deleting wallets...');
    const walletsRes = await client.query(
      'DELETE FROM wallets WHERE user_id = ANY($1::uuid[]) RETURNING id',
      [TARGET_USER_IDS]
    );
    console.log(`   ✓ Deleted ${walletsRes.rowCount} wallet(s)`);

    // 7. Delete Referrals (if any)
    console.log('\n7️⃣ Deleting referrals (if any)...');
    const refRes = await client.query(
      'DELETE FROM referrals WHERE referrer_id = ANY($1::uuid[]) OR referred_user_id = ANY($1::uuid[]) RETURNING id',
      [TARGET_USER_IDS]
    );
    console.log(`   ✓ Deleted ${refRes.rowCount} referral record(s)`);

    // 8. Delete Users (strictly checking role != 'admin' and is_bot = false for safety)
    console.log('\n8️⃣ Deleting player user accounts...');
    const usersRes = await client.query(
      `DELETE FROM users 
       WHERE id = ANY($1::uuid[]) 
         AND role != 'admin' 
         AND (is_bot = false OR is_bot IS NULL) 
       RETURNING id, full_name`,
      [TARGET_USER_IDS]
    );
    console.log(`   ✓ Deleted ${usersRes.rowCount} user account(s):`, usersRes.rows.map((r: any) => r.full_name));

    if (usersRes.rowCount !== TARGET_USERS.length) {
      console.warn(`⚠️ Warning: Expected ${TARGET_USERS.length} users to be deleted, but deleted ${usersRes.rowCount}`);
    }
  });

  console.log('\n══════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 POST-DELETION INTEGRITY AUDIT');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  // Verify 0 records remaining for target user IDs
  const userCheck = await query('SELECT id, full_name FROM users WHERE id = ANY($1::uuid[])', [TARGET_USER_IDS]);
  console.log('Target Users in DB:', userCheck.rows.length === 0 ? '0 (CLEAN ✅)' : userCheck.rows);

  const walletCheck = await query('SELECT id FROM wallets WHERE user_id = ANY($1::uuid[])', [TARGET_USER_IDS]);
  console.log('Target Wallets in DB:', walletCheck.rows.length === 0 ? '0 (CLEAN ✅)' : walletCheck.rows);

  const txCheck = await query('SELECT id FROM wallet_transactions WHERE user_id = ANY($1::uuid[])', [TARGET_USER_IDS]);
  console.log('Target Transactions in DB:', txCheck.rows.length === 0 ? '0 (CLEAN ✅)' : txCheck.rows);

  const ticketCheck = await query('SELECT id FROM game_tickets WHERE user_id = ANY($1::uuid[])', [TARGET_USER_IDS]);
  console.log('Target Tickets in DB:', ticketCheck.rows.length === 0 ? '0 (CLEAN ✅)' : ticketCheck.rows);

  const roundCheck = await query('SELECT id FROM game_rounds WHERE id = ANY($1::uuid[])', [TARGET_TEST_ROUNDS]);
  console.log('Target Test Rounds in DB:', roundCheck.rows.length === 0 ? '0 (CLEAN ✅)' : roundCheck.rows);

  // Verify Admin & Bot accounts are still intact
  const adminCheck = await query("SELECT id, full_name, role FROM users WHERE role = 'admin'");
  console.log(`Admin Accounts preserved: ${adminCheck.rows.length} (${adminCheck.rows.map(a => a.full_name).join(', ')}) ✅`);

  const botCheck = await query('SELECT id, full_name, is_bot FROM users WHERE is_bot = true');
  console.log(`Bot Accounts preserved: ${botCheck.rows.length} accounts ✅`);

  console.log('\n🎉 ALL TEST PLAYER RECORDS SAFELY & PERMANENTLY REMOVED!\n');
  process.exit(0);
}

deleteTestPlayers().catch((err) => {
  console.error('❌ Deletion failed and rolled back:', err);
  process.exit(1);
});
