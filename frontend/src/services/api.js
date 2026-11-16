// In development, Vite proxies '/api' to 'http://localhost:5000/api'
// In production or fallback, routes directly to https://nezuko-01.vercel.app/api
const CLOUD_API_URL = 'https://nezuko-01.vercel.app/api';

const getBaseUrl = () => {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

const BASE_URL = getBaseUrl();

export const getAuthHeaders = () => {
  const token = localStorage.getItem('chat_token');
  const user = localStorage.getItem('chat_user') || 'Member';
  return {
    'Content-Type': 'application/json',
    'x-user': user,
    'x-username': user,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  async register(username, password) {
    let res;
    try {
      res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Local register fallback');
    } catch {
      res = await fetch(`${CLOUD_API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    }
    const data = await res.json();
    return data;
  },

  async login(username, password) {
    let res;
    try {
      res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Local login fallback');
    } catch {
      res = await fetch(`${CLOUD_API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('chat_token', data.token);
      localStorage.setItem('chat_user', data.username || username);
    }
    return data;
  },

  async sso(username, password = 'pearlbee') {
    let res;
    try {
      res = await fetch(`${BASE_URL}/auth/sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Local sso fallback');
    } catch {
      res = await fetch(`${CLOUD_API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('chat_token', data.token);
      localStorage.setItem('chat_user', data.username || username);
    }
    return data;
  },

  async getUsers() {
    let res;
    try {
      res = await fetch(`${BASE_URL}/auth/users`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Local fetch users fallback');
    } catch {
      res = await fetch(`${CLOUD_API_URL}/auth`, {
        headers: getAuthHeaders(),
      });
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getRecentConversations() {
    let res;
    try {
      res = await fetch(`${BASE_URL}/message/conversations/recent`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Local recent fallback');
    } catch {
      res = await fetch(`${CLOUD_API_URL}/message/conversations/recent`, {
        headers: getAuthHeaders(),
      });
    }
    const data = await res.json();
    return data && typeof data === 'object' ? data : {};
  },

  async getMessages(receiver) {
    let res;
    try {
      res = await fetch(`${BASE_URL}/message/${encodeURIComponent(receiver)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Local messages fallback');
    } catch {
      res = await fetch(`${CLOUD_API_URL}/message/${encodeURIComponent(receiver)}`, {
        headers: getAuthHeaders(),
      });
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async sendMessage(receiver, text) {
    let res;
    try {
      res = await fetch(`${BASE_URL}/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ receiver, text }),
      });
      if (!res.ok) throw new Error('Local send fallback');
    } catch {
      res = await fetch(`${CLOUD_API_URL}/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ receiver, text }),
      });
    }
    const data = await res.json();
    return data;
  },

  logout() {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
  },
};
