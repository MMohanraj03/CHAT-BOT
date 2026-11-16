import React, { useEffect } from 'react';
import { MessageSquare, X, Bell } from 'lucide-react';
import { getAvatarColor } from '../utils/sound';

export default function Toast({ toast, onClose, onSelectContact, theme = 'blue' }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isRed = theme === 'red';

  return (
    <div
      onClick={() => {
        onSelectContact({ username: toast.sender });
        onClose();
      }}
      className={`fixed top-4 right-4 z-50 max-w-sm w-full rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-pop-in cursor-pointer border backdrop-blur-md ${
        isRed
          ? 'bg-[#14060f]/95 border-red-500/50 text-red-100 neon-glow-red hover:bg-[#1a0814]'
          : 'bg-[#081026]/95 border-cyan-400/50 text-cyan-100 neon-glow-blue hover:bg-[#0c1635]'
      }`}
    >
      <div className="flex items-center space-x-3 overflow-hidden">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarColor(
            toast.sender,
            theme
          )} flex items-center justify-center font-black text-white text-xs uppercase shrink-0 border ${
            isRed ? 'border-red-400' : 'border-cyan-300'
          }`}
        >
          {toast.sender.slice(0, 2)}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-white flex items-center gap-1">
            <span>{toast.sender}</span>
            <span className={`text-[10px] font-mono ${isRed ? 'text-red-400' : 'text-cyan-400'}`}>
              new incoming message
            </span>
          </p>
          <p className="text-xs text-slate-300 truncate mt-0.5 font-sans">
            {toast.text}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
