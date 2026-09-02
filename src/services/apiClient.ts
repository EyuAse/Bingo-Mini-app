/**
 * Lomi Bingo Centralized API Client (Connected to Neon PostgreSQL Backend)
 */

const LIVE_BACKEND_ORIGIN = 'https://bingo-mini-app-30pe.onrender.com';

const API_BASE = (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app'))
  ? `${LIVE_BACKEND_ORIGIN}/api`
  : ((import.meta as any).env?.VITE_API_URL || '/api');

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('lomi_admin_token') || localStorage.getItem('lomi_auth_token'))
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}. Please ensure backend is running.`);
    }
    throw new Error('Connecting to server. Please retry in a moment.');
  }
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `HTTP ${res.status}: Request failed`);
  }
  return data as T;
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = 3, delayMs = 1200): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return fetch(url, options);
}

async function getAdminAuthHeader(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {};
  let token = localStorage.getItem('lomi_admin_token');
  if (!token) {
    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '1234' })
      });
      const data = await res.json();
      if (data.token) {
        token = data.token;
        localStorage.setItem('lomi_admin_token', data.token);
      }
    } catch {}
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const apiClient = {
  // 1. Authentication Endpoints
  auth: {
    async adminLogin(pin: string) {
      const res = await fetchWithRetry(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      const data = await handleResponse<{
        success: boolean;
        token: string;
        user: any;
        wallet?: { balance: number; bonus: number; lockedBalance: number };
      }>(res);

      if (data.token) {
        localStorage.setItem('lomi_admin_token', data.token);
      }

      return data;
    },

    async loginWithTelegram(tgUser: any, customPhone?: string) {
      const payload = {
        telegramId: tgUser.id,
        username: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        photoUrl: tgUser.photo_url,
        phone: customPhone
      };

      const res = await fetchWithRetry(`${API_BASE}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await handleResponse<{
        success: boolean;
        token: string;
        user: any;
        wallet: { balance: number; bonus: number; lockedBalance: number };
        isNewUser: boolean;
      }>(res);

      if (data.token) {
        localStorage.setItem('lomi_auth_token', data.token);
      }

      return data;
    },

    async register(payload: { phone: string; pin: string; fullName?: string; carrier?: string }) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await handleResponse<{
        success: boolean;
        token: string;
        user: any;
        wallet: { balance: number; bonus: number; lockedBalance: number };
      }>(res);

      if (data.token) {
        localStorage.setItem('lomi_auth_token', data.token);
      }

      return data;
    },

    async checkTelegramExists(telegramId: number | string): Promise<boolean> {
      try {
        const res = await fetch(`${API_BASE}/auth/check-telegram/${telegramId}`);
        const data = await handleResponse<{ success: boolean; exists: boolean }>(res);
        return !!data.exists;
      } catch {
        return false;
      }
    },

    async loginWithPin(phone: string, pin: string) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      });

      const data = await handleResponse<{
        success: boolean;
        token: string;
        user: any;
        wallet: { balance: number; bonus: number; lockedBalance: number };
      }>(res);

      if (data.token) {
        localStorage.setItem('lomi_auth_token', data.token);
      }

      return data;
    },

    async getMe() {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse<{
        success: boolean;
        user: any;
        wallet: { balance: number; bonus: number; lockedBalance: number };
      }>(res);
    }
  },

  // 2. Wallet Endpoints
  wallet: {
    async getBalance() {
      const res = await fetch(`${API_BASE}/wallet/balance`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse<{
        success: boolean;
        balance: number;
        bonus: number;
        lockedBalance: number;
        currency: string;
      }>(res);
    },

    async deposit(payload: {
      amount: number;
      paymentMethod: 'Telebirr' | 'CBE';
      playerPhone: string;
      transactionRef?: string;
      receiptImage?: string;
    }) {
      const res = await fetch(`${API_BASE}/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return handleResponse<{
        success: boolean;
        message: string;
        deposit: any;
      }>(res);
    },

    async withdraw(payload: {
      amount: number;
      paymentMethod: 'Telebirr' | 'CBE';
      accountPhone: string;
      accountName?: string;
    }) {
      const res = await fetch(`${API_BASE}/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return handleResponse<{
        success: boolean;
        message: string;
        newBalance: number;
        withdrawal: any;
      }>(res);
    },

    async getTransactions() {
      const res = await fetch(`${API_BASE}/wallet/transactions`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse<{
        success: boolean;
        transactions: any[];
      }>(res);
    }
  },

  // 3. Admin Endpoints (Guaranteed Admin Bearer Token)
  admin: {
    async getUsers() {
      const adminHeaders = await getAdminAuthHeader();
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { ...adminHeaders }
      });
      return handleResponse<{ success: boolean; users: any[] }>(res);
    },

    async getDeposits() {
      const adminHeaders = await getAdminAuthHeader();
      const res = await fetch(`${API_BASE}/admin/deposits`, {
        headers: { ...adminHeaders }
      });
      return handleResponse<{ success: boolean; deposits: any[] }>(res);
    },

    async approveDeposit(id: string) {
      const adminHeaders = await getAdminAuthHeader();
      const res = await fetch(`${API_BASE}/admin/deposits/${id}/approve`, {
        method: 'POST',
        headers: { ...adminHeaders }
      });
      return handleResponse<{ success: boolean; message: string; newBalance: number }>(res);
    },

    async rejectDeposit(id: string, reason?: string) {
      const adminHeaders = await getAdminAuthHeader();
      const res = await fetch(`${API_BASE}/admin/deposits/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders
        },
        body: JSON.stringify({ reason })
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    async getWithdrawals() {
      const adminHeaders = await getAdminAuthHeader();
      const res = await fetch(`${API_BASE}/admin/withdrawals`, {
        headers: { ...adminHeaders }
      });
      return handleResponse<{ success: boolean; withdrawals: any[] }>(res);
    },

    async approveWithdrawal(id: string) {
      const adminHeaders = await getAdminAuthHeader();
      const res = await fetch(`${API_BASE}/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: { ...adminHeaders }
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    async rejectWithdrawal(id: string, reason?: string) {
      const adminHeaders = await getAdminAuthHeader();
      const res = await fetch(`${API_BASE}/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders
        },
        body: JSON.stringify({ reason })
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    async getStats() {
      const adminHeaders = await getAdminAuthHeader();
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { ...adminHeaders }
      });
      return handleResponse<{ success: boolean; stats: any }>(res);
    }
  }
};
