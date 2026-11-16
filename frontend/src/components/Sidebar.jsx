import React, { useState } from 'react';
import {
  Search,
  LogOut,
  Users,
  MessageSquare,
  Circle,
  Sparkles,
  X,
  Radio,
  Flame,
  Zap,
  Shield,
  Terminal,
  Palette
} from 'lucide-react';
import { getAvatarColor, formatMessageTime } from '../utils/sound';

export default function Sidebar({
  currentUser,
  users = [],
  activeContact,
  onSelectContact,
  onlineUsers = [],
  recentChats = {},
  unreadCounts = {},
  onLogout,
  theme = 'blue',
  onToggleTheme
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'online'

  const isRed = theme === 'red';

  // Filter out the current user completely so you NEVER see your own name in the list of contacts
  const otherUsers = users.filter(
    (u) => u && u.username && u.username.toLowerCase().trim() !== (currentUser || '').toLowerCase().trim()
  );

  // Filter based on search query
  const searchLower = search.toLowerCase().trim();
  const searchedUsers = otherUsers.filter((u) =>
    u.username.toLowerCase().includes(searchLower)
  );

  // Sort: Unread first -> Most recent chat -> Online -> Alphabetical
  const sortedUsers = [...searchedUsers].sort((a, b) => {
    const unreadA = unreadCounts[a.username] || 0;
    const unreadB = unreadCounts[b.username] || 0;
    if (unreadA !== unreadB) return unreadB - unreadA;

    const timeA = new Date(recentChats[a.username]?.createdAt || 0).getTime();
    const timeB = new Date(recentChats[b.username]?.createdAt || 0).getTime();
    if (timeA > 0 || timeB > 0) return timeB - timeA;

    const isOnlineA = onlineUsers.includes(a.username) ? 1 : 0;
    const isOnlineB = onlineUsers.includes(b.username) ? 1 : 0;
    if (isOnlineA !== isOnlineB) return isOnlineB - isOnlineA;

    return a.username.localeCompare(b.username);
  });

  // Apply quick filter tabs
  const displayedUsers = sortedUsers.filter((user) => {
    if (filter === 'unread') return (unreadCounts[user.username] || 0) > 0;
    if (filter === 'online') return onlineUsers.includes(user.username);
    return true; // 'all'
  });

  const totalUnread = Object.values(unreadCounts).reduce((acc, c) => acc + (c || 0), 0);
  const onlineCount = users.filter((u) => onlineUsers.includes(u.username)).length;

  return (
    <aside
      className={`w-full md:w-80 lg:w-96 h-full flex flex-col shrink-0 select-none border-r transition-colors duration-300 ${
        isRed
          ? 'bg-[#0a0306] border-red-900/40 text-red-50'
          : 'bg-[#030712] border-cyan-950/60 text-slate-100'
      }`}
    >
      {/* 1. Hacker HUD Header: Current User Profile & Theme Switcher */}
      <div
        className={`p-3.5 px-4 border-b flex items-center justify-between backdrop-blur-md relative z-10 ${
          isRed ? 'bg-[#0f0409]/90 border-red-900/40' : 'bg-[#060c1d]/90 border-cyan-950/60'
        }`}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="relative shrink-0">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarColor(
                currentUser,
                theme
              )} flex items-center justify-center font-black text-white text-sm shadow-md uppercase border ${
                isRed ? 'border-red-500/50' : 'border-cyan-400/50'
              }`}
            >
              {currentUser.slice(0, 2)}
            </div>
            {/* Online Pulse */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-black"></span>
            </span>
          </div>

          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-white truncate tracking-wide">
                {currentUser}
              </h2>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                  isRed
                    ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                    : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                }`}
              >
                {isRed ? 'ROOT_RED' : 'NODE_BLUE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              WhatsApp Encrypted
            </p>
          </div>
        </div>

        {/* Action Controls: Theme Switcher & Logout */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Hacker Theme Switcher Pill */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
              isRed
                ? 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border-red-600/50 neon-glow-red'
                : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/50 neon-glow-blue'
            }`}
            title={`Switch to ${isRed ? 'Cyber Blue' : 'Cyber Red'} theme`}
          >
            <Palette className="w-3 h-3" />
            <span>{isRed ? 'RED' : 'BLUE'}</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. WhatsApp Style Search Bar */}
      <div className={`p-3 border-b ${isRed ? 'border-red-950 bg-[#0d0408]/60' : 'border-slate-900 bg-[#050917]/60'}`}>
        <div className="relative flex items-center">
          <Search
            className={`w-3.5 h-3.5 absolute left-3 pointer-events-none ${
              isRed ? 'text-red-400/70' : 'text-cyan-400/70'
            }`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start new chat..."
            className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-mono transition-all outline-none border ${
              isRed
                ? 'bg-[#15070f] border-red-900/40 text-red-100 placeholder-red-400/40 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                : 'bg-[#0a1128] border-cyan-900/40 text-cyan-100 placeholder-cyan-400/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50'
            }`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* WhatsApp Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
              filter === 'all'
                ? isRed
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            ALL ({otherUsers.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
              filter === 'unread'
                ? isRed
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <span>UNREAD</span>
            {totalUnread > 0 && (
              <span className={`px-1 rounded-full text-[9px] ${
                filter === 'unread' ? 'bg-black text-white' : isRed ? 'bg-red-600 text-white' : 'bg-cyan-500 text-black'
              }`}>
                {totalUnread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilter('online')}
            className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
              filter === 'online'
                ? isRed
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>ONLINE ({onlineCount})</span>
          </button>
        </div>
      </div>

      {/* 3. WhatsApp Style Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
        {displayedUsers.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-mono">
              {search ? 'No contacts match search query.' : 'No active contacts found.'}
            </p>
          </div>
        ) : (
          displayedUsers.map((user) => {
            const isSelected = activeContact?.username === user.username;
            const isUserOnline = onlineUsers.includes(user.username);
            const unread = unreadCounts[user.username] || 0;
            const lastMsg = recentChats[user.username];
            const isMeLastSender = lastMsg?.sender === currentUser;

            return (
              <div
                key={user.username}
                onClick={() => onSelectContact(user)}
                className={`p-3 px-3.5 flex items-center space-x-3 transition cursor-pointer relative group ${
                  isSelected
                    ? isRed
                      ? 'bg-red-950/70 border-l-4 border-red-500'
                      : 'bg-cyan-950/70 border-l-4 border-cyan-400'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                {/* Contact Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${getAvatarColor(
                      user.username,
                      theme
                    )} flex items-center justify-center font-black text-white text-sm shadow-md uppercase border ${
                      isSelected
                        ? isRed ? 'border-red-400' : 'border-cyan-300'
                        : 'border-white/10'
                    }`}
                  >
                    {user.username.slice(0, 2)}
                  </div>
                  {/* Status beacon */}
                  {isUserOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black"></span>
                    </span>
                  )}
                </div>

                {/* Contact Info & Message Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-xs font-bold truncate tracking-wide ${
                        isSelected
                          ? 'text-white'
                          : unread > 0
                          ? isRed ? 'text-red-300 font-black' : 'text-cyan-300 font-black'
                          : 'text-slate-200'
                      }`}
                    >
                      {user.username}
                    </span>
                    {lastMsg?.createdAt && (
                      <span
                        className={`text-[10px] font-mono shrink-0 ml-1 ${
                          unread > 0
                            ? isRed ? 'text-red-400 font-bold' : 'text-cyan-400 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatMessageTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`text-[11px] truncate leading-tight font-mono ${
                        unread > 0
                          ? 'text-slate-200 font-bold'
                          : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {lastMsg ? (
                        <>
                          {isMeLastSender && <span className="text-slate-500 mr-1">You:</span>}
                          {lastMsg.text}
                        </>
                      ) : (
                        <span className="text-slate-600 italic">No messages yet</span>
                      )}
                    </p>

                    {/* WhatsApp Style Unread Counter */}
                    {unread > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black shrink-0 ${
                          isRed
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-cyan-500 text-slate-950 shadow-sm'
                        }`}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Bottom Footer Security Badge */}
      <div
        className={`p-2.5 px-4 border-t text-[10px] font-mono flex items-center justify-between text-slate-500 ${
          isRed ? 'border-red-950/60 bg-[#070204]' : 'border-slate-900 bg-[#020510]'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Terminal className={`w-3 h-3 ${isRed ? 'text-red-500' : 'text-cyan-400'}`} />
          <span>CIPHER_AES_256</span>
        </span>
        <span className="text-[9px] text-slate-600">v2.4 HACKER EDITION</span>
      </div>
    </aside>
  );
}
