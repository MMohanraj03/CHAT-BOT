import React, { useState, useEffect, useCallback } from 'react';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import EmptyChat from './components/EmptyChat';
import Toast from './components/Toast';
import CallModal from './components/CallModal';
import { api } from './services/api';
import { initSocket, getSocket, disconnectSocket } from './services/socket';
import { playMessageChime } from './utils/sound';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('chat_user') || '');
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recentChats, setRecentChats] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [toast, setToast] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoMessage, setSsoMessage] = useState('');

  // Hacker Theme: 'red' | 'blue'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('chat_hacker_theme') || 'blue';
    } catch {
      return 'blue';
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'red' ? 'blue' : 'red';
    setTheme(nextTheme);
    try {
      localStorage.setItem('chat_hacker_theme', nextTheme);
    } catch {}
  };

  // WhatsApp Call Modal State
  const [callModal, setCallModal] = useState({
    isOpen: false,
    contact: null,
    isVideo: false,
  });

  const handleStartCall = (contact, isVideo = false) => {
    setCallModal({
      isOpen: true,
      contact: contact || activeContact,
      isVideo,
    });
  };

  const handleEndCall = () => {
    setCallModal({ isOpen: false, contact: null, isVideo: false });
  };

  // 1. SSO Auto-Login / Auto-Register from NEZUKO site
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ssoUser = (params.get('sso_user') || params.get('user') || params.get('name') || '').trim();
    const ssoPass = (params.get('sso_pass') || params.get('pass') || params.get('pwd') || 'pearlbee').trim();
    const chatWith = (params.get('chatWith') || params.get('to') || '').trim();

    if (!ssoUser) return;

    const performSSO = async () => {
      setSsoLoading(true);
      setSsoMessage(`Connecting as "${ssoUser}" from NEZUKO...`);
      try {
        let loginData = null;
        try {
          loginData = await api.sso(ssoUser, ssoPass);
        } catch {
          try {
            loginData = await api.login(ssoUser, ssoPass);
          } catch {
            try {
              await api.register(ssoUser, ssoPass);
            } catch {}
            loginData = await api.login(ssoUser, ssoPass);
          }
        }

        if (loginData && loginData.username) {
          setCurrentUser(loginData.username);
          if (chatWith) {
            setActiveContact({ username: chatWith });
          }
        }
      } catch (err) {
        console.error('[SSO Error]:', err.message);
      } finally {
        setSsoLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    performSSO();
  }, []);

  // 2. Fetch all registered users & recent conversations
  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoadingUsers(true);
      const [userList, recentMap] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getRecentConversations().catch(() => ({})),
      ]);
      const otherUsers = (userList || []).filter(
        (u) => u && u.username && u.username.toLowerCase().trim() !== currentUser.toLowerCase().trim()
      );
      setUsers(otherUsers);
      if (recentMap && typeof recentMap === 'object') {
        setRecentChats((prev) => ({ ...recentMap, ...prev }));
      }
    } catch (err) {
      console.warn('[App] Failed to load users:', err.message);
      if (err.message.includes('token') || err.message.includes('401')) {
        handleLogout();
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUser]);

  // 3. Fetch conversation messages when activeContact changes
  const fetchConversation = useCallback(async (contactUsername) => {
    if (!contactUsername) {
      setMessages([]);
      return;
    }
    try {
      const history = await api.getMessages(contactUsername);
      setMessages(history || []);

      // Clear unread badge for this contact
      setUnreadCounts((prev) => ({
        ...prev,
        [contactUsername]: 0,
      }));

      if (history && history.length > 0) {
        const lastMsg = history[history.length - 1];
        setRecentChats((prev) => ({
          ...prev,
          [contactUsername]: lastMsg,
        }));
      }
    } catch (err) {
      console.error('[App] Failed to load messages:', err.message);
    }
  }, []);

  // When activeContact changes, load conversation
  useEffect(() => {
    if (activeContact?.username) {
      fetchConversation(activeContact.username);
    }
  }, [activeContact, fetchConversation]);

  // 4. Live Auto-Polling for Active Conversation (Ensures instant updates on Vercel)
  useEffect(() => {
    if (!currentUser || !activeContact?.username) return;
    const pollTimer = setInterval(() => {
      fetchConversation(activeContact.username);
    }, 2500);
    return () => clearInterval(pollTimer);
  }, [currentUser, activeContact?.username, fetchConversation]);

  // 5. Initialize Socket.IO connection and attach listeners
  useEffect(() => {
    if (!currentUser) return;

    fetchUsers();

    const socket = initSocket(currentUser);

    const handleOnline = (userList) => {
      if (Array.isArray(userList)) {
        setOnlineUsers(userList);
      }
    };

    socket.on('onlineUser', handleOnline);
    socket.on('onlineuser', handleOnline);

    const handleIncomingMessage = (data) => {
      if (!data) return;

      const otherParty = data.sender === currentUser ? data.receiver : data.sender;

      setRecentChats((prev) => ({
        ...prev,
        [otherParty]: data,
      }));

      const isOpenChat =
        activeContact &&
        (data.sender === activeContact.username || data.receiver === activeContact.username);

      if (isOpenChat) {
        setMessages((prev) => {
          if (data._id && prev.some((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
      } else if (data.sender !== currentUser) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.sender]: (prev[data.sender] || 0) + 1,
        }));

        setToast({
          sender: data.sender,
          text: data.text,
        });
      }

      if (data.sender !== currentUser) {
        playMessageChime();
      }
    };

    socket.on('receivermessage', handleIncomingMessage);

    const pollInterval = setInterval(() => {
      fetchUsers();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      socket.off('onlineUser', handleOnline);
      socket.off('onlineuser', handleOnline);
      socket.off('receivermessage', handleIncomingMessage);
    };
  }, [currentUser, activeContact, fetchUsers]);

  // 6. Send Message Handler
  const handleSendMessage = async (text) => {
    if (!activeContact?.username || !text.trim() || isSending) return;

    setIsSending(true);
    try {
      const savedMessage = await api.sendMessage(activeContact.username, text.trim());

      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('sendmessage', savedMessage);
      } else {
        setMessages((prev) => [...prev, savedMessage]);
      }

      setRecentChats((prev) => ({
        ...prev,
        [activeContact.username]: savedMessage,
      }));
    } catch (err) {
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleAuthSuccess = (name) => {
    setCurrentUser(name);
  };

  const handleLogout = () => {
    api.logout();
    disconnectSocket();
    setCurrentUser('');
    setActiveContact(null);
    setMessages([]);
    setRecentChats({});
    setUnreadCounts({});
  };

  // SSO Loading splash
  if (ssoLoading) {
    const isRed = theme === 'red';
    return (
      <div
        className={`h-screen w-screen flex flex-col items-center justify-center space-y-4 font-mono ${
          isRed ? 'bg-[#060204] text-red-50' : 'bg-[#020511] text-cyan-50'
        }`}
      >
        <div
          className={`w-12 h-12 border-4 rounded-full animate-spin ${
            isRed ? 'border-red-500/20 border-t-red-500' : 'border-cyan-500/20 border-t-cyan-400'
          }`}
        />
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-white tracking-widest">
            INITIALIZING HACKER SESSION...
          </h3>
          <p className="text-xs text-slate-400">{ssoMessage}</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the Auth view
  if (!currentUser) {
    return (
      <AuthModal
        onAuthSuccess={handleAuthSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const isRed = theme === 'red';

  return (
    <div
      className={`h-screen w-screen flex overflow-hidden relative font-sans ${
        isRed ? 'theme-red bg-[#060204]' : 'theme-blue bg-[#020511]'
      }`}
    >
      {/* Toast Notification Banner */}
      <Toast
        toast={toast}
        onClose={() => setToast(null)}
        onSelectContact={(contact) => setActiveContact(contact)}
        theme={theme}
      />

      {/* WhatsApp Audio / Video Call Modal */}
      {callModal.isOpen && (
        <CallModal
          contact={callModal.contact}
          isVideo={callModal.isVideo}
          theme={theme}
          onClose={handleEndCall}
        />
      )}

      {/* Responsive layout:
          - On mobile (< md): Sidebar when no contact selected, ChatWindow when contact selected.
          - On desktop (>= md): Both side-by-side.
      */}
      <div className={`h-full w-full md:w-auto ${activeContact ? 'hidden md:block' : 'block'}`}>
        <Sidebar
          currentUser={currentUser}
          users={users}
          activeContact={activeContact}
          onSelectContact={(user) => setActiveContact(user)}
          onlineUsers={onlineUsers}
          recentChats={recentChats}
          unreadCounts={unreadCounts}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>

      <div className={`flex-1 h-full ${activeContact ? 'block' : 'hidden md:block'}`}>
        {activeContact ? (
          <ChatWindow
            currentUser={currentUser}
            activeContact={activeContact}
            messages={messages}
            onSendMessage={handleSendMessage}
            onBack={() => setActiveContact(null)}
            isOnline={onlineUsers.includes(activeContact.username)}
            isSending={isSending}
            theme={theme}
            onStartCall={handleStartCall}
          />
        ) : (
          <EmptyChat currentUser={currentUser} theme={theme} />
        )}
      </div>
    </div>
  );
}
