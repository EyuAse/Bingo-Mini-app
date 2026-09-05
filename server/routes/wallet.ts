import { Router } from 'express';
import { query, withTransaction } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { io } from '../server.ts';

const router = Router();

/**
 * Get User Live Wallet Balance from Neon DB
 */
router.get('/balance', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const walletRes = await query(
      'SELECT balance, bonus, locked_balance, currency FROM wallets WHERE user_id = $1',
      [userId]
    );

    if (walletRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    const w = walletRes.rows[0];
    return res.json({
      success: true,
      balance: parseFloat(w.balance || '0'),
      bonus: parseFloat(w.bonus || '0'),
      lockedBalance: parseFloat(w.locked_balance || '0'),
      currency: w.currency || 'ETB'
    });
  } catch (error: any) {
    console.error('❌ [Wallet Balance Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve balance' });
  }
});

/**
 * Submit Deposit Request (Telebirr / CBE)
 */
router.post('/deposit', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { amount, paymentMethod, playerPhone, transactionRef, receiptImage } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 50) {
      return res.status(400).json({ success: false, error: 'Minimum deposit is 50 ETB.' });
    }

    if (!paymentMethod || !['Telebirr', 'CBE'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: 'Payment method must be Telebirr or CBE.' });
    }

    if (!playerPhone || playerPhone.trim().length < 8) {
      return res.status(400).json({ success: false, error: 'Valid phone number is required.' });
    }

    const cleanRef = transactionRef?.trim() || `TX-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;

    // Check for duplicate reference
    const checkDuplicate = await query(
      'SELECT id FROM deposit_requests WHERE transaction_ref = $1',
      [cleanRef]
    );

    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'A deposit with this transaction reference already exists.' });
    }

    const insertRes = await query(
      `INSERT INTO deposit_requests (user_id, amount, payment_method, player_phone, transaction_ref, receipt_image, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [userId, numAmount, paymentMethod, playerPhone.trim(), cleanRef, receiptImage || null]
    );

    const deposit = insertRes.rows[0];

    // Notify Connected Admin/Cashier in real-time
    io.emit('admin_new_deposit', {
      id: deposit.id,
      userId,
      userName: req.user!.fullName,
      phone: playerPhone,
      amount: numAmount,
      method: paymentMethod,
      reference: cleanRef,
      createdAt: deposit.created_at
    });

    return res.json({
      success: true,
      message: 'Deposit submitted successfully. Cashier will verify shortly.',
      deposit: {
        id: deposit.id,
        amount: numAmount,
        paymentMethod,
        transactionRef: cleanRef,
        status: 'pending',
        createdAt: deposit.created_at
      }
    });
  } catch (error: any) {
    console.error('❌ [Wallet Deposit Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Deposit submission failed' });
  }
});

/**
 * Submit Withdrawal Request with Atomic Balance Lock
 */
