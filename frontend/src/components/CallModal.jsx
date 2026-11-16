import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, Volume2, ShieldCheck, Sparkles } from 'lucide-react';
import { getAvatarColor, startCallRingtone, stopCallRingtone } from '../utils/sound';

export default function CallModal({
  contact,
  isVideo = false,
  theme = 'blue',
  onClose
}) {
  const [callStatus, setCallStatus] = useState('calling'); // 'calling', 'connected'
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(isVideo);

  const isRed = theme === 'red';

  useEffect(() => {
    startCallRingtone();

    // Auto connect after 2.5 seconds to simulate answer
    const connectTimer = setTimeout(() => {
      stopCallRingtone();
      setCallStatus('connected');
    }, 2800);

    return () => {
      stopCallRingtone();
      clearTimeout(connectTimer);
    };
  }, []);

  useEffect(() => {
    let timer = null;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    stopCallRingtone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-sm rounded-3xl p-6 relative overflow-hidden flex flex-col items-center text-center shadow-2xl border ${
          isRed
            ? 'bg-[#0f0408] border-red-500/40 text-red-50 neon-glow-red'
            : 'bg-[#050b1a] border-cyan-500/40 text-cyan-50 neon-glow-blue'
        }`}
      >
        {/* Hacker HUD Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-6 text-[10px] font-mono uppercase tracking-widest text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
            {isVideo ? 'WHATSAPP VIDEO CALL' : 'WHATSAPP VOICE CALL'}
          </span>
          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${
            isRed ? 'border-red-500/40 text-red-400 bg-red-950/40' : 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40'
          }`}>
            E2E ENCRYPTED
          </span>
        </div>

        {/* Video Camera Preview Area (if video call) */}
        {isVideo && (
          <div className="w-full h-44 rounded-2xl mb-6 bg-slate-950 border border-white/10 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${getAvatarColor(contact?.username, theme)} flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
              {contact?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-300">
              {contact?.username} [CAMERA STREAM]
            </div>
          </div>
        )}

        {/* Contact Avatar with Pulsing Rings (if audio call) */}
        {!isVideo && (
          <div className="relative my-4">
            <div
              className={`absolute -inset-4 rounded-full opacity-40 animate-pulse-fast ${
                isRed ? 'bg-red-600/30 blur-md' : 'bg-cyan-500/30 blur-md'
              }`}
            />
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-tr ${getAvatarColor(
                contact?.username,
                theme
              )} flex items-center justify-center text-white text-3xl font-black shadow-2xl relative z-10 border-2 ${
                isRed ? 'border-red-500' : 'border-cyan-400'
              }`}
            >
              {contact?.username?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}

        {/* Contact Name & Status */}
        <h3 className="text-xl font-black tracking-tight text-white mt-1">
          {contact?.username}
        </h3>
        <p className={`text-xs font-mono font-semibold mt-1 tracking-wider ${
          callStatus === 'connected' ? 'text-emerald-400' : isRed ? 'text-red-400 animate-pulse' : 'text-cyan-400 animate-pulse'
        }`}>
          {callStatus === 'connected' ? formatDuration(seconds) : 'Ringing WhatsApp Net Call...'}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8 w-full">
          {/* Mute Button */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full border transition cursor-pointer ${
              isMuted
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle Button */}
          <button
            type="button"
            onClick={() => setCameraOn(!cameraOn)}
            className={`p-3.5 rounded-full border transition cursor-pointer ${
              cameraOn
                ? isRed ? 'bg-red-500/30 border-red-400 text-red-300' : 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
            title="Toggle Video"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/50 hover:scale-105 active:scale-95 transition cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
