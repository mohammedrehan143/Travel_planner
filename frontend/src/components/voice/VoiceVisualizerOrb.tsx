import React, { useEffect, useState } from 'react';
import { VoiceState } from '../../lib/voice';
import { Mic, Volume2, Sparkles, AlertCircle, StopCircle, RefreshCw } from 'lucide-react';

interface VoiceVisualizerOrbProps {
  state: VoiceState;
  volume: number; // 0.0 to 1.0
  onClick?: () => void;
  className?: string;
}

export const VoiceVisualizerOrb: React.FC<VoiceVisualizerOrbProps> = ({
  state,
  volume,
  onClick,
  className = ''
}) => {
  const [pulse, setPulse] = useState(1);

  // Dynamic scale calculation based on real volume when listening or speaking
  useEffect(() => {
    if (state === 'listening' || state === 'speaking') {
      const targetScale = 1 + Math.min(0.4, volume * 0.8);
      setPulse(targetScale);
    } else {
      setPulse(1);
    }
  }, [state, volume]);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer ambient glow rings */}
      <div
        className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
          state === 'listening'
            ? 'w-64 h-64 bg-blue-500/20 blur-2xl animate-pulse'
            : state === 'speaking'
            ? 'w-64 h-64 bg-cyan-400/25 blur-2xl animate-pulse'
            : state === 'processing'
            ? 'w-56 h-56 bg-indigo-500/20 blur-xl'
            : state === 'error'
            ? 'w-52 h-52 bg-rose-500/20 blur-lg'
            : state === 'interrupted'
            ? 'w-52 h-52 bg-amber-500/20 blur-lg'
            : 'w-48 h-48 bg-blue-400/10 blur-md'
        }`}
      />

      {/* Ripple ring 1 */}
      {(state === 'listening' || state === 'speaking') && (
        <div
          className="absolute w-44 h-44 rounded-full border border-blue-400/40 animate-ping pointer-events-none"
          style={{ animationDuration: state === 'speaking' ? '1.8s' : '2.4s' }}
        />
      )}

      {/* Ripple ring 2 (Processing gyro ring) */}
      {state === 'processing' && (
        <div className="absolute w-48 h-48 rounded-full border-2 border-dashed border-[#1E60FF]/60 animate-spin pointer-events-none duration-1000" />
      )}

      {/* Main Interactive Animated Orb Core */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`Voice Assistant - Status: ${state}`}
        style={{ transform: `scale(${pulse})` }}
        className={`relative z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center p-3 shadow-2xl transition-transform duration-150 outline-none focus:ring-4 focus:ring-blue-400/50 cursor-pointer ${
          state === 'listening'
            ? 'bg-gradient-to-tr from-blue-600 via-[#1E60FF] to-cyan-400 text-white shadow-blue-500/40 border-4 border-white'
            : state === 'speaking'
            ? 'bg-gradient-to-tr from-cyan-600 via-[#1E60FF] to-blue-500 text-white shadow-cyan-500/40 border-4 border-cyan-100'
            : state === 'processing'
            ? 'bg-gradient-to-tr from-indigo-700 via-blue-600 to-[#1E60FF] text-white shadow-indigo-500/40 border-4 border-indigo-100'
            : state === 'error'
            ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/40 border-4 border-white'
            : state === 'interrupted'
            ? 'bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-amber-500/40 border-4 border-white'
            : 'bg-gradient-to-tr from-[#1E60FF] to-blue-500 text-white shadow-blue-500/25 border-4 border-white hover:scale-105'
        }`}
      >
        {/* Pilot Mascot Avatar in Center */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white shadow-md border-2 border-white/90 mb-1.5 shrink-0">
          <img
            src="/chatbot-avatar.png"
            alt="TripPilot Pilot Mascot"
            className="w-full h-full object-cover select-none pointer-events-none"
          />

          {/* Badge icon over mascot */}
          <div className="absolute bottom-0 right-0 p-1 rounded-full bg-[#171717] text-white shadow-xs">
            {state === 'listening' ? (
              <Mic className="w-3 h-3 text-red-400 animate-pulse" />
            ) : state === 'speaking' ? (
              <Volume2 className="w-3 h-3 text-cyan-300 animate-bounce" />
            ) : state === 'processing' ? (
              <RefreshCw className="w-3 h-3 text-blue-300 animate-spin" />
            ) : state === 'error' ? (
              <AlertCircle className="w-3 h-3 text-rose-300" />
            ) : state === 'interrupted' ? (
              <StopCircle className="w-3 h-3 text-amber-300" />
            ) : (
              <Sparkles className="w-3 h-3 text-blue-300" />
            )}
          </div>
        </div>

        {/* State Label below mascot inside orb */}
        <span className="text-[11px] font-bold tracking-wide uppercase drop-shadow-xs">
          {state === 'listening'
            ? 'Listening...'
            : state === 'speaking'
            ? 'Pilot Speaking'
            : state === 'processing'
            ? 'Thinking...'
            : state === 'interrupted'
            ? 'Interrupted'
            : state === 'error'
            ? 'Retry'
            : 'Tap to Talk'}
        </span>
      </button>

      {/* Dynamic Soundwave Equalizer Bars for Speaking and Listening */}
      {(state === 'speaking' || state === 'listening') && (
        <div className="absolute -bottom-8 flex items-center gap-1.5 h-6">
          {[0.3, 0.7, 1.0, 0.8, 0.5, 0.9, 0.4].map((multiplier, idx) => {
            const barHeight = Math.max(6, Math.min(24, (volume * 28 + 6) * multiplier));
            return (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-75 ${
                  state === 'speaking' ? 'bg-[#1E60FF]' : 'bg-red-500'
                }`}
                style={{ height: `${barHeight}px` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
