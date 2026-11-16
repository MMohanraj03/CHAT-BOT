// Dual-layer Cloud & Local API client for Chat Bot
export const CLOUD_API_URL = 'https://nezuko-01.vercel.app/api';

const isLocal = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
export const API_BASE = isLocal ? 'http://localhost:5000/api' : CLOUD_API_URL;

export const DEFAULT_MEMBERS = [
  { _id: 'u-joker', username: 'joker', avatar: '/avatars/joker.jpg' },
  { _id: 'u-Mohanraj', username: 'Mohanraj', avatar: '/avatars/joker.jpg' },
  { _id: 'u-GOD', username: 'GOD', avatar: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=150&q=80' },
  { _id: 'u-nezuko', username: 'nezuko', avatar: '/avatars/nezuko.jpg' },
  { _id: 'u-Dora', username: 'Dora', avatar: '/logo_eye.jpg' },
  { _id: 'u-Ruler', username: 'Ruler', avatar: '/logo_eye.jpg' },
];

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
    const body = { username, password };
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (isLocal) {
          fetch(`${CLOUD_API_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).catch(() => {});
        }
        return data;
      }
    } catch {}

    const res2 = await fetch(`${CLOUD_API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res2.json();
  },

  async login(username, password) {
    const body = { username, password };
    let data = null;
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        data = await res.json();
        if (isLocal) {
          fetch(`${CLOUD_API_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).catch(() => {});
        }
      }
    } catch {}

    if (!data || !data.token) {
      const res2 = await fetch(`${CLOUD_API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      data = await res2.json();
    }

    if (data && (data.token || data.username)) {
      localStorage.setItem('chat_token', data.token || 'nezuko_jwt_' + btoa(username));
      localStorage.setItem('chat_user', data.username || username);
    }
    return data || { username };
  },

  async sso(username, password = 'pearlbee') {
    return this.login(username, password);
  },

  async getUsers() {
    let list = [];
    try {
      const res = await fetch(`${API_BASE}/auth`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          list = data;
        }
      }
    } catch (err) {
      console.warn('[API] getUsers primary note:', err.message);
    }

    if (list.length === 0) {
      try {
        const res2 = await fetch(`${CLOUD_API_URL}/auth`, {
          headers: { Accept: 'application/json' },
        });
        if (res2.ok) {
          const data2 = await res2.json();
          if (Array.isArray(data2)) list = data2;
        }
      } catch {}
    }

    // Always merge authoritative registered members with DEFAULT_MEMBERS
    const map = new Map();
    DEFAULT_MEMBERS.forEach((m) => map.set(m.username.toLowerCase(), m));
    list.forEach((m) => {
      if (m && m.username) {
        map.set(m.username.toLowerCase(), {
          _id: m._id || `u-${m.username}`,
          username: m.username,
          avatar: m.avatar || '/logo_eye.jpg',
          createdAt: m.createdAt,
        });
      }
    });

    return Array.from(map.values());
  },

  async getRecentConversations() {
    const user = (typeof localStorage !== 'undefined' ? localStorage.getItem('chat_user') : '') || '';
    try {
      const res = await fetch(`${API_BASE}/message/conversations/recent?user=${encodeURIComponent(user)}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}

    try {
      const res2 = await fetch(`${CLOUD_API_URL}/private-chat?user=${encodeURIComponent(user)}`, {
        headers: { Accept: 'application/json' },
      });
      if (res2.ok) {
        const data = await res2.json();
        return data.recentChats || {};
      }
    } catch {}

    return {};
  },

  async getMessages(receiver) {
    if (!receiver) return [];
    const currentUser = (typeof localStorage !== 'undefined' ? localStorage.getItem('chat_user') : '') || '';
    try {
      const res = await fetch(`${API_BASE}/message/${encodeURIComponent(receiver)}?user=${encodeURIComponent(currentUser)}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {}

    try {
      const res2 = await fetch(`${CLOUD_API_URL}/private-chat?user=${encodeURIComponent(currentUser)}&with=${encodeURIComponent(receiver)}`, {
        headers: { Accept: 'application/json' },
      });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && Array.isArray(data2.messages)) return data2.messages;
      }
    } catch {}

    return [];
  },

  async sendMessage(receiver, text) {
    const currentUser = (typeof localStorage !== 'undefined' ? localStorage.getItem('chat_user') : '') || 'Member';
    const body = { sender: currentUser, receiver, text };

    try {
      const res = await fetch(`${API_BASE}/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (isLocal) {
          fetch(`${CLOUD_API_URL}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user': currentUser },
            body: JSON.stringify(body)
          }).catch(() => {});
        }
        return data;
      }
    } catch {}

    try {
      const res2 = await fetch(`${CLOUD_API_URL}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user': currentUser },
        body: JSON.stringify(body),
      });
      if (res2.ok) {
        return await res2.json();
      }
    } catch {}

    const res3 = await fetch(`${CLOUD_API_URL}/private-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data3 = await res3.json();
    return data3.message || { _id: `msg-${Date.now()}`, sender: currentUser, receiver, text, createdAt: Date.now() };
  },

  logout() {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
  },
};
