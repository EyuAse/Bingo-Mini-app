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

/**
 * GET /api/wallet/referrals
 * Returns live real referral stats, unique referral link, and friends list
 */
router.get('/referrals', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // 1. Get or generate user's referral code
    const userRes = await query('SELECT referral_code FROM users WHERE id = $1', [userId]);
    let referralCode = userRes.rows[0]?.referral_code;

    if (!referralCode) {
      referralCode = 'LOMI-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await query('UPDATE users SET referral_code = $1 WHERE id = $2', [referralCode, userId]);
    }

    const referralLink = `https://t.me/LomiBingobot/play?startapp=ref_${referralCode}`;

    // 2. Fetch real referrals data from Neon DB
    const friendsRes = await query(
      `SELECT 
         r.id,
         u.full_name as name,
         COALESCE(u.avatar, '👤') as avatar,
         COALESCE(r.is_telegram_premium, false) as "isPremium",
         r.created_at as "joinedAt",
         COALESCE(r.deposit_amount, 0) as "depositAmount",
         COALESCE(r.reward_amount, 0) as "bonusEarned",
         r.status
       FROM referrals r
       JOIN users u ON r.referred_user_id = u.id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [userId]
    );

    const friends = friendsRes.rows.map(f => ({
      id: f.id,
      name: f.name,
      avatar: f.avatar,
      isPremium: f.isPremium,
      joinedAt: f.joinedAt,
      depositAmount: parseFloat(f.depositAmount),
      bonusEarned: parseFloat(f.bonusEarned),
      status: f.status === 'rewarded' ? 'paid' : 'pending_deposit'
    }));

    const totalInvited = friends.length;
    const totalEarned = friends.reduce((acc, f) => acc + f.bonusEarned, 0);

    return res.json({
      success: true,
      referralCode,
      referralLink,
      totalInvited,
      totalEarned,
      friends
    });
  } catch (error: any) {
    console.error('❌ [Wallet Referrals Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve referral data' });
  }
});

/**
 * GET /api/wallet/game-history
 * Returns user's personal game & bet history, win/loss stats, and tickets grouped by round
 */
router.get('/game-history', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const ticketsRes = await query(`
      SELECT 
        gt.id as ticket_id,
        gt.round_id,
        gt.cartela_id,
        gt.card_matrix,
        gt.bet_amount,
        gt.status as ticket_status,
        gt.created_at as bet_time,
        gr.room_id,
        gr.round_number,
        gr.phase,
        gr.drawn_numbers,
        gr.total_pot,
        gr.winner_payout,
        gr.winner_user_ids,
        gr.winner_cartelas,
        gr.winner_names,
        gr.ended_at,
        COALESCE(rm.name, gr.room_id) as room_name
      FROM game_tickets gt
      JOIN game_rounds gr ON gt.round_id = gr.id
      LEFT JOIN game_rooms rm ON gr.room_id = rm.id
      WHERE gt.user_id = $1
      ORDER BY gt.created_at DESC
      LIMIT 100
    `, [userId]);

    const roundsMap = new Map<string, any>();

    for (const row of ticketsRes.rows) {
      if (!roundsMap.has(row.round_id)) {
        const winnerUserIds = Array.isArray(row.winner_user_ids)
          ? row.winner_user_ids
          : (typeof row.winner_user_ids === 'string' ? JSON.parse(row.winner_user_ids || '[]') : []);
        const winnerCartelas = Array.isArray(row.winner_cartelas)
          ? row.winner_cartelas
          : (typeof row.winner_cartelas === 'string' ? JSON.parse(row.winner_cartelas || '[]') : []);
        const winnerNames = Array.isArray(row.winner_names)
          ? row.winner_names
          : (typeof row.winner_names === 'string' ? JSON.parse(row.winner_names || '[]') : []);
        const drawnNumbers = Array.isArray(row.drawn_numbers)
          ? row.drawn_numbers
          : (typeof row.drawn_numbers === 'string' ? JSON.parse(row.drawn_numbers || '[]') : []);

        roundsMap.set(row.round_id, {
          roundId: row.round_id,
          roomId: row.room_id,
          roomName: row.room_name,
          roundNumber: row.round_number,
          phase: row.phase,
          totalPot: parseFloat(row.total_pot || '0'),
          winnerPayout: parseFloat(row.winner_payout || '0'),
          winnerNames,
          winnerCartelas,
          winnerUserIds,
          drawnNumbers,
          endedAt: row.ended_at,
          betTime: row.bet_time,
          tickets: [],
          totalStake: 0,
          isWinner: false,
          userWonAmount: 0,
          netPnl: 0,
        });
      }

      const round = roundsMap.get(row.round_id);
      const betAmt = parseFloat(row.bet_amount || '0');
      round.totalStake += betAmt;

      const isWinningCartela = round.winnerCartelas.includes(row.cartela_id);
      if (isWinningCartela) {
        round.isWinner = true;
      }

      let cardMatrix = row.card_matrix;
      if (typeof cardMatrix === 'string') {
        try {
          cardMatrix = JSON.parse(cardMatrix);
        } catch {
          cardMatrix = [];
        }
      }

      round.tickets.push({
        id: row.ticket_id,
        cartelaId: row.cartela_id,
        cardMatrix,
        betAmount: betAmt,
        isWinner: isWinningCartela,
        status: row.ticket_status
      });
    }

    const rounds = Array.from(roundsMap.values());
    let totalGames = rounds.length;
    let totalWins = 0;
    let totalLosses = 0;
    let totalStaked = 0;
    let totalWon = 0;

    for (const r of rounds) {
      totalStaked += r.totalStake;
      if (r.winnerUserIds.includes(userId)) {
        r.isWinner = true;
      }

      if (r.isWinner) {
        totalWins++;
        const userWinningCartelaCount = r.tickets.filter((t: any) => t.isWinner).length;
        const totalWinningCards = r.winnerCartelas.length || 1;
        const perCard = r.winnerPayout / totalWinningCards;
        r.userWonAmount = (userWinningCartelaCount > 0 ? userWinningCartelaCount : 1) * perCard;
        totalWon += r.userWonAmount;
      } else {
        totalLosses++;
        r.userWonAmount = 0;
      }
      r.netPnl = r.userWonAmount - r.totalStake;
    }

    const netProfit = totalWon - totalStaked;
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 1000) / 10 : 0;

    return res.json({
      success: true,
      summary: {
        totalGames,
        totalWins,
        totalLosses,
        winRate,
        totalStaked,
        totalWon,
        netProfit,
      },
      rounds
    });
  } catch (error: any) {
    console.error('❌ [Wallet Game History Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve game history' });
  }
});

export default router;

