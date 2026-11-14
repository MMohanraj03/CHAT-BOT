import React, { useState, useEffect, useCallback } from 'react';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import EmptyChat from './components/EmptyChat';
import Toast from './components/Toast';
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

  // 1. Fetch all registered users & recent conversations from DB
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

  // 2. Fetch conversation messages when activeContact changes
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

      // Update recent chats snippet with the latest message from history
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

  // 3. Initialize Socket.IO connection and attach listeners
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

      // Update recent chats preview snippet
      setRecentChats((prev) => ({
        ...prev,
        [otherParty]: data,
      }));

      // Check if message belongs to currently open chat
      const isOpenChat =
        activeContact &&
        (data.sender === activeContact.username || data.receiver === activeContact.username);

      if (isOpenChat) {
        setMessages((prev) => {
          // Prevent duplicate messages if already present
          if (data._id && prev.some((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
      } else if (data.sender !== currentUser) {
        // Increment unread count for the other party
        setUnreadCounts((prev) => ({
          ...prev,
          [data.sender]: (prev[data.sender] || 0) + 1,
        }));

        // Show toast notification
        setToast({
          sender: data.sender,
          text: data.text,
        });
      }

      // Play pleasant notification sound if received from another user
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

  // 4. Send Message Handler
  const handleSendMessage = async (text) => {
    if (!activeContact?.username || !text.trim() || isSending) return;

    setIsSending(true);
    try {
      // Step A: Save message to MongoDB Atlas via REST API
      const savedMessage = await api.sendMessage(activeContact.username, text.trim());

      // Step B: Emit through Socket.IO for real-time delivery to recipient
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('sendmessage', savedMessage);
      } else {
        // Fallback: manually append if socket is offline
        setMessages((prev) => [...prev, savedMessage]);
      }

      // Step C: Update recent chats
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

  // 5. Auth Success
  const handleAuthSuccess = (name) => {
    setCurrentUser(name);
  };

  // 6. Logout
  const handleLogout = () => {
    api.logout();
    disconnectSocket();
    setCurrentUser('');
    setActiveContact(null);
    setMessages([]);
    setRecentChats({});
    setUnreadCounts({});
  };

  // If not logged in, render the Auth view
  if (!currentUser) {
    return <AuthModal onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden relative font-sans">
      {/* Toast Notification Banner */}
      <Toast
        toast={toast}
        onClose={() => setToast(null)}
        onSelectContact={(contact) => {
          setActiveContact(contact);
        }}
      />

      {/* Responsive layout:
          - On mobile (< md): Sidebar is visible when no contact is selected; ChatWindow is visible when contact is selected.
          - On desktop (>= md): Both Sidebar and ChatWindow/EmptyChat are shown side-by-side.
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
          />
        ) : (
          <EmptyChat currentUser={currentUser} />
        )}
      </div>
    </div>
  );
}
