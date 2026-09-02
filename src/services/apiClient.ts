/**
 * Lomi Bingo Centralized API Client (Connected to Neon PostgreSQL Backend)
 */

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('lomi_admin_token') || localStorage.getItem('lomi_auth_token'))
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `HTTP ${res.status}: Request failed`);
  }
  return data as T;
}

export const apiClient = {
  // 1. Authentication Endpoints
  auth: {
    async adminLogin(pin: string) {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      const data = await handleResponse<{
        success: boolean;
        token: string;
        user: any;
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

      const res = await fetch(`${API_BASE}/auth/telegram`, {
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

  // 3. Admin Endpoints
  admin: {
    async getUsers() {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse<{ success: boolean; users: any[] }>(res);
    },

    async getDeposits() {
      const res = await fetch(`${API_BASE}/admin/deposits`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse<{ success: boolean; deposits: any[] }>(res);
    },

    async approveDeposit(id: string) {
      const res = await fetch(`${API_BASE}/admin/deposits/${id}/approve`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
      return handleResponse<{ success: boolean; message: string; newBalance: number }>(res);
    },

    async rejectDeposit(id: string, reason?: string) {
      const res = await fetch(`${API_BASE}/admin/deposits/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ reason })
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    async getWithdrawals() {
      const res = await fetch(`${API_BASE}/admin/withdrawals`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse<{ success: boolean; withdrawals: any[] }>(res);
    },

    async approveWithdrawal(id: string) {
      const res = await fetch(`${API_BASE}/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    async rejectWithdrawal(id: string, reason?: string) {
      const res = await fetch(`${API_BASE}/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ reason })
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    async getStats() {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse<{ success: boolean; stats: any }>(res);
    }
  }
};
