import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env?.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  return null;
};

let socket = null;

export const initSocket = (username) => {
  const targetUrl = getSocketUrl();
  if (!targetUrl) {
    // In serverless Vercel without a persistent socket server, HTTP auto-polling handles live messaging
    return {
      connected: false,
      emit: () => {},
      on: () => {},
      off: () => {},
      disconnect: () => {},
    };
  }

  if (socket) {
    if (username && socket.connected) {
      socket.emit('userOnline', username);
    }
    return socket;
  }

  console.log('[Socket] Initializing connection to:', targetUrl);

  socket = io(targetUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to server, ID:', socket.id);
    if (username) {
      socket.emit('userOnline', username);
    }
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection note:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket && typeof socket.disconnect === 'function') {
    socket.disconnect();
    socket = null;
  }
};
