import React from 'react';
import { Terminal, Shield, Zap, Sparkles, MessageSquare, Lock, Radio } from 'lucide-react';

export default function EmptyChat({ currentUser, theme = 'blue' }) {
  const isRed = theme === 'red';

  return (
    <div
      className={`hidden md:flex flex-1 h-full flex-col items-center justify-center p-8 text-center relative overflow-hidden select-none transition-colors duration-300 ${
        isRed ? 'bg-[#060205] text-red-50' : 'bg-[#020511] text-slate-100'
      }`}
    >
      {/* Decorative Cyber Background Pattern & Ambient Glows */}
      <div className={`absolute inset-0 ${isRed ? 'cyber-grid-red' : 'cyber-grid-blue'} opacity-40 pointer-events-none`} />
      <div
        className={`absolute top-1/4 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isRed ? 'bg-red-600/10' : 'bg-cyan-600/10'
        }`}
      />
      <div
        className={`absolute bottom-1/4 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isRed ? 'bg-rose-700/10' : 'bg-blue-600/10'
        }`}
      />

      <div className="max-w-md space-y-5 relative z-10 animate-fade-in font-mono">
        {/* Terminal Icon Frame */}
        <div
          className={`w-20 h-20 rounded-2xl border flex items-center justify-center mx-auto shadow-2xl relative ${
            isRed
              ? 'bg-[#15060f] border-red-700/50 text-red-400 neon-glow-red'
              : 'bg-[#08122a] border-cyan-500/50 text-cyan-400 neon-glow-blue'
          }`}
        >
          <Terminal className="w-10 h-10" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        {/* Welcome Message */}
        <div className="space-y-1.5">
          <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border mb-2 ${
            isRed ? 'bg-red-950/60 border-red-800/40 text-red-400' : 'bg-cyan-950/60 border-cyan-800/40 text-cyan-400'
          }">
            [STATUS: ROOT_SESSION_ACTIVE]
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Welcome to Terminal Chat, {currentUser}!
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Select a target contact from the left HUD sidebar to begin end-to-end encrypted messaging, voice notes, and WhatsApp calls.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="pt-2 grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
          <div
            className={`p-3 rounded-xl border text-xs ${
              isRed
                ? 'bg-[#12050b]/80 border-red-900/40 text-red-200'
                : 'bg-[#091024]/80 border-cyan-900/40 text-cyan-200'
            }`}
          >
            <Radio className={`w-4 h-4 mb-1.5 ${isRed ? 'text-red-400' : 'text-cyan-400'}`} />
            <h4 className="font-bold text-white text-[11px]">Realtime Socket HUD</h4>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Instant message relay & typing indicators</p>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs ${
              isRed
                ? 'bg-[#12050b]/80 border-red-900/40 text-red-200'
                : 'bg-[#091024]/80 border-cyan-900/40 text-cyan-200'
            }`}
          >
            <Lock className={`w-4 h-4 mb-1.5 ${isRed ? 'text-red-400' : 'text-cyan-400'}`} />
            <h4 className="font-bold text-white text-[11px]">E2E Secure Protocol</h4>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Encrypted private messaging channel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
