import React, { useState } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';

interface ChatbotTriggerProps {
  onOpenChat?: () => void;
  className?: string;
}

/**
 * Official TripPilot AI Chatbot Avatar Icon
 * Uses the product's official chatbot avatar (/chatbot-avatar.png).
 * Small, crisp, and beautifully styled with glowing borders and online indicator.
 */
export const ChatbotAvatarIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 63,
  className = ''
}) => {
  return (
    <div
      className={`relative rounded-full overflow-hidden bg-white shadow-md border-2 border-white ring-2 ring-[#1E60FF]/30 transition-transform group-hover:scale-105 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/chatbot-avatar.png"
        alt="TripPilot AI Chatbot"
        className="w-full h-full object-cover select-none pointer-events-none"
      />
    </div>
  );
};

/**
 * Desktop Hero Section Chatbot Option
 * Positioned on the right end of the page, compact, elegant, and suitable for the layout.
 */
export const CuteRobotChatbot: React.FC<ChatbotTriggerProps> = ({
  onOpenChat,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onOpenChat}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col items-end cursor-pointer select-none transition-all duration-200 ${className}`}
      role="button"
      tabIndex={0}
      aria-label="Open AI Travel Assistant"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenChat?.();
        }
      }}
    >
      {/* Small Compact Speech Bubble (+12% scaled) */}
      <div className="relative mb-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-blue-200/90 shadow-lg shadow-blue-500/10 group-hover:shadow-blue-500/20 group-hover:border-[#1E60FF] transition-all duration-200 transform group-hover:-translate-y-0.5 text-right max-w-[180px]">
        <div className="flex items-center justify-end gap-1 mb-0.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#1E60FF]">
            Tripolio Online
          </span>
        </div>
        <p className="text-[12px] font-bold text-slate-800 leading-tight">
          I'm Tripolio, let's plan ✨
        </p>
        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
          Click to chat
        </span>

        {/* Pointer tail pointing down towards the avatar */}
        <div className="absolute -bottom-1.5 right-6 w-2.5 h-2.5 bg-white border-r border-b border-blue-200/90 rotate-45 transform" />
      </div>

      {/* Floating Chatbot Avatar Icon (+12% size: 56px -> 63px) */}
      <div className="relative animate-float-subtle">
        <ChatbotAvatarIcon size={63} />
        {/* Pulsing Online Beacon */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
        </span>
      </div>

      {/* Small Interactive Pill */}
      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E60FF] hover:bg-[#1850db] text-white text-[11px] font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
        <Sparkles className="w-3 h-3 fill-white" />
        <span>Ask AI</span>
      </div>
    </div>
  );
};

/**
 * Mobile / Floating Right-End Chatbot Trigger
 * Small, compact, floating at the right end of the page (+12% size: 34px -> 38px).
 */
export const CuteRobotMobileButton: React.FC<ChatbotTriggerProps> = ({
  onOpenChat,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onOpenChat}
      className={`group relative flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-blue-200/90 shadow-xl shadow-blue-500/20 hover:border-[#1E60FF] active:scale-95 transition-all duration-200 ${className}`}
      aria-label="Open AI Travel Assistant"
    >
      <div className="relative">
        <ChatbotAvatarIcon size={38} />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white animate-pulse" />
      </div>

      <div className="flex flex-col text-left">
        <span className="text-[12px] font-bold text-slate-900 leading-none">
          Tripolio AI
        </span>
        <span className="text-[10px] text-[#1E60FF] font-semibold mt-0.5 leading-none">
          Ask anything
        </span>
      </div>

      <div className="w-6 h-6 rounded-full bg-[#1E60FF] text-white flex items-center justify-center ml-0.5 shadow-xs">
        <MessageSquare className="w-3.5 h-3.5" />
      </div>
    </button>
  );
};
