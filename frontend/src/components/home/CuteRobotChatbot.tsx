import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';

interface CuteRobotChatbotProps {
  onOpenChat?: () => void;
  className?: string;
}

/**
 * Custom SVG Cute Robot Illustration matching TripPilot AI's Ocean Blue Theme (#1E60FF, #0B2545, #38BDF8)
 */
export const RobotAvatarSVG: React.FC<{ size?: number; className?: string }> = ({
  size = 170,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 170 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Head and Body metallic white gradient */}
        <linearGradient id="robotMetal" x1="20" y1="20" x2="150" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        {/* Ocean Blue primary gradient */}
        <linearGradient id="oceanBlueGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#1E60FF" />
        </linearGradient>

        {/* Visor deep ocean gradient */}
        <linearGradient id="visorBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B2545" />
          <stop offset="100%" stopColor="#051329" />
        </linearGradient>

        {/* Antenna glow filter */}
        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Eye glow filter */}
        <filter id="eyeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ================= ANTENNA ================= */}
      {/* Stem */}
      <path
        d="M 85 36 L 85 20"
        stroke="#94A3B8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Outer Glow Beacon (Pulsing) */}
      <circle
        cx="85"
        cy="16"
        r="11"
        fill="#38BDF8"
        opacity="0.35"
        className="animate-antenna-pulse"
      />
      {/* Inner Glowing Bulb */}
      <circle
        cx="85"
        cy="16"
        r="6.5"
        fill="url(#oceanBlueGrad)"
        filter="url(#cyanGlow)"
      />
      <circle cx="83.5" cy="14.5" r="2" fill="#FFFFFF" opacity="0.9" />

      {/* ================= ROBOT HEAD ================= */}
      {/* Head Chassis */}
      <rect
        x="38"
        y="34"
        width="94"
        height="68"
        rx="26"
        fill="url(#robotMetal)"
        stroke="#CBD5E1"
        strokeWidth="2.5"
      />

      {/* Left Ear Muff / Headset */}
      <rect
        x="27"
        y="50"
        width="13"
        height="36"
        rx="6.5"
        fill="url(#oceanBlueGrad)"
        stroke="#0052FF"
        strokeWidth="1.5"
      />
      <circle cx="33.5" cy="68" r="3" fill="#FFFFFF" opacity="0.75" />

      {/* Right Ear Muff / Headset */}
      <rect
        x="130"
        y="50"
        width="13"
        height="36"
        rx="6.5"
        fill="url(#oceanBlueGrad)"
        stroke="#0052FF"
        strokeWidth="1.5"
      />
      <circle cx="136.5" cy="68" r="3" fill="#FFFFFF" opacity="0.75" />

      {/* Visor Screen */}
      <rect
        x="49"
        y="45"
        width="72"
        height="44"
        rx="18"
        fill="url(#visorBg)"
        stroke="#1E60FF"
        strokeWidth="1.5"
      />

      {/* Gloss reflection arc on top of visor */}
      <path
        d="M 56 52 C 68 48 102 48 114 52"
        stroke="#38BDF8"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Visor Digital Happy Eyes (Luminous Cyan) */}
      {/* Left Eye */}
      <g filter="url(#eyeGlow)">
        <ellipse cx="68" cy="65" rx="6.5" ry="8" fill="#38BDF8" />
        <circle cx="66" cy="62" r="2.5" fill="#FFFFFF" />
        <circle cx="70.5" cy="68" r="1.2" fill="#FFFFFF" />
      </g>

      {/* Right Eye */}
      <g filter="url(#eyeGlow)">
        <ellipse cx="102" cy="65" rx="6.5" ry="8" fill="#38BDF8" />
        <circle cx="100" cy="62" r="2.5" fill="#FFFFFF" />
        <circle cx="104.5" cy="68" r="1.2" fill="#FFFFFF" />
      </g>

      {/* Rosy/Cyan Digital Cheeks */}
      <ellipse cx="58" cy="76" rx="5" ry="2.5" fill="#60A5FA" opacity="0.55" />
      <ellipse cx="112" cy="76" rx="5" ry="2.5" fill="#60A5FA" opacity="0.55" />

      {/* Cute Smile Arc */}
      <path
        d="M 78 74 Q 85 80 92 74"
        stroke="#38BDF8"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#eyeGlow)"
      />

      {/* ================= NECK CONNECTOR ================= */}
      <rect
        x="74"
        y="101"
        width="22"
        height="7"
        rx="3.5"
        fill="#94A3B8"
      />

      {/* ================= ROBOT BODY ================= */}
      {/* Body Chassis */}
      <rect
        x="46"
        y="107"
        width="78"
        height="50"
        rx="20"
        fill="url(#robotMetal)"
        stroke="#CBD5E1"
        strokeWidth="2.5"
      />

      {/* Chest Center Core - Glowing TripPilot Crest */}
      <circle
        cx="85"
        cy="130"
        r="13"
        fill="#EBF2FF"
        stroke="#1E60FF"
        strokeWidth="2"
      />
      <circle
        cx="85"
        cy="130"
        r="9"
        fill="url(#oceanBlueGrad)"
        filter="url(#eyeGlow)"
      />
      {/* Mini Flight / Paper Plane Chevron Emblem */}
      <path
        d="M 85 125 L 89 133 L 85 131 L 81 133 Z"
        fill="#FFFFFF"
      />

      {/* Left Arm (Relaxed & Welcoming) */}
      <path
        d="M 46 118 C 34 126 31 138 39 146"
        stroke="#1E60FF"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="40" cy="146" r="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />

      {/* Right Arm (Waving to the Traveler) */}
      <g className="animate-robot-wave">
        <path
          d="M 124 118 C 136 112 144 98 139 88"
          stroke="#1E60FF"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Waving Glove Hand */}
        <circle cx="138" cy="86" r="6.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="144" y1="83" x2="149" y2="80" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <line x1="146" y1="87" x2="152" y2="87" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Dual Propulsion Jets / Cute Feet */}
      <rect x="59" y="153" width="17" height="9" rx="4.5" fill="url(#oceanBlueGrad)" />
      <rect x="94" y="153" width="17" height="9" rx="4.5" fill="url(#oceanBlueGrad)" />

      {/* Gentle Propulsion Thrust Light */}
      <ellipse cx="67.5" cy="163" rx="5" ry="3" fill="#38BDF8" opacity="0.7" filter="url(#eyeGlow)" />
      <ellipse cx="102.5" cy="163" rx="5" ry="3" fill="#38BDF8" opacity="0.7" filter="url(#eyeGlow)" />
    </svg>
  );
};

