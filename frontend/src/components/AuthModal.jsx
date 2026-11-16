import React, { useState } from 'react';
import { Terminal, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, Palette, Shield } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ onAuthSuccess, theme = 'blue', onToggleTheme }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isRed = theme === 'red';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        await api.register(username.trim(), password.trim());
        setSuccessMsg('Account registered successfully! Now logging you in...');
        const loginData = await api.login(username.trim(), password.trim());
        onAuthSuccess(loginData.username);
      } else {
        const loginData = await api.login(username.trim(), password.trim());
        onAuthSuccess(loginData.username);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-mono transition-colors duration-300 ${
        isRed ? 'bg-[#060204] text-red-50' : 'bg-[#020511] text-slate-100'
      }`}
    >
      {/* Background Matrix Grid */}
      <div className={`absolute inset-0 ${isRed ? 'cyber-grid-red' : 'cyber-grid-blue'} opacity-40 pointer-events-none`} />
      <div
        className={`absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isRed ? 'bg-red-600/15' : 'bg-cyan-600/15'
        }`}
      />
      <div
        className={`absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isRed ? 'bg-rose-700/15' : 'bg-blue-600/15'
        }`}
      />

      <div
        className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10 border backdrop-blur-xl ${
          isRed
            ? 'bg-[#0f0409]/95 border-red-800/40 neon-glow-red'
            : 'bg-[#070e24]/95 border-cyan-800/40 neon-glow-blue'
        }`}
      >
        {/* Top Bar Switcher */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>SYSTEM ENCRYPTED</span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
              isRed
                ? 'bg-red-950/70 border-red-600/50 text-red-300'
                : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
            }`}
          >
            <Palette className="w-3 h-3" />
            <span>{isRed ? 'RED HACKER' : 'BLUE HACKER'}</span>
          </button>
        </div>

        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border mb-3 shadow-lg ${
              isRed
                ? 'bg-[#1b0812] border-red-500/50 text-red-400 neon-glow-red'
                : 'bg-[#0a1636] border-cyan-400/50 text-cyan-400 neon-glow-blue'
            }`}
          >
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>TERMINAL CHAT</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {isRegister ? 'Register new root credentials' : 'Authenticate root session to enter'}
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1 bg-black/50 border border-white/10 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              !isRegister
                ? isRed
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            LOG IN
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              isRegister
                ? isRed
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase">
              Username
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. joker, Mohanraj"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none border transition ${
                  isRed
                    ? 'bg-[#14060f] border-red-900/40 text-red-50 focus:border-red-500'
                    : 'bg-[#091228] border-cyan-900/40 text-cyan-50 focus:border-cyan-400'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="pearlbee or your password"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs outline-none border transition ${
                  isRed
                    ? 'bg-[#14060f] border-red-900/40 text-red-50 focus:border-red-500'
                    : 'bg-[#091228] border-cyan-900/40 text-cyan-50 focus:border-cyan-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-[11px]">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px]">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-white shadow-lg ${
              isRed
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 neon-glow-red'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 neon-glow-blue'
            }`}
          >
            {loading ? 'AUTHENTICATING...' : isRegister ? 'INITIALIZE ACCOUNT' : 'ENTER TERMINAL'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
