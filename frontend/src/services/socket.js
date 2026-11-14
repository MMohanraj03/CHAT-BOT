import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

let socket = null;

export const initSocket = (username) => {
  if (socket) {
    if (username && socket.connected) {
      socket.emit('userOnline', username);
    }
    return socket;
  }

  const targetUrl = getSocketUrl();
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
    console.warn('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
