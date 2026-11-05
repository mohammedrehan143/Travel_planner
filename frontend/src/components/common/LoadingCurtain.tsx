import React, { useState, useEffect, useMemo } from 'react';

interface LoadingCurtainProps {
  onComplete?: () => void;
  brandName?: string;
}

const TRAVEL_QUOTES = [
  {
    quote: '“The world is a book, and those who do not travel read only one page.”',
    author: 'Saint Augustine',
  },
  {
    quote: '“Not all those who wander are lost.”',
    author: 'J.R.R. Tolkien',
  },
  {
    quote: '“Travel is the only thing you buy that makes you richer.”',
    author: 'Anonymous',
  },
  {
    quote: '“To travel is to live.”',
    author: 'Hans Christian Andersen',
  },
];

export const LoadingCurtain: React.FC<LoadingCurtainProps> = ({
  onComplete,
  brandName = 'TripPilot',
}) => {
  const [isMounted, setIsMounted] = useState(true);
  const [showName, setShowName] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [isSwipingUp, setIsSwipingUp] = useState(false);

  // Pick a memorable quote on mount
  const quoteItem = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * TRAVEL_QUOTES.length);
    return TRAVEL_QUOTES[randomIndex] || TRAVEL_QUOTES[0];
  }, []);

  useEffect(() => {
    // Lock background scroll during the intro curtain
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Timeline:
    // 0ms - 400ms: Blank screen
    // 400ms: TripPilot name & logo appear
    const nameTimer = setTimeout(() => {
      setShowName(true);
    }, 450);

    // 1050ms: Travel quote fades in
    const quoteTimer = setTimeout(() => {
      setShowQuote(true);
    }, 1100);

    // 2550ms: Curtain swipes up, revealing the main website & hero section
    const swipeTimer = setTimeout(() => {
      setIsSwipingUp(true);
    }, 2600);

    // 3550ms: Unmount completely after swipe-up finishes
    const finishTimer = setTimeout(() => {
      setIsMounted(false);
      document.body.style.overflow = originalOverflow;
      onComplete?.();
    }, 3550);

    return () => {
      clearTimeout(nameTimer);
      clearTimeout(quoteTimer);
      clearTimeout(swipeTimer);
      clearTimeout(finishTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, [onComplete]);

  // Click or keypress allows immediate skip into the hero section
  const handleSkip = () => {
    if (isSwipingUp) return;
    setShowName(true);
    setShowQuote(true);
    setIsSwipingUp(true);
    setTimeout(() => {
      setIsMounted(false);
      document.body.style.overflow = '';
      onComplete?.();
    }, 850);
  };

  if (!isMounted) return null;

  return (
    <div
      onClick={handleSkip}
      role="banner"
      aria-label="TripPilot Loading Screen"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          handleSkip();
        }
      }}
      className="fixed inset-0 z-[100] bg-[#07090E] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden will-change-transform border-b border-blue-500/20 shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
      style={{
        transform: isSwipingUp ? 'translateY(-100%)' : 'translateY(0%)',
        transition: 'transform 950ms cubic-bezier(0.85, 0, 0.15, 1)',
        backgroundImage:
          'radial-gradient(circle at 50% 45%, rgba(30, 96, 255, 0.14) 0%, rgba(7, 9, 14, 0.95) 55%, #07090E 100%)',
      }}
    >
      {/* Centerpiece Content */}
      <div className="relative flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto space-y-4">
        {/* Brand Logo & Name (Fades & floats in at step 1) */}
        <div
          className={`flex flex-col items-center gap-3 transition-all duration-700 ease-out transform ${
            showName
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          {/* Glowing App Logo */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/30 border border-blue-400/40 p-0.5 bg-white/10 backdrop-blur-md">
            <img
              src="/app-logo.png"
              alt="TripPilot Logo"
              className="w-full h-full object-cover rounded-[14px]"
            />
            {/* Subtle beacon ping */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E60FF] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1E60FF]" />
            </span>
          </div>

          {/* Name: TripPilot */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight flex items-center justify-center gap-1.5 drop-shadow-md">
            <span>{brandName}</span>
            <span className="text-[#1E60FF]"> AI</span>
          </h1>
        </div>

        {/* Delicate Gradient Divider */}
        <div
          className={`transition-all duration-700 ease-out h-[1px] bg-gradient-to-r from-transparent via-[#1E60FF]/80 to-transparent ${
            showQuote ? 'w-24 sm:w-36 opacity-100' : 'w-0 opacity-0'
          }`}
        />

        {/* Quote & Author (Fades & expands in at step 2) */}
        <div
          className={`transition-all duration-700 ease-out transform space-y-2 ${
            showQuote
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          }`}
        >
          <blockquote className="text-base sm:text-lg md:text-xl font-serif italic text-slate-200 leading-relaxed max-w-xl">
            {quoteItem.quote}
          </blockquote>
          <cite className="block text-[11px] sm:text-xs font-sans not-italic uppercase tracking-[0.25em] text-[#1E60FF] font-bold">
            — {quoteItem.author}
          </cite>
        </div>
      </div>

      {/* Subtle Bottom Instruction Hint */}
      <div
        className={`absolute bottom-6 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wider uppercase transition-opacity duration-500 ${
          showQuote ? 'opacity-70' : 'opacity-0'
        }`}
      >
        <span>Click anywhere to explore</span>
        <span className="text-[#1E60FF] animate-pulse">→</span>
      </div>
    </div>
  );
};
