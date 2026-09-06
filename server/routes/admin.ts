import { Router } from 'express';
import { query, withTransaction } from '../db.ts';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';
import { io } from '../server.ts';
import { gameEngine } from '../game/BingoGameEngine.ts';

const router = Router();

/**
 * Get All Real Users from Neon DB
 */
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const usersRes = await query(`
      SELECT 
        u.id,
        u.full_name as name,
        COALESCE(u.phone, CONCAT('09', RIGHT(CAST(u.telegram_id AS TEXT), 8))) as phone,
        u.telegram_username,
        u.telegram_id,
        COALESCE(w.balance, 0.00) as balance,
        COALESCE(w.bonus, 0.00) as bonus,
        u.status,
        u.role,
        u.created_at as "createdAt",
        COALESCE((SELECT SUM(amount) FROM deposit_requests WHERE user_id = u.id AND status = 'approved'), 0) as "totalDeposited",
        COALESCE((SELECT SUM(amount) FROM withdrawal_requests WHERE user_id = u.id AND status = 'approved'), 0) as "totalWithdrawn"
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE u.role != 'admin' AND (u.is_bot IS NULL OR u.is_bot = false)
      ORDER BY u.created_at DESC
      LIMIT 200
    `);

    const formatted = usersRes.rows.map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      telegramUsername: u.telegram_username,
      telegramId: u.telegram_id,
      balance: parseFloat(u.balance),
      bonus: parseFloat(u.bonus),
      referralCount: 0,
      totalDeposited: parseFloat(u.totalDeposited),
      totalWithdrawn: parseFloat(u.totalWithdrawn),
      status: u.status,
      role: u.role,
      createdAt: u.createdAt
    }));

    return res.json({ success: true, users: formatted });
  } catch (error: any) {
    console.error('❌ [Admin Users Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
});

/**
 * Get All Deposit Requests (Admin/Cashier View)
 */
router.get('/deposits', requireAdmin, async (_req, res) => {
  try {
    const depositRes = await query(`
      SELECT d.*, u.full_name as user_name, u.phone as user_phone, u.telegram_username
      FROM deposit_requests d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 100
    `);

    const formatted = depositRes.rows.map(d => ({
      id: d.id,
      userId: d.user_id,
      userName: d.user_name,
      userPhone: d.user_phone || d.player_phone,
      telegramUsername: d.telegram_username,
      amount: parseFloat(d.amount),
      paymentMethod: d.payment_method,
      playerPhone: d.player_phone,
      transactionRef: d.transaction_ref,
      receiptImage: d.receipt_image,
      status: d.status,
      adminNotes: d.admin_notes,
      reviewedAt: d.reviewed_at,
      createdAt: d.created_at
    }));

    return res.json({ success: true, deposits: formatted });
  } catch (error: any) {
    console.error('❌ [Admin Deposits Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve deposits' });
  }
});

/**
 * Approve Deposit & Credit User Balance Atomically
 */
router.post('/deposits/:id/approve', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const depositId = req.params.id;
    const adminId = req.user!.id;

    const result = await withTransaction(async (client) => {
      // 1. Lock deposit row
      const depRes = await client.query(
        'SELECT * FROM deposit_requests WHERE id = $1 FOR UPDATE',
        [depositId]
      );

      if (depRes.rows.length === 0) {
        throw new Error('Deposit request not found.');
      }

      const deposit = depRes.rows[0];
      if (deposit.status !== 'pending') {
        throw new Error(`Deposit has already been ${deposit.status}.`);
      }

      const amount = parseFloat(deposit.amount);

      // 2. Lock and credit player's wallet
      const walletRes = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [deposit.user_id]
      );

      if (walletRes.rows.length === 0) {
        throw new Error('Player wallet not found.');
      }

      const currentBalance = parseFloat(walletRes.rows[0].balance);
      const newBalance = currentBalance + amount;

      await client.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
        [newBalance, deposit.user_id]
      );

      // 3. Mark deposit approved
      await client.query(
        `UPDATE deposit_requests 
         SET status = 'approved', reviewed_by = $1, reviewed_at = NOW() 
         WHERE id = $2`,
        [adminId, depositId]
      );

      // 4. Create completed transaction in ledger
      await client.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, payment_method, description)
         VALUES ($1, 'deposit', $2, $3, $4, 'completed', $5, $6)`,
        [
          deposit.user_id,
          amount,
          newBalance,
          deposit.transaction_ref,
          deposit.payment_method,
          `Deposit approved via ${deposit.payment_method} (${deposit.transaction_ref})`
        ]
      );

      return {
        userId: deposit.user_id,
        amount,
        newBalance,
        ref: deposit.transaction_ref
      };
    });

    // Notify the user in real-time over WebSocket
    io.emit(`user_${result.userId}_balance`, {
      type: 'deposit_approved',
      amount: result.amount,
      newBalance: result.newBalance,
      reference: result.ref
    });

    io.emit('user_balance_updated', {
      userId: result.userId,
      amount: result.amount,
      newBalance: result.newBalance
    });

    // Broadcast generic update for admin dashboard
    io.emit('deposit_status_updated', { id: depositId, status: 'approved' });

    return res.json({
      success: true,
      message: `Deposit of ${result.amount} ETB successfully approved.`,
      newBalance: result.newBalance
    });
  } catch (error: any) {
    console.error('❌ [Admin Approve Deposit Error]:', error);
    return res.status(400).json({ success: false, error: error.message || 'Deposit approval failed' });
  }
});

/**
 * Reject Deposit Request
 */
router.post('/deposits/:id/reject', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const depositId = req.params.id;
    const adminId = req.user!.id;
    const { reason } = req.body;

    const depRes = await query('SELECT * FROM deposit_requests WHERE id = $1', [depositId]);
    if (depRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deposit request not found.' });
    }

    const deposit = depRes.rows[0];
    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Deposit has already been ${deposit.status}.` });
    }

    await query(
      `UPDATE deposit_requests 
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), admin_notes = $2 
       WHERE id = $3`,
      [adminId, reason || 'Transaction could not be verified by Cashier', depositId]
    );

    io.emit('deposit_status_updated', { id: depositId, status: 'rejected' });

    return res.json({ success: true, message: 'Deposit request rejected.' });
  } catch (error: any) {
    console.error('❌ [Admin Reject Deposit Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to reject deposit' });
  }
});

