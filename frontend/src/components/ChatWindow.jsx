import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ArrowLeft,
  Smile,
  Search,
  Circle,
  MoreVertical,
  Check,
  CheckCheck,
  Sparkles,
  X,
  Phone,
  Video,
  Paperclip,
  Mic,
  MicOff,
  Copy,
  Trash2,
  Reply,
  Play,
  Pause,
  Image as ImageIcon,
  Shield,
  Volume2
} from 'lucide-react';
import {
  getAvatarColor,
  formatMessageTime,
  formatDateDivider,
  playCyberSendSound
} from '../utils/sound';

const QUICK_EMOJIS = ['??', '??', '??', '??', '??', '??', '?', '?', '??', '??', '??', '??'];
const REACTION_LIST = ['??', '??', '??', '??', '??', '??', '?'];

export default function ChatWindow({
  currentUser,
  activeContact,
  messages = [],
  onSendMessage,
  onBack,
  isOnline = false,
  isSending = false,
  theme = 'blue',
  onStartCall
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactions, setReactions] = useState({});
  const [activeVoicePlaying, setActiveVoicePlaying] = useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState(null);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isRed = theme === 'red';

  // Auto-scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Focus input on active contact change
  useEffect(() => {
    inputRef.current?.focus();
    setShowEmojiPicker(false);
    setShowSearch(false);
    setSearchTerm('');
    setReplyingTo(null);
    setAttachedImage(null);
  }, [activeContact?.username]);

  // Voice recording timer
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    let text = inputText.trim();

    if (attachedImage) {
      text = `[IMAGE:${attachedImage}] ` + text;
    }

    if (replyingTo) {
      text = `[REPLY:"${replyingTo.sender}: ${replyingTo.text.slice(0, 40)}..."]\n` + text;
    }

    if (!text && !attachedImage) return;

    playCyberSendSound();
    onSendMessage(text);

    setInputText('');
    setAttachedImage(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleSendVoiceNote = () => {
    const duration = recordTimer || 3;
    const voiceMsg = `[VOICE_NOTE:${duration}s] Voice Message`;
    playCyberSendSound();
    onSendMessage(voiceMsg);
    setIsRecording(false);
    setRecordTimer(0);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleAddReaction = (messageId, emoji) => {
    setReactions((prev) => {
      const current = prev[messageId] || [];
      if (current.includes(emoji)) {
        return { ...prev, [messageId]: current.filter((e) => e !== emoji) };
      }
      return { ...prev, [messageId]: [...current, emoji] };
    });
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
        (m.text || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    : messages;

  return (
    <div
      className={`flex-1 h-full flex flex-col relative overflow-hidden transition-colors duration-300 ${
        isRed ? 'bg-[#080205] text-red-50' : 'bg-[#020511] text-slate-100'
      }`}
    >
      {/* 1. WhatsApp Contact Header */}
      <header
        className={`p-3 px-4 border-b flex items-center justify-between backdrop-blur-md z-20 ${
          isRed ? 'bg-[#0e0409]/95 border-red-900/40' : 'bg-[#060b1c]/95 border-cyan-950/60'
        }`}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            title="Back to contacts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Contact Avatar */}
          <div className="relative shrink-0">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarColor(
                activeContact?.username,
                theme
              )} flex items-center justify-center font-black text-white text-sm shadow-md uppercase border ${
                isRed ? 'border-red-500/50' : 'border-cyan-400/50'
              }`}
            >
              {activeContact?.username?.slice(0, 2)}
            </div>
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black"></span>
              </span>
            )}
          </div>

          {/* Contact Name & WhatsApp Online/Typing Status */}
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-white truncate tracking-wide">
                {activeContact?.username}
              </h2>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                  isRed
                    ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                    : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                }`}
              >
                TARGET
              </span>
            </div>
            <p className="text-[10px] font-mono flex items-center gap-1.5">
              {isOnline ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  online
                </span>
              ) : (
                <span className="text-slate-500">last seen recently</span>
              )}
            </p>
          </div>
        </div>

        {/* WhatsApp Action Controls (Phone Call, Video Call, Search, Menu) */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* WhatsApp Voice Call */}
          <button
            type="button"
            onClick={() => onStartCall && onStartCall(activeContact, false)}
            className="p-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition cursor-pointer"
            title="Start WhatsApp Voice Net Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* WhatsApp Video Call */}
          <button
            type="button"
            onClick={() => onStartCall && onStartCall(activeContact, true)}
            className="p-2 rounded-xl text-[#00f0ff] hover:text-cyan-300 hover:bg-cyan-500/10 transition cursor-pointer"
            title="Start WhatsApp HD Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Search in Conversation */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              showSearch
                ? isRed ? 'bg-red-950 text-red-400' : 'bg-cyan-950 text-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Search Messages"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Three-Dots Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-2xl p-1.5 shadow-2xl border z-30 font-mono text-xs ${
                  isRed
                    ? 'bg-[#12050b] border-red-900/60 text-red-100 neon-glow-red'
                    : 'bg-[#080f24] border-cyan-900/60 text-cyan-100 neon-glow-blue'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowSearch(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    alert(`Contact: ${activeContact?.username}\nStatus: Active E2E WhatsApp Protocol`);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Contact Info</span>
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm('Clear messages view for this session?')) {
                      // Session view clear
                      window.location.reload();
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Conversation</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Search In-Chat Bar (Expandable) */}
      {showSearch && (
        <div
          className={`p-2 px-4 border-b flex items-center justify-between text-xs font-mono z-10 ${
            isRed ? 'bg-[#15070e] border-red-900/40 text-red-200' : 'bg-[#0b132c] border-cyan-900/40 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-3.5 h-3.5 opacity-60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Find in conversation..."
              className="bg-transparent outline-none w-full text-xs"
              autoFocus
            />
          </div>
          {searchTerm && (
            <span className="text-[10px] text-slate-400 mr-2">
              {filteredMessages.length} found
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchTerm('');
            }}
            className="p-1 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. WhatsApp Message Stream with Circuit Wallpaper Pattern */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 whatsapp-hacker-wallpaper scrollbar-thin relative z-0">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg ${
                isRed
                  ? 'bg-red-950/40 border-red-800/40 text-red-400 neon-glow-red'
                  : 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400 neon-glow-blue'
              }`}
            >
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-mono font-bold text-white">
              {searchTerm ? 'No matching messages found' : `Direct chat with ${activeContact?.username}`}
            </h3>
            <p className="text-xs text-slate-500 font-mono max-w-xs">
              Messages are end-to-end encrypted with zero logs. Type below or send a voice note to start!
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isMe =
              msg.sender?.toLowerCase().trim() === currentUser?.toLowerCase().trim();
            const showDate =
              index === 0 ||
              formatDateDivider(msg.createdAt) !==
                formatDateDivider(filteredMessages[index - 1]?.createdAt);

            const msgId = msg._id || msg.id || `idx-${index}`;
            const msgReactions = reactions[msgId] || [];

            // Detect Voice Note
            const isVoice = (msg.text || '').startsWith('[VOICE_NOTE');
            // Detect Image Attachment
            const isImage = (msg.text || '').startsWith('[IMAGE:');
            let imgUrl = '';
            let cleanText = msg.text || '';

            if (isImage) {
              const endIdx = cleanText.indexOf(']');
              imgUrl = cleanText.substring(7, endIdx);
              cleanText = cleanText.substring(endIdx + 1).trim();
            }

            // Detect Reply Quote
            let quoteText = '';
            if (cleanText.startsWith('[REPLY:')) {
              const endIdx = cleanText.indexOf(']\n');
              if (endIdx !== -1) {
                quoteText = cleanText.substring(7, endIdx).replace(/^"|"$/g, '');
                cleanText = cleanText.substring(endIdx + 2);
              }
            }

            return (
              <React.Fragment key={msgId}>
                {/* WhatsApp Style Date Divider */}
                {showDate && (
                  <div className="flex items-center justify-center my-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-mono font-black border shadow-sm ${
                        isRed
                          ? 'bg-[#15060f]/90 border-red-900/40 text-red-300'
                          : 'bg-[#081026]/90 border-cyan-900/40 text-cyan-300'
                      }`}
                    >
                      {formatDateDivider(msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col group relative ${
                    isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Floating Emoji Reaction Bar on Hover (WhatsApp Style) */}
                  <div
                    className={`absolute -top-7 hidden group-hover:flex items-center gap-0.5 p-1 rounded-full bg-black/90 border border-white/20 shadow-xl z-20 animate-fade-in ${
                      isMe ? 'right-2' : 'left-2'
                    }`}
                  >
                    {REACTION_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleAddReaction(msgId, emoji)}
                        className="px-1 py-0.5 hover:scale-125 transition text-xs cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                    <div className="w-px h-3 bg-white/20 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => handleCopy(msgId, cleanText)}
                      className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Copy text"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingTo({ sender: msg.sender, text: cleanText })}
                      className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Reply"
                    >
                      <Reply className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Main Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md relative break-words transition-all ${
                      isMe
                        ? isRed
                          ? 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white rounded-tr-none shadow-red-950/50'
                          : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-700 text-white rounded-tr-none shadow-blue-950/50'
                        : isRed
                        ? 'bg-[#150710] text-red-100 border border-red-900/40 rounded-tl-none'
                        : 'bg-[#0a1228] text-cyan-100 border border-cyan-900/40 rounded-tl-none'
                    }`}
                  >
                    {/* Quoted Message Preview if replying */}
                    {quoteText && (
                      <div className="mb-2 p-2 rounded-xl bg-black/40 border-l-2 border-white/60 text-[10px] font-mono opacity-80">
                        {quoteText}
                      </div>
                    )}

                    {/* Image Attachment Preview */}
                    {isImage && imgUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-sm">
                        <img
                          src={imgUrl}
                          alt="Attachment"
                          className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-95"
                          onClick={() => window.open(imgUrl, '_blank')}
                        />
                      </div>
                    )}

                    {/* Voice Note Player */}
                    {isVoice ? (
                      <div className="flex items-center gap-3 py-1 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveVoicePlaying(activeVoicePlaying === msgId ? null : msgId)
                          }
                          className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 cursor-pointer text-white"
                        >
                          {activeVoicePlaying === msgId ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 flex items-center gap-1">
                          {[6, 14, 18, 10, 22, 12, 8, 16, 20, 10, 14, 8].map((h, i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-full ${
                                activeVoicePlaying === msgId ? 'bg-white animate-pulse' : 'bg-white/50'
                              }`}
                              style={{ height: `${h}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono opacity-80 shrink-0">
                          {cleanText.replace('[VOICE_NOTE:', '').split(']')[0] || '0:04'}
                        </span>
                      </div>
                    ) : (
                      /* Text Content */
                      <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
                        {cleanText}
                      </p>
                    )}

                    {/* Bottom Timestamp & WhatsApp Delivery Ticks */}
                    <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] font-mono opacity-70">
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {isMe && (
                        <span
                          className={`flex items-center ml-0.5 ${
                            isRed ? 'text-rose-200' : 'text-cyan-200'
                          }`}
                          title="Read"
                        >
                          {/* WhatsApp Double Blue / Cyan Check */}
                          <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reaction Badges on corner */}
                  {msgReactions.length > 0 && (
                    <div
                      className={`flex items-center gap-0.5 -mt-2 z-10 px-2 py-0.5 rounded-full bg-black/90 border border-white/20 shadow-sm text-[11px] ${
                        isMe ? 'mr-2' : 'ml-2'
                      }`}
                    >
                      {msgReactions.map((r, i) => (
                        <span key={i}>{r}</span>
                      ))}
                      {msgReactions.length > 1 && (
                        <span className="text-[9px] font-mono text-slate-400 font-bold ml-0.5">
                          {msgReactions.length}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Copied toast indicator */}
                  {copiedId === msgId && (
                    <span className="text-[10px] font-mono text-emerald-400 mt-0.5 mr-1">
                      Copied to clipboard!
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. WhatsApp Bottom Input Bar */}
      <footer
        className={`p-2.5 sm:p-3 border-t relative z-10 ${
          isRed ? 'bg-[#0d0409]/95 border-red-900/40' : 'bg-[#060b1c]/95 border-cyan-950/60'
        }`}
      >
        {/* Reply Preview Banner */}
        {replyingTo && (
          <div
            className={`mb-2 p-2 px-3 rounded-xl flex items-center justify-between text-xs font-mono border ${
              isRed ? 'bg-[#15070e] border-red-800/40 text-red-200' : 'bg-[#0b132c] border-cyan-800/40 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Reply className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Replying to <strong>{replyingTo.sender}</strong>: {replyingTo.text}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Image Attachment Preview Banner */}
        {attachedImage && (
          <div className="mb-2 p-2 rounded-xl bg-black/60 border border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={attachedImage} alt="" className="w-10 h-10 object-cover rounded-lg" />
              <span className="text-xs font-mono text-slate-300">Photo attached</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* WhatsApp Voice Recording Active Bar */}
        {isRecording ? (
          <div
            className={`flex items-center justify-between p-2 px-4 rounded-2xl border animate-fade-in ${
              isRed ? 'bg-red-950/70 border-red-500 text-red-300' : 'bg-cyan-950/70 border-cyan-400 text-cyan-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-bold tracking-wider">
                Recording audio... {recordTimer}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecording(false)}
                className="px-3 py-1 rounded-xl text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendVoiceNote}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md cursor-pointer"
              >
                Send Voice
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Form */
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            {/* Attachment Button (Paperclip) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition cursor-pointer"
              title="Attach Photo / Image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Emoji Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  showEmojiPicker
                    ? isRed ? 'bg-red-950 text-red-400' : 'bg-cyan-950 text-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Insert Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Emoji Drawer */}
              {showEmojiPicker && (
                <div
                  className={`absolute bottom-12 left-0 p-2.5 rounded-2xl border shadow-2xl z-30 grid grid-cols-6 gap-1 w-64 ${
                    isRed
                      ? 'bg-[#14060f] border-red-900/60 neon-glow-red'
                      : 'bg-[#081026] border-cyan-900/60 neon-glow-blue'
                  }`}
                >
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="p-1.5 text-base hover:scale-125 transition rounded-lg hover:bg-white/10 cursor-pointer flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeContact?.username}...`}
              className={`flex-1 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-sans transition-all outline-none border ${
                isRed
                  ? 'bg-[#15070f] border-red-900/40 text-red-50 placeholder-red-400/40 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                  : 'bg-[#091128] border-cyan-900/40 text-cyan-50 placeholder-cyan-400/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50'
              }`}
            />

            {/* Voice Message Mic Button or Send Button */}
            {inputText.trim() || attachedImage ? (
              <button
                type="submit"
                disabled={isSending}
                className={`p-2.5 sm:px-4 rounded-2xl font-mono text-xs font-bold text-white shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                  isRed
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 shadow-red-900/50 neon-glow-red'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-900/50 neon-glow-blue'
                }`}
                title="Send Message"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">SEND</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className={`p-2.5 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isRed
                    ? 'bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/40'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-800/40'
                }`}
                title="Record WhatsApp Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </footer>
    </div>
  );
}
