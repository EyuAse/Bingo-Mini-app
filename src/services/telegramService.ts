import { TelegramUser, TelegramWebApp } from '../types/telegram';

export class TelegramService {
  private static instance: TelegramService;

  private constructor() {}

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public get webApp(): TelegramWebApp | null {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      return window.Telegram.WebApp;
    }
    return null;
  }

  public isTelegram(): boolean {
    const tg = this.webApp;
    return !!(tg && tg.initData && tg.initData.length > 0);
  }

  public getTelegramUser(): TelegramUser | null {
    const tg = this.webApp;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      return tg.initDataUnsafe.user;
    }
    return null;
  }

  public initWebApp() {
    const tg = this.webApp;
    if (!tg) return;

    try {
      // 1. Tell Telegram the Mini App is ready
      tg.ready();

      // 2. Expand full height
      tg.expand();

      // 3. Set header color to match Lemon fresh theme
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#fffdf8');
      }

      // 4. Set background color
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#fefce8');
      }

      // 5. Prevent accidental pull-to-close during live game
      if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }

      console.log('🚀 Telegram Mini App initialized successfully:', {
        platform: tg.platform,
        version: tg.version,
        user: tg.initDataUnsafe?.user?.username || tg.initDataUnsafe?.user?.first_name
      });
    } catch (err) {
      console.warn('Telegram WebApp init notice:', err);
    }
  }

  /**
   * Haptic vibration feedback for ball calls and wins
   */
  public triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') {
    const tg = this.webApp;
    if (!tg || !tg.HapticFeedback) return;

    try {
      if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch (e) {
      // Haptics not supported on desktop Telegram
    }
  }

  /**
   * Open Telegram Channel or Community Link
   */
  public openTelegramLink(url: string) {
    const tg = this.webApp;
    if (tg && tg.openTelegramLink) {
      tg.openTelegramLink(url);
    } else if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }
}

export const telegramService = TelegramService.getInstance();
