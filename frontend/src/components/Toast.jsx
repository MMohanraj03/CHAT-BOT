import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { getAvatarColor } from '../utils/sound';

export default function Toast({ toast, onClose, onSelectContact }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      onClick={() => {
        onSelectContact({ username: toast.sender });
        onClose();
      }}
      className="fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-900 border border-indigo-500/50 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-pop-in cursor-pointer hover:bg-slate-800 transition"
    >
      <div className="flex items-center space-x-3 overflow-hidden">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarColor(
            toast.sender
          )} flex items-center justify-center font-bold text-white text-xs uppercase shrink-0`}
        >
          {toast.sender.slice(0, 2)}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-white flex items-center gap-1">
            <span>{toast.sender}</span>
            <span className="text-[10px] text-indigo-400 font-normal">sent a message</span>
          </p>
          <p className="text-xs text-slate-300 truncate mt-0.5">
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
