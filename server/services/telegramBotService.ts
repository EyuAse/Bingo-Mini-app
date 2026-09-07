import { query } from '../db.ts';

export interface BotConfig {
  token: string;
  webAppUrl: string;
  channelId?: string;
  autoPostMegaWins?: boolean;
  megaWinThreshold?: number;
}

export interface BroadcastOptions {
  title: string;
  messageText: string;
  photoUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  targetType: 'all_users' | 'channel' | 'group' | 'test';
  targetId?: string;
  pinMessage?: boolean;
}

export class TelegramBotService {
  private static instance: TelegramBotService;
  private cachedConfig: BotConfig | null = null;
  private lastConfigFetch: number = 0;

  private constructor() {}

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  /**
   * Authoritative Config Resolution:
   * Prioritizes dynamic settings saved in DB (admin_settings),
   * falling back to environment variables in .env
   */
  public async getConfig(): Promise<BotConfig> {
    const now = Date.now();
    if (this.cachedConfig && now - this.lastConfigFetch < 30000) {
      return this.cachedConfig;
    }

    let token = process.env.TELEGRAM_BOT_TOKEN || '';
    let webAppUrl = process.env.TELEGRAM_WEBAPP_URL || '';
    let channelId = process.env.TELEGRAM_CHANNEL_ID || '';
    let autoPostMegaWins = true;
    let megaWinThreshold = 300;

    try {
      const res = await query('SELECT key, value FROM admin_settings WHERE key LIKE $1', ['telegram_%']);
      for (const row of res.rows) {
        if (row.key === 'telegram_bot_token' && row.value) token = row.value;
        if (row.key === 'telegram_webapp_url' && row.value) webAppUrl = row.value;
        if (row.key === 'telegram_channel_id' && row.value) channelId = row.value;
        if (row.key === 'telegram_auto_post_wins') autoPostMegaWins = row.value === 'true';
        if (row.key === 'telegram_mega_win_threshold') megaWinThreshold = parseFloat(row.value) || 300;
      }
    } catch (e) {
      // Table might still be initializing, use env vars
    }

    this.cachedConfig = {
      token: token.trim(),
      webAppUrl: webAppUrl.trim(),
      channelId: channelId.trim(),
      autoPostMegaWins,
      megaWinThreshold
    };
    this.lastConfigFetch = now;
    return this.cachedConfig;
  }

  public clearConfigCache() {
    this.cachedConfig = null;
    this.lastConfigFetch = 0;
  }

  /**
   * Call Telegram Bot API method
   */
  private async callApi(method: string, payload: any, customToken?: string): Promise<{ ok: boolean; result?: any; description?: string; error_code?: number }> {
    const cfg = await this.getConfig();
    const token = customToken || cfg.token;
    if (!token) {
      return { ok: false, description: 'Telegram Bot Token is not configured. Please set it in Admin Desk or .env' };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { ok: false, description: err.message || 'Network error calling Telegram API' };
    }
  }

  /**
   * Validate bot credentials and return bot info
   */
  public async getMe(customToken?: string) {
    return this.callApi('getMe', {}, customToken);
  }

