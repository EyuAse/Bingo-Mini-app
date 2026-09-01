import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RegisterPayload, LoginPayload, OtpChallengeResponse, OtpVerificationResult } from '../types/auth';
import { TelegramUser } from '../types/telegram';
import { authService } from '../services/authService';
import { telegramService } from '../services/telegramService';
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

  // Initialize Telegram WebApp, Auto-Authenticate & Account Sync
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Initialize Telegram WebApp SDK
        telegramService.initWebApp();
        const tgUser = telegramService.getTelegramUser();
        const isTg = telegramService.isTelegram() || !!tgUser;
        setIsInsideTelegram(isTg);
        setTelegramUser(tgUser);

        const isExplicitlyLoggedOut = typeof window !== 'undefined' && localStorage.getItem('lomi_explicit_logout') === 'true';

        // 2. Multi-Account Handling on Same Device
        if (isTg && tgUser) {
          const session = authService.getSession();
          const activeTgId = `UID-TG-${tgUser.id}`;
          const activeTgUsername = tgUser.username ? tgUser.username.replace(/^@/, '') : '';

          // If session belongs to a different Telegram account on the same phone, clear it!
          if (session && session.user && session.user.id !== activeTgId && session.user.telegramUsername !== activeTgUsername) {
            authService.clearSession();
            localStorage.removeItem('lomi_explicit_logout');
          }

          const existingAccount = authService.checkTelegramUserExists(tgUser.id, tgUser.username);

          // If account exists and user didn't explicitly click "Log Out", auto-login into active account!
          if (existingAccount && !isExplicitlyLoggedOut) {
            const result = await authService.loginWithTelegram(tgUser);
            setUser(result.user);
            setToken(result.token);
            return;
          }

          // If account is brand new on this Telegram account, ensure clean state for Landing page
          if (!existingAccount) {
            authService.clearSession();
            setUser(null);
            setToken(null);
            return;
          }
        }

        // 3. Browser fallback session restore
        if (!isExplicitlyLoggedOut) {
          const session = authService.getSession();
          if (session && session.user && session.token) {
            setUser(session.user);
            setToken(session.token);
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
      const result = await authService.login(payload);
      localStorage.removeItem('lomi_explicit_logout');
      setUser(result.user);
      setToken(result.token);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithTelegram = async (customTgUser?: TelegramUser, customPhone?: string): Promise<{ user: User; isNewUser: boolean }> => {
    const tgUser = customTgUser || telegramUser || {
      id: 8839201,
      first_name: 'Eyob',
      last_name: 'Asefa',
      username: 'eyu_ase'
    };

    setIsLoading(true);
    try {
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
