import { Router } from 'express';
import { telegramBotService } from '../services/telegramBotService.ts';
import { query } from '../db.ts';

const router = Router();

/**
 * 1. Live Bot Status & Metrics for Admin Desk
 * GET /api/admin/telegram/status
 */
router.get('/status', async (_req, res) => {
  try {
    const config = await telegramBotService.getConfig();
    let botInfo = null;
    let isConnected = false;

    if (config.token) {
      const meRes = await telegramBotService.getMe();
      if (meRes.ok) {
        isConnected = true;
        botInfo = meRes.result;
      }
    }

    const countRes = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE telegram_id IS NOT NULL AND telegram_id > 0) as total_telegram_users,
         COUNT(*) FILTER (WHERE bot_started = TRUE) as bot_started_users
       FROM users`
    );

    const broadcastsRes = await query(
      'SELECT COUNT(*) as total_broadcasts FROM telegram_broadcasts'
    );

    return res.json({
      success: true,
      isConnected,
      bot: botInfo,
      config: {
        hasToken: Boolean(config.token),
        tokenPreview: config.token ? `${config.token.slice(0, 7)}...${config.token.slice(-5)}` : '',
        webAppUrl: config.webAppUrl,
        channelId: config.channelId,
        autoPostMegaWins: config.autoPostMegaWins,
        megaWinThreshold: config.megaWinThreshold
      },
      metrics: {
        totalTelegramUsers: parseInt(countRes.rows[0]?.total_telegram_users || '0', 10),
        activeBotSubscribers: parseInt(countRes.rows[0]?.bot_started_users || '0', 10),
        totalBroadcasts: parseInt(broadcastsRes.rows[0]?.total_broadcasts || '0', 10)
      }
    });
  } catch (err: any) {
    console.error('Error checking telegram bot status:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to check status' });
  }
});

/**
 * 2. Update Bot & Campaign Configuration
 * POST /api/admin/telegram/configure
 */
router.post('/configure', async (req, res) => {
  try {
    const { token, webAppUrl, channelId, autoPostMegaWins, megaWinThreshold } = req.body;

    const upsertSetting = async (key: string, val: string) => {
      await query(
        `INSERT INTO admin_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, val]
      );
    };

    if (typeof token === 'string' && token.trim()) {
      // Validate token with Telegram before saving
      const meCheck = await telegramBotService.getMe(token.trim());
      if (!meCheck.ok) {
        return res.status(400).json({
          success: false,
          error: `Invalid Telegram Bot Token: ${meCheck.description || 'Verification failed'}`
        });
      }
      await upsertSetting('telegram_bot_token', token.trim());
    }

    if (typeof webAppUrl === 'string') {
      await upsertSetting('telegram_webapp_url', webAppUrl.trim());
    }

    if (typeof channelId === 'string') {
      await upsertSetting('telegram_channel_id', channelId.trim());
    }

    if (typeof autoPostMegaWins === 'boolean') {
      await upsertSetting('telegram_auto_post_wins', autoPostMegaWins ? 'true' : 'false');
    }

    if (typeof megaWinThreshold === 'number') {
      await upsertSetting('telegram_mega_win_threshold', megaWinThreshold.toString());
    }

    telegramBotService.clearConfigCache();
    const updated = await telegramBotService.getConfig();

    return res.json({
      success: true,
      message: 'Telegram Bot settings saved successfully!',
      config: {
        hasToken: Boolean(updated.token),
        webAppUrl: updated.webAppUrl,
        channelId: updated.channelId,
        autoPostMegaWins: updated.autoPostMegaWins,
        megaWinThreshold: updated.megaWinThreshold
      }
    });
  } catch (err: any) {
    console.error('Error saving telegram configuration:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to save config' });
  }
});

/**
 * 3. Configure Mini App Menu Button
 * POST /api/admin/telegram/set-menu-button
 */
router.post('/set-menu-button', async (req, res) => {
  try {
    const { webAppUrl } = req.body;
    const result = await telegramBotService.setChatMenuButton(webAppUrl);
    if (result.success) {
      return res.json({ success: true, message: result.message });
    }
    return res.status(400).json({ success: false, error: result.message });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to set menu button' });
  }
});

/**
 * 4. Dispatch Broadcast Campaign (Channels, Groups, Players, or Test Send)
 * POST /api/admin/telegram/broadcast
 */
router.post('/broadcast', async (req, res) => {
  try {
    const {
      title,
      messageText,
      photoUrl,
      buttonText,
      buttonUrl,
      targetType,
      targetId,
      pinMessage
    } = req.body;

    if (!title || !messageText) {
      return res.status(400).json({ success: false, error: 'Campaign title and message content are required' });
    }

    const result = await telegramBotService.broadcast({
      title,
      messageText,
      photoUrl,
      buttonText,
      buttonUrl,
      targetType: targetType || 'all_users',
      targetId,
      pinMessage: Boolean(pinMessage)
    });

    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (err: any) {
    console.error('Error creating broadcast:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to send broadcast' });
  }
});

/**
 * 5. Broadcast Campaign History & Delivery Reports
 * GET /api/admin/telegram/broadcasts
 */
router.get('/broadcasts', async (_req, res) => {
  try {
    const history = await query(
      `SELECT * FROM telegram_broadcasts 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    return res.json({
      success: true,
      broadcasts: history.rows
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. Public Inbound Webhook for Telegram Bot Commands
 * POST /api/telegram/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    await telegramBotService.handleWebhookUpdate(req.body);
    return res.status(200).send('OK');
  } catch (err) {
    console.warn('Telegram webhook warning:', err);
    return res.status(200).send('OK'); // Always return 200 to Telegram
  }
});

export default router;
