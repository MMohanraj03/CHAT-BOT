import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ArrowLeft,
  Smile,
  Search,
  Circle,
  MoreVertical,
  CheckCheck,
  Sparkles,
  X
} from 'lucide-react';
import { getAvatarColor, formatMessageTime, formatDateDivider } from '../utils/sound';

const QUICK_EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🚀', '😍', '👏', '✨', '💯', '🤝', '🙌', '😎'];

export default function ChatWindow({
  currentUser,
  activeContact,
  messages = [],
  onSendMessage,
  onBack,
  isOnline,
  isSending = false,
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on active contact change
  useEffect(() => {
    inputRef.current?.focus();
    setShowEmojiPicker(false);
    setShowSearch(false);
    setSearchTerm('');
  }, [activeContact?.username]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    onSendMessage(text);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // Filter messages if search is active
  const filteredMessages = searchTerm.trim()
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    : messages;

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 relative overflow-hidden">
      {/* 1. Header */}
      <header className="p-3.5 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-md z-10">
        <div className="flex items-center space-x-3 overflow-hidden">
          {/* Mobile Back Button */}
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Back to Chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Contact Avatar */}
          <div className="relative shrink-0">
            <div
              className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getAvatarColor(
                activeContact.username
              )} flex items-center justify-center font-bold text-white text-sm shadow uppercase`}
            >
              {activeContact.username.slice(0, 2)}
            </div>
            {isOnline ? (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"
                title="Online"
              />
            ) : (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-600 border-2 border-slate-900 rounded-full"
                title="Offline"
              />
            )}
          </div>

          {/* Contact Details */}
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-white truncate">
              {activeContact.username}
            </h2>
            <p className="text-xs flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-medium">Online</span>
                </>
              ) : (
                <span className="text-slate-400">Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              showSearch ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Search in conversation"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Search in conversation banner */}
      {showSearch && (
        <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2 animate-fade-in z-10">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          {searchTerm && (
            <span className="text-[11px] text-slate-400 shrink-0">
              {filteredMessages.length} found
            </span>
          )}
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchTerm('');
            }}
            className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 z-0">
        {filteredMessages.length > 0 ? (
          (() => {
            let lastDate = null;

            return filteredMessages.map((msg, index) => {
              const isMe = (msg.sender || '').toLowerCase().trim() === (currentUser || '').toLowerCase().trim();
              const msgDate = msg.createdAt ? new Date(msg.createdAt).toDateString() : null;
              const showDateDivider = msgDate && msgDate !== lastDate;
              if (showDateDivider) lastDate = msgDate;

              return (
                <React.Fragment key={msg._id || index}>
                  {/* Date Divider */}
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-semibold text-slate-400 shadow-xs">
                        {formatDateDivider(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`flex items-end gap-2 ${
                      isMe ? 'justify-end' : 'justify-start'
                    } animate-fade-in`}
                  >
                    {!isMe && (
                      <div
                        className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${getAvatarColor(
                          activeContact?.username || msg.sender
                        )} flex items-center justify-center font-bold text-white text-[10px] uppercase shadow-xs shrink-0 mb-0.5`}
                        title={activeContact?.username || msg.sender}
                      >
                        {(activeContact?.username || msg.sender).slice(0, 1)}
                      </div>
                    )}

                    <div
                      className={`max-w-[78%] sm:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl text-sm shadow-md break-words ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white rounded-br-xs'
                          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap select-text">
                        {msg.text}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          isMe ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            });
          })()
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Start chatting with {activeContact.username}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Say hello or pick an emoji below to break the ice!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-xs">
              {['👋 Hello!', 'Hey there! 😊', 'What’s up? 🔥'].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => onSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Emoji Drawer */}
      {showEmojiPicker && (
        <div className="p-2.5 px-4 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none animate-fade-in z-10">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
            Quick Emojis:
          </span>
          <div className="flex items-center gap-1.5">
            {QUICK_EMOJIS.map((emoji, eIdx) => (
              <button
                key={eIdx}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-lg transition transform active:scale-125 cursor-pointer shrink-0"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Message Input Bar */}
      <footer className="p-3 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md z-10">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2.5 rounded-2xl transition cursor-pointer shrink-0 ${
              showEmojiPicker
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Emoji drawer"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${activeContact.username}...`}
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 transform active:scale-95"
            title="Send message (Enter)"
          >
            {isSending ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