/**
 * Get All Withdrawal Requests
 */
router.get('/withdrawals', requireAdmin, async (_req, res) => {
  try {
    const withdrawRes = await query(`
      SELECT w.*, u.full_name as user_name, u.phone as user_phone, u.telegram_username
      FROM withdrawal_requests w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
      LIMIT 100
    `);

    const formatted = withdrawRes.rows.map(w => ({
      id: w.id,
      userId: w.user_id,
      userName: w.user_name,
      userPhone: w.user_phone || w.account_phone,
      telegramUsername: w.telegram_username,
      amount: parseFloat(w.amount),
      paymentMethod: w.payment_method,
      accountPhone: w.account_phone,
      accountName: w.account_name,
      status: w.status,
      reviewedAt: w.reviewed_at,
      createdAt: w.created_at
    }));

    return res.json({ success: true, withdrawals: formatted });
  } catch (error: any) {
    console.error('❌ [Admin Withdrawals Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve withdrawals' });
  }
});

/**
 * Approve/Complete Withdrawal
 */
router.post('/withdrawals/:id/approve', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const withdrawalId = req.params.id;
    const adminId = req.user!.id;

    await query(
      `UPDATE withdrawal_requests 
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW() 
       WHERE id = $2`,
      [adminId, withdrawalId]
    );

    io.emit('withdrawal_status_updated', { id: withdrawalId, status: 'approved' });

    return res.json({ success: true, message: 'Withdrawal marked as completed/sent.' });
  } catch (error: any) {
    console.error('❌ [Admin Approve Withdrawal Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to approve withdrawal' });
  }
});

/**
 * Reject Withdrawal and Refund Balance to User's Wallet
 */