router.post('/withdraw', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { amount, paymentMethod, accountPhone, accountName } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 50) {
      return res.status(400).json({ success: false, error: 'Minimum withdrawal amount is 50 ETB.' });
    }

    if (!paymentMethod || !['Telebirr', 'CBE'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: 'Payment method must be Telebirr or CBE.' });
    }

    if (!accountPhone || accountPhone.trim().length < 8) {
      return res.status(400).json({ success: false, error: 'Valid account phone/number is required.' });
    }

    // Execute withdrawal deduction with ACID row-lock on wallet
    const result = await withTransaction(async (client) => {
      // 1. Lock wallet row for update
      const walletRes = await client.query(
        'SELECT balance, bonus FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      if (walletRes.rows.length === 0) {
        throw new Error('Wallet not found.');
      }

      const currentBalance = parseFloat(walletRes.rows[0].balance);
      if (currentBalance < numAmount) {
        throw new Error(`Insufficient balance. Available: ${currentBalance.toFixed(2)} ETB`);
      }

      const newBalance = currentBalance - numAmount;

      // 2. Deduct balance
      await client.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
        [newBalance, userId]
      );

      // 3. Create withdrawal request
      const withdrawRes = await client.query(
        `INSERT INTO withdrawal_requests (user_id, amount, payment_method, account_phone, account_name, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [userId, numAmount, paymentMethod, accountPhone.trim(), accountName || req.user!.fullName]
      );

      // 4. Record pending transaction in ledger
      const txRef = `WD-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, payment_method, description)
         VALUES ($1, 'withdrawal', $2, $3, $4, 'pending', $5, $6)`,
        [userId, numAmount, newBalance, txRef, paymentMethod, `Withdrawal to ${paymentMethod} (${accountPhone})`]
      );

      return {
        withdrawal: withdrawRes.rows[0],
        newBalance
      };
    });

    // Notify Connected Admin/Cashier in real-time
    io.emit('admin_new_withdrawal', {
      id: result.withdrawal.id,
      userId,
      userName: req.user!.fullName,
      phone: accountPhone,
      amount: numAmount,
      method: paymentMethod,
      createdAt: result.withdrawal.created_at
    });

    return res.json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      newBalance: result.newBalance,
      withdrawal: result.withdrawal
    });
  } catch (error: any) {
    console.error('❌ [Wallet Withdraw Error]:', error);
    return res.status(400).json({ success: false, error: error.message || 'Withdrawal failed' });
  }
});

/**
 * Get User Transaction History (Unified Deposits, Withdrawals & Ledger)
 */
router.get('/transactions', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // 1. Fetch deposit requests
    const depRes = await query(
      `SELECT id, amount, payment_method, player_phone, transaction_ref, receipt_image, status, created_at, reviewed_at
       FROM deposit_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    // 2. Fetch withdrawal requests
    const withRes = await query(
      `SELECT id, amount, payment_method, account_phone, account_name, status, created_at, reviewed_at
       FROM withdrawal_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    // 3. Fetch completed wallet ledger entries
    const txRes = await query(
      `SELECT id, type, amount, balance_after, reference_code, status, payment_method, description, created_at
       FROM wallet_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    const deposits = depRes.rows.map(d => ({
      id: d.id,
      userId,
      userName: req.user!.fullName,
      phone: d.player_phone,
      accountNumber: d.player_phone,
      type: 'deposit' as const,
      amount: parseFloat(d.amount),
      method: d.payment_method,
      referenceNumber: d.transaction_ref,
      receiptImage: d.receipt_image,
      status: d.status as 'pending' | 'approved' | 'rejected',
      createdAt: d.created_at,
      timestamp: d.created_at
    }));

    const withdrawals = withRes.rows.map(w => ({
      id: w.id,
      userId,
      userName: w.account_name || req.user!.fullName,
      phone: w.account_phone,
      accountNumber: w.account_phone,
      type: 'withdrawal' as const,
      amount: parseFloat(w.amount),
      method: w.payment_method,
      referenceNumber: `WD-${w.payment_method.toUpperCase()}-${w.id.slice(0, 8)}`,
      receiptImage: undefined,
      status: w.status as 'pending' | 'approved' | 'rejected',
      createdAt: w.created_at,
      timestamp: w.created_at
    }));

    const ledger = txRes.rows.map(t => ({
      id: t.id,
      userId,
      userName: req.user!.fullName,
      phone: req.user!.phone || '',
      accountNumber: req.user!.phone || '',
      type: t.type,
      amount: parseFloat(t.amount),
      method: t.payment_method || 'System',
      referenceNumber: t.reference_code,
      status: t.status,
      description: t.description,
      createdAt: t.created_at,
      timestamp: t.created_at
    }));

    // Combine and sort by createdAt DESC
    const all = [...deposits, ...withdrawals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json({
      success: true,
      transactions: all,
      ledger
    });
  } catch (error: any) {
    console.error('❌ [Wallet Transactions Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve transaction history' });
  }
});

export default router;