/**
 * Desktop Hero Section AI Chatbot Widget with Jumping Cute Robot Character
 */
export const CuteRobotChatbot: React.FC<CuteRobotChatbotProps> = ({
  onOpenChat,
  className = ''
}) => {
  return (
    <div
      onClick={onOpenChat}
      className={`group relative flex flex-col items-center cursor-pointer select-none transition-all duration-300 ${className}`}
      role="button"
      tabIndex={0}
      aria-label="Open AI Travel Chatbot"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenChat?.();
        }
      }}
    >
      {/* Speech Bubble Floating Above the Robot */}
      <div className="relative mb-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-blue-100/90 shadow-xl shadow-blue-500/10 group-hover:shadow-blue-500/20 group-hover:border-blue-300 transition-all duration-200 transform group-hover:-translate-y-1 max-w-[240px] text-center">
        {/* Status indicator row */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E60FF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E60FF]" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#1E60FF]">
            TripPilot AI
          </span>
        </div>

        {/* Friendly speech text */}
        <p className="text-[13px] font-semibold text-slate-800 leading-snug">
          Hi! Plan your dream trip with me ✨
        </p>
        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
          Tap to start chatting
        </span>

        {/* Speech Bubble Tail pointing down towards the jumping robot */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-blue-100/90 rotate-45 transform" />
      </div>

      {/* Jumping Robotic Character Container */}
      <div className="relative flex flex-col items-center justify-center">
        {/* The Jumping Cute Robot */}
        <div className="animate-robot-jump group-hover:scale-105 transition-transform duration-200">
          <RobotAvatarSVG size={180} />
        </div>

        {/* Dynamic Synchronized Ground Shadow */}
        <div className="w-24 h-4 -mt-3 rounded-[50%] bg-blue-950/20 filter blur-[3px] animate-robot-shadow pointer-events-none" />
      </div>

      {/* Bottom Interactive CTA Pill */}
      <div className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1E60FF] hover:bg-[#1850db] text-white text-xs font-bold shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all duration-200">
        <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
        <span>Chat with AI Pilot</span>
      </div>
    </div>
  );
};

/**
 * Mobile View Floating AI Chatbot Button with Mini Jumping Robot Avatar
 */
export const CuteRobotMobileButton: React.FC<CuteRobotChatbotProps> = ({
  onOpenChat,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onOpenChat}
      className={`group relative flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-blue-200/90 shadow-xl shadow-blue-500/25 active:scale-95 transition-all duration-200 ${className}`}
      aria-label="Open AI Travel Chatbot"
    >
      {/* Mini Jumping Robot Avatar */}
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <div className="animate-robot-jump">
          <RobotAvatarSVG size={36} />
        </div>
      </div>

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1E60FF] animate-pulse" />
          <span className="text-xs font-bold text-slate-900 leading-none">
            AI Pilot
          </span>
        </div>
        <span className="text-[10px] text-[#1E60FF] font-semibold mt-0.5 leading-none">
          Ask anything
        </span>
      </div>

      <div className="w-7 h-7 rounded-full bg-[#1E60FF] text-white flex items-center justify-center ml-1 shadow-xs">
        <MessageSquare className="w-3.5 h-3.5" />
      </div>
    </button>
  );
};