router.post('/withdrawals/:id/reject', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const withdrawalId = req.params.id;
    const adminId = req.user!.id;
    const { reason } = req.body;

    const result = await withTransaction(async (client) => {
      const wRes = await client.query(
        'SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE',
        [withdrawalId]
      );

      if (wRes.rows.length === 0) {
        throw new Error('Withdrawal request not found.');
      }

      const withdrawal = wRes.rows[0];
      if (withdrawal.status !== 'pending') {
        throw new Error(`Withdrawal has already been ${withdrawal.status}.`);
      }

      const amount = parseFloat(withdrawal.amount);

      // Refund balance to user
      const walletRes = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [withdrawal.user_id]
      );

      const currentBalance = parseFloat(walletRes.rows[0].balance);
      const newBalance = currentBalance + amount;

      await client.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
        [newBalance, withdrawal.user_id]
      );

      // Mark rejected
      await client.query(
        `UPDATE withdrawal_requests 
         SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW() 
         WHERE id = $2`,
        [adminId, withdrawalId]
      );

      // Record refund in ledger
      await client.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, payment_method, description)
         VALUES ($1, 'refund', $2, $3, $4, 'completed', $5, $6)`,
        [
          withdrawal.user_id,
          amount,
          newBalance,
          `REFUND-WD-${Date.now().toString().slice(-6)}`,
          withdrawal.payment_method,
          `Withdrawal rejected: ${reason || 'Invalid account details'}. Funds refunded.`
        ]
      );

      return {
        userId: withdrawal.user_id,
        amount,
        newBalance
      };
    });

    // Notify user over WebSocket
    io.emit(`user_${result.userId}_balance`, {
      type: 'withdrawal_refunded',
      amount: result.amount,
      newBalance: result.newBalance
    });

    io.emit('withdrawal_status_updated', { id: withdrawalId, status: 'rejected' });

    return res.json({ success: true, message: 'Withdrawal rejected and amount refunded to user wallet.' });
  } catch (error: any) {
    console.error('❌ [Admin Reject Withdrawal Error]:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to reject withdrawal' });
  }
});

/**
 * Platform Analytics & Real-Time Stats
 */
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const userCountRes = await query("SELECT COUNT(*) as count FROM users WHERE role = 'player'");
    const depositSumRes = await query("SELECT COALESCE(SUM(amount), 0) as total FROM deposit_requests WHERE status = 'approved'");
    const withdrawSumRes = await query("SELECT COALESCE(SUM(amount), 0) as total FROM withdrawal_requests WHERE status = 'approved'");
    const gamesCountRes = await query("SELECT COUNT(*) as count FROM game_rounds WHERE phase = 'ended'");
    const houseProfRes = await query("SELECT COALESCE(SUM(platform_fee), 0) as total FROM game_rounds");

    return res.json({
      success: true,
      stats: {
        totalPlayers: parseInt(userCountRes.rows[0].count),
        totalDeposits: parseFloat(depositSumRes.rows[0].total),
        totalWithdrawals: parseFloat(withdrawSumRes.rows[0].total),
        totalGamesPlayed: parseInt(gamesCountRes.rows[0].count),
        totalHouseRevenue: parseFloat(houseProfRes.rows[0].total)
      }
    });
  } catch (error: any) {
    console.error('❌ [Admin Stats Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve stats' });
  }
});

/**
 * Registered Bot Player Accounts Desk (Dedicated Admin Management)
 */
router.get('/bot-users', requireAdmin, async (_req, res) => {
  try {
    const botsRes = await query(`
      SELECT 
        u.id,
        u.full_name as name,
        COALESCE(u.phone, '0912345678') as phone,
        COALESCE(w.balance, 0.00) as balance,
        COALESCE(w.bonus, 0.00) as bonus,
        u.status,
        u.created_at as "createdAt",
        (SELECT COUNT(*) FROM wallet_transactions WHERE user_id = u.id AND type = 'win') as "totalWins",
        COALESCE((SELECT SUM(amount) FROM wallet_transactions WHERE user_id = u.id AND type = 'win'), 0) as "totalWonAmount"
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE u.is_bot = true
      ORDER BY u.created_at ASC
    `);

    const formatted = botsRes.rows.map(b => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      balance: parseFloat(b.balance),
      bonus: parseFloat(b.bonus),
      status: b.status,
      totalWins: parseInt(b.totalWins || '0', 10),
      totalWonAmount: parseFloat(b.totalWonAmount || '0'),
      createdAt: b.createdAt
    }));

    return res.json({ success: true, bots: formatted, count: formatted.length });
  } catch (error: any) {
    console.error('❌ [Admin Bot Users Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve bot users' });
  }
});

/**
 * Auto-Replenish House Bot Accounts to 500 ETB
 */
router.post('/bot-users/replenish', requireAdmin, async (_req, res) => {
  try {
    await query(`
      UPDATE wallets 
      SET balance = 500.00, updated_at = NOW() 
      WHERE user_id IN (SELECT id FROM users WHERE is_bot = true) AND balance < 50.00
    `);
    return res.json({ success: true, message: 'All low bot balances replenished to 500.00 ETB' });
  } catch (error: any) {
    console.error('❌ [Admin Replenish Bots Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to replenish bots' });
  }
});

/**
 * Get Live Fairness & Win Rate Engine Configuration
 */
router.get('/fairness-config', requireAdmin, async (_req, res) => {
  try {
    const config = gameEngine.getFairnessConfig();
    return res.json({ success: true, config });
  } catch (error: any) {
    console.error('❌ [Admin Fairness Config GET Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve fairness config' });
  }
});

/**
 * Update Fairness & Win Rate Engine Configuration
 */
router.post('/fairness-config', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { ownerWinRate, botWinRate, roomCapacity } = req.body;
    gameEngine.setFairnessConfig({
      ownerWinRate: typeof ownerWinRate === 'number' ? ownerWinRate : undefined,
      botWinRate: typeof botWinRate === 'number' ? botWinRate : undefined,
      roomCapacity: typeof roomCapacity === 'number' ? roomCapacity : undefined
    });
    return res.json({ success: true, config: gameEngine.getFairnessConfig() });
  } catch (error: any) {
    console.error('❌ [Admin Fairness Config POST Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to update fairness config' });
  }
});

export default router;
