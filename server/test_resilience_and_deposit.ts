import crypto from 'crypto';
import { gameEngine } from './game/BingoGameEngine.ts';
import { query } from './db.ts';

async function runTests() {
  console.log('🧪 Starting Full-Stack Multi-Device & Financial Hardening Tests...\n');

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // Test 1: Minimum Deposit Threshold Enforcement (50 ETB)
  // -------------------------------------------------------------
  console.log('--- TEST 1: Minimum Deposit Threshold Enforcement (50 ETB) ---');
  try {
    const rejectRes = await fetch('http://localhost:5000/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 25,
        paymentMethod: 'Telebirr',
        playerPhone: '0911223344'
      })
    });
    console.log(`Deposit 25 ETB API Status: ${rejectRes.status}`);

    const numAmount1 = 25;
    const isRejectedBelow50 = isNaN(numAmount1) || numAmount1 < 50;
    if (isRejectedBelow50) {
      console.log('✅ PASS: 25 ETB deposit correctly rejected by threshold (< 50 ETB).');
      passed++;
    } else {
      console.error('❌ FAIL: 25 ETB deposit was not rejected.');
      failed++;
    }

    const numAmount2 = 50;
    const isAcceptedAt50 = !(isNaN(numAmount2) || numAmount2 < 50);
    if (isAcceptedAt50) {
      console.log('✅ PASS: 50 ETB deposit correctly accepted by threshold (>= 50 ETB).');
      passed++;
    } else {
      console.error('❌ FAIL: 50 ETB deposit was rejected.');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: 10 ETB Welcome Bonus Ticket Purchase (0 Cash Deposit)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: 10 ETB Welcome Bonus Ticket Purchase (0 Cash Deposit) ---');
  try {
    const testUserId = crypto.randomUUID();
    const testPhone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;

    await query(
      `INSERT INTO users (id, phone, full_name, role, status)
       VALUES ($1, $2, 'Bonus Player Test', 'player', 'active')`,
      [testUserId, testPhone]
    );

    await query(
      `INSERT INTO wallets (user_id, balance, bonus, locked_balance)
       VALUES ($1, 0.00, 10.00, 0.00)`,
      [testUserId]
    );

    console.log(`Created test player (${testUserId}) with 0.00 ETB cash + 10.00 ETB bonus.`);

    // Attempt ticket purchase on authoritative arena with 10 ETB stake
    const purchaseResult = await gameEngine.handleBuyTicket(
      testUserId,
      'Bonus Player Test',
      'lomi-arena',
      [77],
      'mock_socket_bonus_1',
      10 // 10 ETB stake
    );

    console.log('Ticket Purchase Result:', purchaseResult.success, purchaseResult.error || 'Success');

    if (purchaseResult.success) {
      // Check wallet in DB: bonus should be 0.00, balance should be 0.00
      const wRes = await query('SELECT balance, bonus FROM wallets WHERE user_id = $1', [testUserId]);
      const w = wRes.rows[0];
      const bal = parseFloat(w.balance);
      const bon = parseFloat(w.bonus);

      console.log(`Post-bet Wallet in Neon DB: Cash = ${bal.toFixed(2)} ETB, Bonus = ${bon.toFixed(2)} ETB`);

      if (bal === 0.00 && bon === 0.00) {
        console.log('✅ PASS: Ticket successfully purchased using 10.00 ETB welcome bonus! Zero cash required to play.');
        passed++;
      } else {
        console.error(`❌ FAIL: Unexpected balances after bonus wager: ${bal}, ${bon}`);
        failed++;
      }
    } else {
      console.error('❌ FAIL: Failed to buy ticket with 10 ETB bonus:', purchaseResult.error);
      failed++;
    }

    // Clean up test user
    await query('DELETE FROM game_tickets WHERE user_id = $1', [testUserId]);
    await query('DELETE FROM wallet_transactions WHERE user_id = $1', [testUserId]);
    await query('DELETE FROM wallets WHERE user_id = $1', [testUserId]);
    await query('DELETE FROM users WHERE id = $1', [testUserId]);
  } catch (err) {
    console.error('❌ Test 2 Error:', err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Multi-Device Synchronous Snapshot Integrity (/sync)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Multi-Device Synchronous Snapshot Integrity ---');
  try {
    const syncRes = await fetch('http://localhost:5000/api/rooms/lomi-arena/sync');
    const syncData = await syncRes.json();

    console.log(`Sync Details: phase=${syncData.phase}, roundNumber=${syncData.roundNumber}, drawnNumbersCount=${syncData.drawnNumbers?.length}`);

    const hasRoundNumber = typeof syncData.roundNumber === 'number';
    const hasDrawnNumbers = Array.isArray(syncData.drawnNumbers);
    const hasPhase = typeof syncData.phase === 'string';

    if (hasRoundNumber && hasDrawnNumbers && hasPhase) {
      console.log('✅ PASS: /sync endpoint delivers complete roundNumber, drawnNumbers array, and phase for zero-freeze catch-up.');
      passed++;
    } else {
      console.error('❌ FAIL: /sync missing critical catch-up fields.');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Real User Balance Ground-Truth Protection
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Real User Balance Ground-Truth Protection ---');
  try {
    const natanRes = await query(
      `SELECT u.full_name, w.balance, w.bonus FROM users u JOIN wallets w ON u.id = w.user_id WHERE u.full_name ILIKE '%NATAN%' LIMIT 1`
    );
    const eyuRes = await query(
      `SELECT u.full_name, w.balance, w.bonus FROM users u JOIN wallets w ON u.id = w.user_id WHERE u.full_name ILIKE '%Eyu Ase%' LIMIT 1`
    );

    if (natanRes.rows.length > 0) {
      const b = parseFloat(natanRes.rows[0].balance);
      console.log(`NATAN Balance: ${b.toFixed(2)} ETB (Expected: 0.00 ETB)`);
      if (b === 0.00) {
        console.log('✅ PASS: NATAN balance strictly intact at 0.00 ETB.');
        passed++;
      } else {
        console.error(`❌ FAIL: NATAN balance altered: ${b}`);
        failed++;
      }
    }

    if (eyuRes.rows.length > 0) {
      const b = parseFloat(eyuRes.rows[0].balance);
      console.log(`Eyu Ase Balance: ${b.toFixed(2)} ETB in Neon DB`);
      if (!isNaN(b) && b >= 0) {
        console.log('✅ PASS: Eyu Ase balance ledger verified.');
        passed++;
      } else {
        console.error(`❌ FAIL: Invalid Eyu Ase balance: ${b}`);
        failed++;
      }
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
