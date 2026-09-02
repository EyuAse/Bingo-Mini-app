import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RegisterPayload, LoginPayload, OtpChallengeResponse, OtpVerificationResult } from '../types/auth';
import { TelegramUser } from '../types/telegram';
import { authService } from '../services/authService';
import { telegramService } from '../services/telegramService';
import { apiClient } from '../services/apiClient';
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
            'lomi_registered_users_v4',
            'lomi_registered_users_v5'
          ];
          legacyKeys.forEach(k => localStorage.removeItem(k));
        }

        // 1. Initialize Telegram WebApp SDK
        telegramService.initWebApp();
        const tgUser = telegramService.getTelegramUser();
        const isTg = telegramService.isTelegram() || !!tgUser;
        setIsInsideTelegram(isTg);
        setTelegramUser(tgUser);

        const isExplicitlyLoggedOut =
          typeof window !== 'undefined' && localStorage.getItem('lomi_explicit_logout') === 'true';

        // 2. Telegram Mini App 1-Click Login
        if (isTg && tgUser) {
          if (!isExplicitlyLoggedOut) {
            try {
              // Connect live to Neon DB
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
              if (apiResult.wallet) {
                localStorage.setItem('lomi_live_balance', apiResult.wallet.balance.toFixed(2));
                localStorage.setItem('lomi_live_bonus', apiResult.wallet.bonus.toFixed(2));
              }
              return;
            } catch (err) {
              console.warn('⚠️ Server auth fallback to local session:', err);
            }
          }
        }

        // 3. Fallback to existing verified session
        if (!isExplicitlyLoggedOut) {
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
      const result = await authService.register(payload);
      localStorage.removeItem('lomi_explicit_logout');
      setUser(result.user);
      setToken(result.token);
      return result.user;
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
    const tgUser = customTgUser || telegramUser || {
      id: 8839201,
      first_name: 'Eyob',
      last_name: 'Asefa',
      username: 'eyu_ase'
    };

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
      }

      telegramService.triggerHaptic('success');
      return { user: mappedUser, isNewUser: apiResult.isNewUser };
    } catch {
      const result = await authService.loginWithTelegram(tgUser, customPhone);
      localStorage.removeItem('lomi_explicit_logout');
      setUser(result.user);
      setToken(result.token);
      telegramService.triggerHaptic('success');
      return { user: result.user, isNewUser: result.isNewUser };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.clearSession();
    localStorage.removeItem('lomi_auth_token');
    localStorage.removeItem('lomi_live_balance');
    localStorage.removeItem('lomi_live_bonus');
    if (typeof window !== 'undefined') {
      localStorage.setItem('lomi_explicit_logout', 'true');
    }
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
