import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RegisterPayload, LoginPayload, OtpChallengeResponse, OtpVerificationResult } from '../types/auth';
import { TelegramUser } from '../types/telegram';
import { authService } from '../services/authService';
import { telegramService } from '../services/telegramService';
import { apiClient } from '../services/apiClient';
import { socketService } from '../services/socketService';
import { useLanguage } from './LanguageContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInsideTelegram: boolean;
  telegramUser: TelegramUser | null;
  isFirstTimeTelegramUser: boolean;
  dismissFirstTimeModal: () => void;
  concurrentSessionNotice: { reason: string; message: string } | null;
  dismissConcurrentSessionNotice: () => void;
  sendOtp: (phone: string) => Promise<OtpChallengeResponse>;
  verifyOtp: (phone: string, code: string) => OtpVerificationResult;
  register: (payload: RegisterPayload) => Promise<User>;
  login: (payload: LoginPayload) => Promise<User>;
  loginWithTelegram: (tgUser?: TelegramUser, customPhone?: string) => Promise<{ user: User; isNewUser: boolean }>;
  logout: () => void;
  resetPin: (phone: string, otpCode: string, newPin: string) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInsideTelegram, setIsInsideTelegram] = useState<boolean>(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isFirstTimeTelegramUser, setIsFirstTimeTelegramUser] = useState<boolean>(false);
  const [concurrentSessionNotice, setConcurrentSessionNotice] = useState<{ reason: string; message: string } | null>(null);

  const dismissConcurrentSessionNotice = () => {
    setConcurrentSessionNotice(null);
  };

  // Listen for Single-Device Enforcement events: if account logged in on another device, terminate session here
  useEffect(() => {
    const unsub = socketService.onSessionTerminated((data) => {
      console.warn('⚠️ [AuthContext] Single Active Device Policy triggered: logged in elsewhere:', data);
      setConcurrentSessionNotice(data);
      authService.clearSession();
      localStorage.removeItem('lomi_auth_token');
      localStorage.removeItem('lomi_user');
      localStorage.removeItem('lomi_live_balance');
      localStorage.removeItem('lomi_live_bonus');
      localStorage.setItem('lomi_explicit_logout', 'true');
      setUser(null);
      setToken(null);
    });

    return () => {
      unsub();
    };
  }, []);

  // Initialize Telegram WebApp, Purge Legacy Test Data & Auto-Authenticate with Neon DB
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Purge legacy storage keys
        if (typeof window !== 'undefined') {
          const legacyKeys = [
            'betika_user_balance',
            'betika_user_bonus',
            'lb_admin_users',
            'lb_admin_transactions',
            'lomi_registered_users',
            'lomi_registered_users_v2',
            'lomi_registered_users_v3',
            'lomi_registered_users_v4'
          ];
          legacyKeys.forEach(k => localStorage.removeItem(k));
        }

        // 1. Initialize Telegram WebApp SDK
        telegramService.initWebApp();
        const tgUser = telegramService.getTelegramUser();
        const isTg = telegramService.isTelegram() && !!tgUser;
        setIsInsideTelegram(isTg);
        setTelegramUser(tgUser);

        // 2. Multi-Account Isolation: If inside Telegram, clear previous user's cached data if account switched
        if (isTg && tgUser && tgUser.id) {
          const storedUserJson = localStorage.getItem('lomi_user');
          if (storedUserJson) {
            try {
              const parsed = JSON.parse(storedUserJson);
              if (parsed.telegramId && String(parsed.telegramId) !== String(tgUser.id)) {
                // Switched to a different Telegram account on the same phone!
                localStorage.removeItem('lomi_auth_token');
                localStorage.removeItem('lomi_user');
                localStorage.removeItem('lomi_live_balance');
                localStorage.removeItem('lomi_live_bonus');
              }
            } catch {}
          }

          const isExplicitlyLoggedOut =
            typeof window !== 'undefined' && localStorage.getItem(`lomi_explicit_logout_${tgUser.id}`) === 'true';

          // Check live Neon DB for this specific Telegram account
          try {
            const exists = await apiClient.auth.checkTelegramExists(tgUser.id);
            if (exists && !isExplicitlyLoggedOut) {
              // Existing account: auto restore session
              const apiResult = await apiClient.auth.loginWithTelegram(tgUser);
              const mappedUser: User = {
                id: apiResult.user.id,
                telegramId: apiResult.user.telegramId,
                telegramUsername: apiResult.user.telegramUsername,
                fullName: apiResult.user.fullName || tgUser.first_name,
                phone: apiResult.user.phone || `09${String(tgUser.id).slice(-8)}`,
                nationalPhone: apiResult.user.phone ? `0${apiResult.user.phone.slice(-9)}` : `09${String(tgUser.id).slice(-8)}`,
                formattedPhone: apiResult.user.phone || `09${String(tgUser.id).slice(-8)}`,
                carrier: 'ethiotelecom',
                isPhoneVerified: true,
                role: apiResult.user.role || 'player',
                pin: '1234',
                createdAt: apiResult.user.createdAt || new Date().toISOString(),
                lastLogin: new Date().toISOString()
              };

              setUser(mappedUser);
              setToken(apiResult.token);
              localStorage.setItem('lomi_user', JSON.stringify(mappedUser));
              if (apiResult.wallet) {
                localStorage.setItem('lomi_live_balance', apiResult.wallet.balance.toFixed(2));
                localStorage.setItem('lomi_live_bonus', apiResult.wallet.bonus.toFixed(2));
                window.dispatchEvent(new CustomEvent('lb_wallet_updated', { detail: apiResult.wallet }));
              }
              return;
            }
          } catch (err) {
            console.warn('⚠️ Server auth check error:', err);
          }
        }

        // 3. Fallback to existing verified session (Web browser)
        const isWebExplicitLogout =
          typeof window !== 'undefined' && localStorage.getItem('lomi_explicit_logout') === 'true';

        if (!isWebExplicitLogout && !isTg) {
          const storedToken = localStorage.getItem('lomi_auth_token');
          if (storedToken) {
            try {
              const meRes = await apiClient.auth.getMe();
              const u = meRes.user;
              const mappedUser: User = {
                id: u.id,
                telegramId: u.telegramId,
                telegramUsername: u.telegramUsername,
                fullName: u.fullName,
                phone: u.phone || '0911234567',
                nationalPhone: u.phone ? `0${u.phone.slice(-9)}` : '0911234567',
                formattedPhone: u.phone || '0911234567',
                carrier: 'ethiotelecom',
                isPhoneVerified: true,
                role: u.role || 'player',
                pin: '1234',
                createdAt: u.createdAt || new Date().toISOString(),
                lastLogin: new Date().toISOString()
              };
              setUser(mappedUser);
              setToken(storedToken);
              if (meRes.wallet) {
                localStorage.setItem('lomi_live_balance', meRes.wallet.balance.toFixed(2));
                localStorage.setItem('lomi_live_bonus', meRes.wallet.bonus.toFixed(2));
              }
              return;
            } catch {
              // Token expired
            }
          }
        }
      } catch (err) {
        console.error('Error initializing Telegram WebApp auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const dismissFirstTimeModal = () => {
    setIsFirstTimeTelegramUser(false);
  };

  const sendOtp = async (phone: string): Promise<OtpChallengeResponse> => {
    return await authService.requestOtp(phone, lang as 'en' | 'am');
  };

  const verifyOtp = (phone: string, code: string): OtpVerificationResult => {
    return authService.verifyOtp(phone, code);
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true);
    try {
      try {
        const apiRes = await apiClient.auth.register({
          phone: payload.phone,
          pin: payload.pin,
          fullName: payload.fullName
        });
        localStorage.removeItem('lomi_explicit_logout');
        const u = apiRes.user;
        const mappedUser: User = {
          id: u.id,
          phone: u.phone || payload.phone,
          nationalPhone: payload.phone,
          formattedPhone: payload.phone,
          carrier: 'ethiotelecom',
          fullName: u.fullName,
          isPhoneVerified: true,
          role: u.role || 'player',
          pin: payload.pin,
          createdAt: u.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        setUser(mappedUser);
        setToken(apiRes.token);
        if (apiRes.wallet) {
          localStorage.setItem('lomi_live_balance', apiRes.wallet.balance.toFixed(2));
          localStorage.setItem('lomi_live_bonus', apiRes.wallet.bonus.toFixed(2));
          window.dispatchEvent(new CustomEvent('lb_wallet_updated', { detail: apiRes.wallet }));
        }
        return mappedUser;
      } catch (backendErr) {
        console.warn('Backend register notice, using local service:', backendErr);
        const result = await authService.register(payload);
        localStorage.removeItem('lomi_explicit_logout');
        setUser(result.user);
        setToken(result.token);
        return result.user;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const apiResult = await apiClient.auth.loginWithPin(payload.phone, payload.pin);
      localStorage.removeItem('lomi_explicit_logout');
      const u = apiResult.user;
      const mappedUser: User = {
        id: u.id,
        telegramId: u.telegramId,
        telegramUsername: u.telegramUsername,
        fullName: u.fullName,
        phone: u.phone || payload.phone,
        nationalPhone: payload.phone,
        formattedPhone: payload.phone,
        carrier: 'ethiotelecom',
        isPhoneVerified: true,
        role: u.role || 'player',
        pin: payload.pin,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      setUser(mappedUser);
      setToken(apiResult.token);
      return mappedUser;
    } catch {
      const result = await authService.login(payload);
      localStorage.removeItem('lomi_explicit_logout');
      setUser(result.user);
      setToken(result.token);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithTelegram = async (
    customTgUser?: TelegramUser,
    customPhone?: string
  ): Promise<{ user: User; isNewUser: boolean }> => {
    const tgUser = customTgUser || telegramUser;
    if (!tgUser) {
      throw new Error('Telegram session not found. Please register or login with your phone number.');
    }

    setIsLoading(true);
    try {
      const apiResult = await apiClient.auth.loginWithTelegram(tgUser, customPhone);
      localStorage.removeItem('lomi_explicit_logout');

      const mappedUser: User = {
        id: apiResult.user.id,
        telegramId: apiResult.user.telegramId,
        telegramUsername: apiResult.user.telegramUsername,
        fullName: apiResult.user.fullName || `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim(),
        phone: apiResult.user.phone || customPhone || `09${String(tgUser.id).slice(-8)}`,
        nationalPhone: customPhone || `09${String(tgUser.id).slice(-8)}`,
        formattedPhone: customPhone || `09${String(tgUser.id).slice(-8)}`,
        carrier: 'ethiotelecom',
        isPhoneVerified: true,
        role: apiResult.user.role || 'player',
        pin: '1234',
        createdAt: apiResult.user.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      setUser(mappedUser);
      setToken(apiResult.token);
      if (apiResult.wallet) {
        localStorage.setItem('lomi_live_balance', apiResult.wallet.balance.toFixed(2));
        localStorage.setItem('lomi_live_bonus', apiResult.wallet.bonus.toFixed(2));
        window.dispatchEvent(new CustomEvent('lb_wallet_updated', { detail: apiResult.wallet }));
      }

      telegramService.triggerHaptic('success');
      return { user: mappedUser, isNewUser: apiResult.isNewUser };
    } catch (err: any) {
      console.error('❌ [Database Login Error]:', err);
      throw new Error(err?.message || 'Failed to connect to database. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.clearSession();
    localStorage.removeItem('lomi_auth_token');
    localStorage.removeItem('lomi_user');
    localStorage.removeItem('lomi_live_balance');
    localStorage.removeItem('lomi_live_bonus');
    if (telegramUser?.id) {
      localStorage.setItem(`lomi_explicit_logout_${telegramUser.id}`, 'true');
    }
    localStorage.setItem('lomi_explicit_logout', 'true');
    setUser(null);
    setToken(null);
  };

  const resetPin = async (phone: string, otpCode: string, newPin: string): Promise<boolean> => {
    return await authService.resetPin(phone, otpCode, newPin);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = authService.updateProfile(user.id, data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isInsideTelegram,
        telegramUser,
        isFirstTimeTelegramUser,
        dismissFirstTimeModal,
        concurrentSessionNotice,
        dismissConcurrentSessionNotice,
        sendOtp,
        verifyOtp,
        register,
        login,
        loginWithTelegram,
        logout,
        resetPin,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