  /**
   * Configure persistent "Play Bingo" Menu Button in Telegram Chat
   */
  public async setChatMenuButton(webAppUrl?: string): Promise<{ success: boolean; message: string }> {
    const cfg = await this.getConfig();
    const url = webAppUrl || cfg.webAppUrl;

    if (!url) {
      return { success: false, message: 'Web App URL is required to set chat menu button' };
    }

    const res = await this.callApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🎮 Play Bingo',
        web_app: {
          url
        }
      }
    });

    if (res.ok) {
      return { success: true, message: 'Persistent Mini App Menu Button configured successfully on Telegram!' };
    }
    return { success: false, message: res.description || 'Failed to set chat menu button' };
  }

  /**
   * Set Bot Description (shown on empty chat before clicking Start)
   */
  public async setMyDescription(description: string): Promise<{ success: boolean; message: string }> {
    const res = await this.callApi('setMyDescription', { description });
    if (res.ok) {
      return { success: true, message: 'Bot description updated successfully on Telegram!' };
    }
    return { success: false, message: res.description || 'Failed to update bot description' };
  }

  /**
   * Set Bot Short Description (shown on bot profile & when sharing)
   */
  public async setMyShortDescription(shortDescription: string): Promise<{ success: boolean; message: string }> {
    const res = await this.callApi('setMyShortDescription', { short_description: shortDescription });
    if (res.ok) {
      return { success: true, message: 'Bot short description updated successfully on Telegram!' };
    }
    return { success: false, message: res.description || 'Failed to update bot short description' };
  }

  /**
   * Get current Bot Description from Telegram
   */
  public async getMyDescription(): Promise<{ ok: boolean; description?: string; error?: string }> {
    const res = await this.callApi('getMyDescription', {});
    if (res.ok) {
      return { ok: true, description: res.result?.description || '' };
    }
    return { ok: false, error: res.description };
  }

  /**
   * Get current Bot Short Description from Telegram
   */
  public async getMyShortDescription(): Promise<{ ok: boolean; shortDescription?: string; error?: string }> {
    const res = await this.callApi('getMyShortDescription', {});
    if (res.ok) {
      return { ok: true, shortDescription: res.result?.short_description || '' };
    }
    return { ok: false, error: res.description };
  }

  /**
   * Send text message with HTML parsing and optional inline buttons
   */
  public async sendMessage(chatId: string | number, text: string, options: {
    inlineKeyboard?: any[][];
    pin?: boolean;
    disablePreview?: boolean;
  } = {}) {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: options.disablePreview ?? false
    };

    if (options.inlineKeyboard && options.inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: options.inlineKeyboard };
    }

    const res = await this.callApi('sendMessage', payload);
    if (res.ok && options.pin && res.result?.message_id) {
      await this.callApi('pinChatMessage', {
        chat_id: chatId,
        message_id: res.result.message_id,
        disable_notification: false
      });
    }
    return res;
  }

  /**
   * Send photo with caption and optional inline buttons
   */
  public async sendPhoto(chatId: string | number, photoUrl: string, caption: string, options: {
    inlineKeyboard?: any[][];
    pin?: boolean;
  } = {}) {
    const payload: any = {
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML'
    };

    if (options.inlineKeyboard && options.inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: options.inlineKeyboard };
    }

    const res = await this.callApi('sendPhoto', payload);
    if (res.ok && options.pin && res.result?.message_id) {
      await this.callApi('pinChatMessage', {
        chat_id: chatId,
        message_id: res.result.message_id,
        disable_notification: false
      });
    }
    return res;
  }

  /**
   * Execute Broadcast Campaign:
   * Supports Channel / Group posting, direct 1-on-1 player broadcasts, or test messages.
   */
  public async broadcast(opts: BroadcastOptions): Promise<{
    success: boolean;
    campaignId?: number;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    const cfg = await this.getConfig();
    if (!cfg.token) {
      return { success: false, totalRecipients: 0, sentCount: 0, failedCount: 0, message: 'Telegram Bot Token is not configured' };
    }

    const meRes = await this.getMe();
    const botUser = meRes.result?.username || 'LomiBingobot';

    // Build inline keyboard if button details provided
    const inlineKeyboard: any[][] = [];
    if (opts.buttonText) {
      const btnUrl = opts.buttonUrl || cfg.webAppUrl;
      if (btnUrl) {
        if (opts.targetType === 'channel' || opts.targetType === 'group') {
          // In channels/groups, use native Telegram Mini App direct link https://t.me/<bot>/play
          let channelBtnUrl = opts.buttonUrl;
          if (!channelBtnUrl) {
            channelBtnUrl = `https://t.me/${botUser}/play`;
          }
          inlineKeyboard.push([
            { text: opts.buttonText, url: channelBtnUrl }
          ]);
        } else {
          // In direct 1-on-1 chats between user and bot, web_app is fully supported
          if (opts.buttonText.toLowerCase().includes('play') || opts.buttonText.toLowerCase().includes('bingo')) {
            inlineKeyboard.push([
              { text: opts.buttonText, web_app: { url: btnUrl } }
            ]);
          } else {
            inlineKeyboard.push([
              { text: opts.buttonText, url: btnUrl }
            ]);
          }
        }
      }
    }

    // 1. Single Channel or Group Broadcast
    if (opts.targetType === 'channel' || opts.targetType === 'group') {
      const targetChat = (opts.targetId || cfg.channelId || '').trim();
      if (!targetChat) {
        return { success: false, totalRecipients: 0, sentCount: 0, failedCount: 0, message: 'Target channel or group username/ID is missing' };
      }

      // Check if user accidentally entered the bot's own username as the channel
      if (targetChat.toLowerCase() === `@${botUser.toLowerCase()}` || targetChat.toLowerCase() === botUser.toLowerCase()) {
        return {
          success: false,
          totalRecipients: 0,
          sentCount: 0,
          failedCount: 1,
          message: `Cannot post to @${botUser}. In Telegram, a bot is an interactive chat, not a channel with a public feed. To post an announcement, add @${botUser} as an Administrator to your Telegram Channel (e.g. @YourChannel), or select 'All Players (Direct)' to message registered users.`
        };
      }

      let res;
      if (opts.photoUrl) {
        res = await this.sendPhoto(targetChat, opts.photoUrl, opts.messageText, {
          inlineKeyboard,
          pin: opts.pinMessage
        });
      } else {
        res = await this.sendMessage(targetChat, opts.messageText, {
          inlineKeyboard,
          pin: opts.pinMessage
        });
      }

      const sent = res.ok ? 1 : 0;
      const failed = res.ok ? 0 : 1;

      // Friendly diagnostic description for common Telegram API issues
      let friendlyError = res.description;
      if (!res.ok) {
        const desc = (res.description || '').toLowerCase();
        if (desc.includes('chat not found')) {
          friendlyError = `Channel '${targetChat}' not found. Please verify the channel @username exists, and make sure @${botUser} has been added as an Administrator to that channel with 'Post Messages' permission.`;
        } else if (desc.includes('not a member') || desc.includes('not an administrator') || desc.includes('need administrator rights')) {
          friendlyError = `@${botUser} is not an Administrator of ${targetChat}. Open Channel Info -> Administrators -> Add Admin -> search @${botUser} and enable 'Post Messages'.`;
        } else if (desc.includes("can't send messages to the bot")) {
          friendlyError = `A bot cannot post messages to itself. Please specify a Telegram Channel (e.g. @YourChannel) where @${botUser} is an Administrator, or select 'All Players (Direct)'.`;
        }
      }

      // Save record in database
      const insertRes = await query(
        `INSERT INTO telegram_broadcasts 
         (title, message_text, photo_url, button_text, button_url, target_type, target_id, pin_message, total_recipients, sent_count, failed_count, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          opts.title,
          opts.messageText,
          opts.photoUrl || null,
          opts.buttonText || null,
          opts.buttonUrl || null,
          opts.targetType,
          targetChat,
          opts.pinMessage || false,
          1,
          sent,
          failed,
          res.ok ? 'completed' : 'failed'
        ]
      );

      return {
        success: res.ok,
        campaignId: insertRes.rows[0]?.id,
        totalRecipients: 1,
        sentCount: sent,
        failedCount: failed,
        message: res.ok ? `Successfully published announcement to ${targetChat}!` : (friendlyError || 'Failed to post to Telegram')
      };
    }

    // 2. Direct Test Message to Admin
    if (opts.targetType === 'test') {
      const testChatId = opts.targetId;
      if (!testChatId) {
        return { success: false, totalRecipients: 0, sentCount: 0, failedCount: 0, message: 'Please enter your Telegram User ID for the test message' };
      }

      let res;
      if (opts.photoUrl) {
        res = await this.sendPhoto(testChatId, opts.photoUrl, opts.messageText, { inlineKeyboard });
      } else {
        res = await this.sendMessage(testChatId, opts.messageText, { inlineKeyboard });
      }

      return {
        success: res.ok,
        totalRecipients: 1,
        sentCount: res.ok ? 1 : 0,
        failedCount: res.ok ? 0 : 1,
        message: res.ok ? 'Test ad preview delivered successfully to your Telegram!' : (res.description || 'Test send failed')
      };
    }

    // 3. Mass Broadcast to all registered bot players
    const usersRes = await query(
      `SELECT DISTINCT telegram_id 
       FROM users 
       WHERE telegram_id IS NOT NULL AND telegram_id > 0
       ORDER BY telegram_id ASC`
    );

    const recipients = usersRes.rows.map((r: any) => r.telegram_id);
    const totalRecipients = recipients.length;

    if (totalRecipients === 0) {
      return { success: false, totalRecipients: 0, sentCount: 0, failedCount: 0, message: 'No registered players with Telegram IDs found' };
    }

    // Insert broadcast entry in 'sending' state
    const insertRes = await query(
      `INSERT INTO telegram_broadcasts 
       (title, message_text, photo_url, button_text, button_url, target_type, target_id, pin_message, total_recipients, sent_count, failed_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'sending')
       RETURNING id`,
      [
        opts.title,
        opts.messageText,
        opts.photoUrl || null,
        opts.buttonText || null,
        opts.buttonUrl || null,
        opts.targetType,
        'all_users',
        false,
        totalRecipients,
        0,
        0
      ]
    );
    const campaignId = insertRes.rows[0]?.id;

    // Asynchronous batch dispatch (Telegram 30 msgs/sec rate-limit friendly)
    (async () => {
      let sentCount = 0;
      let failedCount = 0;
      const batchSize = 25;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (chatId: number) => {
            try {
              let res;
              if (opts.photoUrl) {
                res = await this.sendPhoto(chatId, opts.photoUrl, opts.messageText, { inlineKeyboard });
              } else {
                res = await this.sendMessage(chatId, opts.messageText, { inlineKeyboard });
              }

              if (res.ok) {
                sentCount++;
              } else {
                failedCount++;
              }
            } catch {
              failedCount++;
            }
          })
        );

        // Sleep 1 second between batches to avoid Telegram rate limits
        if (i + batchSize < recipients.length) {
          await new Promise(r => setTimeout(r, 1050));
        }
      }

      await query(
        `UPDATE telegram_broadcasts 
         SET sent_count = $1, failed_count = $2, status = 'completed'
         WHERE id = $3`,
        [sentCount, failedCount, campaignId]
      );
      console.log(`📢 [Telegram Broadcast Completed] ID: ${campaignId}, Sent: ${sentCount}, Failed: ${failedCount}`);
    })().catch(err => {
      console.error('❌ [Broadcast Queue Error]:', err);
    });

    return {
      success: true,
      campaignId,
      totalRecipients,
      sentCount: 0,
      failedCount: 0,
      message: `Broadcast started to ${totalRecipients} players. Running in background.`
    };
  }

  /**
   * Automated Big Jackpot / Mega Winner Channel Announcement
   */
  public async announceBigWinner(winnerName: string, amount: number, roomName: string, cartelaId: number) {
    const cfg = await this.getConfig();
    if (!cfg.autoPostMegaWins || !cfg.channelId || !cfg.token) {
      return;
    }

    if (amount < (cfg.megaWinThreshold || 300)) {
      return;
    }

    const text = 
`🏆 <b>MEGA WINNER IN LOMI BINGO!</b> 🍋🎉

💰 <b>Player:</b> ${winnerName}
💵 <b>Winning Amount:</b> <b>+${amount.toFixed(2)} ETB!</b>
🏟️ <b>Room:</b> ${roomName}
🎟️ <b>Winning Cartela:</b> #${cartelaId}

⚡ <i>The next round is starting now! Tap below to join and claim your win!</i>`;

    const meRes = await this.getMe();
    const botUser = meRes.result?.username || 'LomiBingobot';
    const channelPlayUrl = `https://t.me/${botUser}/play`;

    const inlineKeyboard = [
      [{ text: '🎯 Play Bingo Now & Win!', url: channelPlayUrl }]
    ];

    try {
      await this.sendMessage(cfg.channelId, text, {
        inlineKeyboard,
        disablePreview: true
      });
      console.log(`📢 [Telegram Channel Winner Posted] ${winnerName} won ${amount} ETB`);
    } catch (e) {
      console.warn('Failed to announce winner on Telegram channel:', e);
    }
  }

  /**
   * Inbound Telegram Webhook update handler (/start, /play, /help)
   */
  public async handleWebhookUpdate(update: any): Promise<boolean> {
    if (!update) return false;

    // Auto-detect when bot is added as Administrator to a Channel or Group
    if (update.my_chat_member?.chat) {
      const chat = update.my_chat_member.chat;
      const targetIdentifier = chat.username ? `@${chat.username}` : String(chat.id);
      console.log(`📢 [Telegram Bot added to Chat/Channel]:`, chat.title, targetIdentifier);
      try {
        await query(
          `INSERT INTO admin_settings (key, value, updated_at)
           VALUES ('telegram_channel_id', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [targetIdentifier]
        );
        this.clearConfigCache();
      } catch (e) {
        console.warn('Failed to auto-save channel id from my_chat_member:', e);
      }
      return true;
    }

    if (!update.message) return false;
    const msg = update.message;
    const chatId = msg.chat?.id;
    const text = (msg.text || '').trim();

    if (!chatId) return false;

    const cfg = await this.getConfig();
    const webAppUrl = cfg.webAppUrl || 'https://t.me';

    // Track bot started in DB
    if (msg.from?.id) {
      try {
        await query(
          'UPDATE users SET bot_started = TRUE WHERE telegram_id = $1',
          [msg.from.id]
        );
      } catch {}
    }

    if (text.startsWith('/start') || text === '/play') {
      let welcomeText = 
`👋 <b>እንኳን ወደ ሎሚ ቢንጎ በደህና መጡ!</b> 🍋🎯
<b>Welcome to Lomi / Betika Bingo!</b>

🇪🇹 Ethiopia's #1 Real-Time Multiplayer Live Bingo in Telegram!

🎁 <b>10 ETB Welcome Bonus</b> for new players
⚡ <b>Instant Cashier Withdrawals & Deposits</b>
🎙️ <b>Authentic Voice Caller</b> in Amharic and English!
🛡️ <b>Disconnect Protection:</b> Never lose a win even on network drops!

Tap the button below to launch the game and start winning! 👇`;
      let welcomePhoto = '';

      try {
        const settingsRes = await query(
          `SELECT key, value FROM admin_settings WHERE key IN ('telegram_bot_welcome_text', 'telegram_bot_welcome_photo')`
        );
        for (const row of settingsRes.rows) {
          if (row.key === 'telegram_bot_welcome_text' && row.value && row.value.trim()) {
            welcomeText = row.value.trim();
          } else if (row.key === 'telegram_bot_welcome_photo' && row.value && row.value.trim()) {
            welcomePhoto = row.value.trim();
          }
        }
      } catch (e) {
        console.warn('Could not read custom welcome greeting:', e);
      }

      const channelLink = cfg.channelId ? `https://t.me/${cfg.channelId.replace('@', '')}` : 'https://t.me/lomibingo_official';

      const inlineKeyboard = [
        [{ text: '🎮 Play Bingo Now (10 ETB Gift)', web_app: { url: webAppUrl } }],
        [{ text: '📢 Join Official Channel', url: channelLink }]
      ];

      if (welcomePhoto) {
        await this.sendPhoto(chatId, welcomePhoto, welcomeText, { inlineKeyboard });
      } else {
        await this.sendMessage(chatId, welcomeText, { inlineKeyboard });
      }
      return true;
    }

    if (text === '/help') {
      const helpText = 
`📖 <b>Lomi Bingo Help & Guides</b> 🍋

1️⃣ <b>Select a Room:</b> Choose 10, 20, 50, or 100 ETB stake room.
2️⃣ <b>Pick Cartelas:</b> Choose 1 or 2 cartelas from 400 serial numbers.
3️⃣ <b>Daub & Win:</b> Watch real-time live ball calls or activate Auto-Daub!
4️⃣ <b>Withdrawals:</b> Telebirr, CBE Birr & Cashier processed instantly.

Tap below to jump into the arena:`;

      await this.sendMessage(chatId, helpText, {
        inlineKeyboard: [
          [{ text: '🎮 Open Bingo Arena', web_app: { url: webAppUrl } }]
        ]
      });
      return true;
    }

    return false;
  }
}

export const telegramBotService = TelegramBotService.getInstance();
