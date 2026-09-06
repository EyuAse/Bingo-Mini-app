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
    return !!(tg && (tg.initData?.length > 0 || tg.initDataUnsafe?.user));
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
      tg.ready();
      tg.expand();

      if (tg.setHeaderColor) {
        tg.setHeaderColor('#fffdf8');
      }

      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#fefce8');
      }

      if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }

      console.log('🚀 Telegram Mini App initialized:', {
        platform: tg.platform,
        version: tg.version,
        user: tg.initDataUnsafe?.user?.username || tg.initDataUnsafe?.user?.first_name
      });
    } catch (err) {
      console.warn('Telegram WebApp init notice:', err);
    }
  }

  /**
   * Request verified phone number from Telegram
   */
  public async requestTelegramPhone(): Promise<string | null> {
    const tg = this.webApp;
    if (!tg) return null;

    return new Promise((resolve) => {
      if (tg.requestContact) {
        tg.requestContact((shared: boolean, event?: any) => {
          if (shared) {
            const rawPhone =
              event?.response?.phone_number ||
              event?.phone_number ||
              tg.initDataUnsafe?.user?.id?.toString() ||
              '';
            console.log('📱 Telegram phone shared successfully:', rawPhone);
            resolve(rawPhone || null);
          } else {
            console.log('User declined Telegram phone sharing');
            resolve(null);
          }
        });
      } else {
        // Not supported on older client versions
        resolve(null);
      }
    });
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
      // Haptics not supported on desktop
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

  /**
   * Register listener for Telegram WebApp viewport changes (e.g. app expanded or resumed)
   */
  public onViewportChanged(callback: (eventData?: any) => void): () => void {
    const tg = this.webApp;
    if (!tg || !tg.onEvent) return () => {};

    try {
      tg.onEvent('viewportChanged', callback);
      return () => {
        if (tg.offEvent) {
          tg.offEvent('viewportChanged', callback);
        }
      };
    } catch {
      return () => {};
    }
  }
}

export const telegramService = TelegramService.getInstance();
