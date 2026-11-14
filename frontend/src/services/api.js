// In development, Vite proxies '/api' to 'http://localhost:5000/api'
// In production on Vercel, '/api' is routed directly to our serverless backend function
const getBaseUrl = () => {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

const BASE_URL = getBaseUrl();

export const getAuthHeaders = () => {
  const token = localStorage.getItem('chat_token');
  return {
    'Content-Type': 'application/json',
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
    } catch (networkErr) {
      // Fallback direct to port 5000 if proxy was unreachable
      res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
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
    } catch (networkErr) {
      // Fallback direct to port 5000 if proxy was unreachable
      res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid credentials');
    if (data.token) {
      localStorage.setItem('chat_token', data.token);
      localStorage.setItem('chat_user', data.username);
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
    } catch (networkErr) {
      res = await fetch('http://localhost:5000/api/auth/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to authenticate SSO');
    if (data.token) {
      localStorage.setItem('chat_token', data.token);
      localStorage.setItem('chat_user', data.username);
    }
    return data;
  },

  async getUsers() {
    let res;
    try {
      res = await fetch(`${BASE_URL}/auth/users`, {
        headers: getAuthHeaders(),
      });
    } catch (networkErr) {
      res = await fetch('http://localhost:5000/api/auth/users', {
        headers: getAuthHeaders(),
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
    return data;
  },

  async getRecentConversations() {
    let res;
    try {
      res = await fetch(`${BASE_URL}/message/conversations/recent`, {
        headers: getAuthHeaders(),
      });
    } catch (networkErr) {
      res = await fetch('http://localhost:5000/api/message/conversations/recent', {
        headers: getAuthHeaders(),
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch recent conversations');
    return data;
  },

  async getMessages(receiver) {
    let res;
    try {
      res = await fetch(`${BASE_URL}/message/${encodeURIComponent(receiver)}`, {
        headers: getAuthHeaders(),
      });
    } catch (networkErr) {
      res = await fetch(`http://localhost:5000/api/message/${encodeURIComponent(receiver)}`, {
        headers: getAuthHeaders(),
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
    return data;
  },

  async sendMessage(receiver, text) {
    let res;
    try {
      res = await fetch(`${BASE_URL}/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ receiver, text }),
      });
    } catch (networkErr) {
      res = await fetch('http://localhost:5000/api/message', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ receiver, text }),
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send message');
    return data;
  },

  logout() {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
  },
};
