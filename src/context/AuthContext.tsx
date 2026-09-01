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
  sendOtp: (phone: string) => Promise<OtpChallengeResponse>;
  verifyOtp: (phone: string, code: string) => OtpVerificationResult;
  register: (payload: RegisterPayload) => Promise<User>;
  login: (payload: LoginPayload) => Promise<User>;
  loginWithTelegram: (tgUser?: TelegramUser) => Promise<{ user: User; isNewUser: boolean }>;
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

  // Initialize Telegram WebApp and Restore Session
  useEffect(() => {
    try {
      // 1. Initialize TMA
      telegramService.initWebApp();
      const tgUser = telegramService.getTelegramUser();
      const isTg = telegramService.isTelegram() || !!tgUser;
      setIsInsideTelegram(isTg);
      setTelegramUser(tgUser);

      // 2. Restore active session
      const session = authService.getSession();
      if (session && session.user && session.token) {
        setUser(session.user);
        setToken(session.token);
      }
    } catch (err) {
      console.error('Error initializing Telegram WebApp auth:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      setUser(result.user);
      setToken(result.token);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithTelegram = async (customTgUser?: TelegramUser): Promise<{ user: User; isNewUser: boolean }> => {
    const tgUser = customTgUser || telegramUser || {
      id: 8839201,
      first_name: 'Eyob',
      last_name: 'Asefa',
      username: 'eyu_ase'
    };

    setIsLoading(true);
    try {
      const result = await authService.loginWithTelegram(tgUser);
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
