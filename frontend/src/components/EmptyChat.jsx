import React from 'react';
import { MessageSquareDashed, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function EmptyChat({ currentUser }) {
  return (
    <div className="hidden md:flex flex-1 h-full flex-col items-center justify-center bg-slate-950 p-8 text-center relative overflow-hidden select-none">
      {/* Decorative Glows */}
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md space-y-4 relative z-10 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
          <MessageSquareDashed className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Welcome to Realtime Chat, {currentUser}! 👋
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Select a conversation from the left sidebar or browse registered users to start messaging in real-time.
          </p>
        </div>

        <div className="pt-4 grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <Zap className="w-4 h-4 text-amber-400 mb-1.5" />
            <h4 className="text-xs font-bold text-white">Instant Socket.IO</h4>
            <p className="text-[11px] text-slate-400">Low-latency live message delivery</p>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1.5" />
            <h4 className="text-xs font-bold text-white">Persistent History</h4>
            <p className="text-[11px] text-slate-400">Stored safely in MongoDB Atlas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
