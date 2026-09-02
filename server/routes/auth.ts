import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../db.ts';
import { generateToken, requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

/**
 * 1-Click Telegram Mini App Authentication
 * Seamlessly logs in or auto-registers the Telegram user with a live Neon DB wallet & welcome bonus.
 */
router.post('/telegram', async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName, photoUrl, phone } = req.body;

    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'telegramId is required' });
    }

    const tgIdNum = Number(telegramId);
    const cleanUsername = username ? username.replace(/^@/, '') : `tg_${telegramId}`;
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || cleanUsername;

    // Check if user exists by telegram_id or phone
    const existingUserRes = await query(
      `SELECT u.*, w.balance, w.bonus, w.locked_balance 
       FROM users u 
       LEFT JOIN wallets w ON u.id = w.user_id 
       WHERE u.telegram_id = $1 OR (u.phone IS NOT NULL AND u.phone = $2)
       LIMIT 1`,
      [tgIdNum, phone || null]
    );

    let userRow: any;
    let walletRow: any;
    let isNewUser = false;

    if (existingUserRes.rows.length > 0) {
      // Existing User: Update latest profile info and login time
      userRow = existingUserRes.rows[0];
      await query(
        `UPDATE users 
         SET last_login_at = NOW(),
             telegram_username = COALESCE($1, telegram_username),
             first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             photo_url = COALESCE($4, photo_url),
             phone = COALESCE($5, phone)
         WHERE id = $6`,
        [cleanUsername, firstName || null, lastName || null, photoUrl || null, phone || null, userRow.id]
      );

      walletRow = {
        balance: parseFloat(userRow.balance || '0'),
        bonus: parseFloat(userRow.bonus || '0'),
        lockedBalance: parseFloat(userRow.locked_balance || '0')
      };
    } else {
      // New User: Create atomically with initial 10 ETB Welcome Bonus
      isNewUser = true;
      const result = await withTransaction(async (client) => {
        const newUserRes = await client.query(
          `INSERT INTO users (telegram_id, telegram_username, first_name, last_name, full_name, photo_url, phone, role, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'player', 'active')
           RETURNING *`,
          [tgIdNum, cleanUsername, firstName || null, lastName || null, fullName, photoUrl || null, phone || null]
        );
        const newUser = newUserRes.rows[0];

        // Create Wallet with 10 ETB Welcome Bonus
        const newWalletRes = await client.query(
          `INSERT INTO wallets (user_id, balance, bonus, locked_balance)
           VALUES ($1, 0.00, 10.00, 0.00)
           RETURNING *`,
          [newUser.id]
        );
        const newWallet = newWalletRes.rows[0];

        // Record Welcome Bonus Ledger Transaction
        await client.query(
          `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, payment_method, description)
           VALUES ($1, 'bonus', 10.00, 10.00, $2, 'completed', 'welcome_reward', 'Telegram Mini App 10 ETB Registration Bonus')`,
          [newUser.id, `BONUS-TG-${tgIdNum}-${Date.now().toString().slice(-6)}`]
        );

        return { user: newUser, wallet: newWallet };
      });

      userRow = result.user;
      walletRow = {
        balance: parseFloat(result.wallet.balance || '0'),
        bonus: parseFloat(result.wallet.bonus || '10.00'),
        lockedBalance: parseFloat(result.wallet.locked_balance || '0')
      };
    }

    const authUser = {
      id: userRow.id,
      telegramId: userRow.telegram_id ? Number(userRow.telegram_id) : undefined,
      telegramUsername: userRow.telegram_username,
      phone: userRow.phone,
      fullName: userRow.full_name,
      role: userRow.role as 'player' | 'cashier' | 'admin'
    };

    const token = generateToken(authUser);

    return res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: userRow.id,
        telegramId: userRow.telegram_id,
        telegramUsername: userRow.telegram_username,
        fullName: userRow.full_name,
        firstName: userRow.first_name,
        lastName: userRow.last_name,
        phone: userRow.phone,
        avatar: userRow.avatar || '👤',
        photoUrl: userRow.photo_url,
        role: userRow.role,
        createdAt: userRow.created_at
      },
      wallet: walletRow
    });
  } catch (error: any) {
    console.error('❌ [Auth Telegram Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Authentication failed' });
  }
});

/**
 * Standard Phone & PIN Login (e.g. for Cashier/Admin Portal or Web)
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) {
      return res.status(400).json({ success: false, error: 'Phone and PIN are required' });
    }

    const userRes = await query(
      `SELECT u.*, w.balance, w.bonus, w.locked_balance 
       FROM users u 
       LEFT JOIN wallets w ON u.id = w.user_id 
       WHERE u.phone = $1 OR u.telegram_username = $1
       LIMIT 1`,
      [phone.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid phone number or account not found.' });
    }

    const userRow = userRes.rows[0];
    if (userRow.pin_hash) {
      const match = await bcrypt.compare(pin, userRow.pin_hash);
      if (!match) {
        return res.status(401).json({ success: false, error: 'Invalid PIN. Please try again.' });
      }
    }

    const authUser = {
      id: userRow.id,
      telegramId: userRow.telegram_id ? Number(userRow.telegram_id) : undefined,
      telegramUsername: userRow.telegram_username,
      phone: userRow.phone,
      fullName: userRow.full_name,
      role: userRow.role as 'player' | 'cashier' | 'admin'
    };

    const token = generateToken(authUser);

    return res.json({
      success: true,
      token,
      user: {
        id: userRow.id,
        telegramId: userRow.telegram_id,
        telegramUsername: userRow.telegram_username,
        fullName: userRow.full_name,
        phone: userRow.phone,
        avatar: userRow.avatar || '👤',
        photoUrl: userRow.photo_url,
        role: userRow.role
      },
      wallet: {
        balance: parseFloat(userRow.balance || '0'),
        bonus: parseFloat(userRow.bonus || '0'),
        lockedBalance: parseFloat(userRow.locked_balance || '0')
      }
    });
  } catch (error: any) {
    console.error('❌ [Auth Login Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Login failed' });
  }
});

/**
 * Get Current Authenticated Session & Live Wallet from Neon DB
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const userRes = await query(
      `SELECT u.*, w.balance, w.bonus, w.locked_balance 
       FROM users u 
       LEFT JOIN wallets w ON u.id = w.user_id 
       WHERE u.id = $1 
       LIMIT 1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userRow = userRes.rows[0];
    return res.json({
      success: true,
      user: {
        id: userRow.id,
        telegramId: userRow.telegram_id,
        telegramUsername: userRow.telegram_username,
        fullName: userRow.full_name,
        firstName: userRow.first_name,
        lastName: userRow.last_name,
        phone: userRow.phone,
        avatar: userRow.avatar || '👤',
        photoUrl: userRow.photo_url,
        role: userRow.role,
        createdAt: userRow.created_at
      },
      wallet: {
        balance: parseFloat(userRow.balance || '0'),
        bonus: parseFloat(userRow.bonus || '0'),
        lockedBalance: parseFloat(userRow.locked_balance || '0')
      }
    });
  } catch (error: any) {
    console.error('❌ [Auth Me Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve profile' });
  }
});

export default router;
