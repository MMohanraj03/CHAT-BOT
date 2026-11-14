import React, { useState } from 'react';
import { Search, LogOut, Users, MessageSquare, Circle, Sparkles, X, Radio, MessageCircle } from 'lucide-react';
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
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'online', 'recent'

  // Filter out the current user completely so you NEVER see your own name in the list of contacts
  const otherUsers = users.filter(
    (u) => u && u.username && u.username.toLowerCase().trim() !== (currentUser || '').toLowerCase().trim()
  );

  // Filter based on search query
  const searchLower = search.toLowerCase().trim();
  const searchedUsers = otherUsers.filter((u) =>
    u.username.toLowerCase().includes(searchLower)
  );

  // Group / sort users:
  // 1. Unread messages first
  // 2. Recent messages next (most recent first)
  // 3. Online users next
  // 4. Alphabetical / remaining users
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
    if (filter === 'online') return onlineUsers.includes(user.username);
    if (filter === 'recent') return !!recentChats[user.username];
    return true; // 'all'
  });

  const onlineCount = users.filter((u) => onlineUsers.includes(u.username)).length;
  const recentCount = users.filter((u) => !!recentChats[u.username]).length;

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-slate-900 border-r border-slate-800 shrink-0 select-none">
      {/* 1. Header: Current User Profile & Logout */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="relative">
            <div
              className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${getAvatarColor(
                currentUser
              )} flex items-center justify-center font-bold text-white text-base shadow-md uppercase`}
            >
              {currentUser?.slice(0, 2) || 'ME'}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"
              title="You are Online"
            />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
              <span>{currentUser}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-semibold uppercase tracking-wider">
                You
              </span>
            </h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
              <span>Connected</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Sign Out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Search Bar */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search all contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Quick Filter Tabs (All, Online, Recent) */}
      <div className="grid grid-cols-3 p-1.5 mx-3 my-2 bg-slate-950/60 border border-slate-800/70 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('online')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
            filter === 'online'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>Online</span>
          {onlineCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {onlineCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilter('recent')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
            filter === 'recent'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Recent</span>
          {recentCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {recentCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. All Contacts List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {displayedUsers.length > 0 ? (
          displayedUsers.map((user) => {
            const isOnline = onlineUsers.includes(user.username);
            const isSelected = activeContact?.username === user.username;
            const recent = recentChats[user.username];
            const unread = unreadCounts[user.username] || 0;

            return (
              <div
                key={user._id || user.username}
                onClick={() => onSelectContact(user)}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : 'hover:bg-slate-800/60 text-slate-200 border border-transparent'
                }`}
              >
                {/* Avatar with live status indicator */}
                <div className="relative shrink-0">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${getAvatarColor(
                      user.username
                    )} flex items-center justify-center font-bold text-white text-sm shadow uppercase`}
                  >
                    {user.username.slice(0, 2)}
                  </div>
                  {isOnline ? (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"
                      title="Online"
                    />
                  ) : (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-600 border-2 border-slate-900 rounded-full"
                      title="Offline"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-semibold truncate text-white">
                      {user.username}
                    </h3>
                    {recent?.createdAt && (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatMessageTime(recent.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 truncate pr-2">
                      {recent?.text ? (
                        <span>
                          {(recent.sender || '').toLowerCase().trim() === (currentUser || '').toLowerCase().trim() ? 'You: ' : ''}
                          {recent.text}
                        </span>
                      ) : isOnline ? (
                        <span className="text-emerald-400 font-medium">Online now • Say hi 👋</span>
                      ) : (
                        <span className="text-slate-500">Tap to start chat</span>
                      )}
                    </p>

                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white font-bold text-[10px] shrink-0 animate-bounce">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4 text-slate-500 space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
            <p className="text-xs">
              {filter === 'online'
                ? 'No other users currently online.'
                : filter === 'recent'
                ? 'No recent conversations yet. Switch to "All" to start a chat!'
                : 'No users found matching your search.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 cursor-pointer"
              >
                View all {users.length} registered users
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{onlineCount} online</span>
        </span>
        <span className="text-slate-400 font-medium">{users.length} registered contacts</span>
      </div>
    </aside>
  );
}
