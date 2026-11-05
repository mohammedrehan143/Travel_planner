import React, { useEffect, useState } from 'react';
import { Plane, Sparkles, Calendar, MapPin, CheckCircle2, ArrowRight, Heart, X } from 'lucide-react';

interface BestWishesModalProps {
  isOpen: boolean;
  destination: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  activityCount: number;
  onRedirect: () => void;
  onClose: () => void;
}

// 24 decorative confetti pieces with varied positions, delays, colors, and sizes
const CONFETTI_PIECES = [
  { left: 6, delay: 0, duration: 3.2, bg: 'bg-[#1E60FF]', size: 'w-2.5 h-2.5 rounded-full' },
  { left: 14, delay: 0.6, duration: 3.5, bg: 'bg-[#F59E0B]', size: 'w-3 h-1.5 rounded-xs' },
  { left: 22, delay: 1.2, duration: 2.8, bg: 'bg-[#10B981]', size: 'w-2 h-2 rounded-full' },
  { left: 30, delay: 0.3, duration: 3.8, bg: 'bg-[#EC4899]', size: 'w-3.5 h-2 rounded-xs' },
  { left: 38, delay: 0.9, duration: 3.1, bg: 'bg-[#8B5CF6]', size: 'w-2.5 h-2.5 rounded-full' },
  { left: 46, delay: 0.1, duration: 3.6, bg: 'bg-[#06B6D4]', size: 'w-3 h-1.5 rounded-xs' },
  { left: 54, delay: 1.4, duration: 2.9, bg: 'bg-[#F97316]', size: 'w-2 h-2 rounded-full' },
  { left: 62, delay: 0.5, duration: 3.4, bg: 'bg-[#1E60FF]', size: 'w-3.5 h-2 rounded-xs' },
  { left: 70, delay: 1.1, duration: 3.3, bg: 'bg-[#10B981]', size: 'w-2.5 h-2.5 rounded-full' },
  { left: 78, delay: 0.4, duration: 3.7, bg: 'bg-[#EC4899]', size: 'w-3 h-1.5 rounded-xs' },
  { left: 86, delay: 1.3, duration: 3.0, bg: 'bg-[#F59E0B]', size: 'w-2 h-2 rounded-full' },
  { left: 94, delay: 0.7, duration: 3.5, bg: 'bg-[#8B5CF6]', size: 'w-3.5 h-2 rounded-xs' },
  { left: 10, delay: 1.8, duration: 3.1, bg: 'bg-[#06B6D4]', size: 'w-2 h-2 rounded-full' },
  { left: 26, delay: 2.1, duration: 3.4, bg: 'bg-[#F97316]', size: 'w-3 h-1.5 rounded-xs' },
  { left: 42, delay: 1.6, duration: 3.3, bg: 'bg-[#1E60FF]', size: 'w-2.5 h-2.5 rounded-full' },
  { left: 58, delay: 2.3, duration: 3.6, bg: 'bg-[#10B981]', size: 'w-3.5 h-2 rounded-xs' },
  { left: 74, delay: 1.9, duration: 3.0, bg: 'bg-[#EC4899]', size: 'w-2 h-2 rounded-full' },
  { left: 90, delay: 2.4, duration: 3.2, bg: 'bg-[#F59E0B]', size: 'w-3 h-1.5 rounded-xs' },
];

export const BestWishesModal: React.FC<BestWishesModalProps> = ({
  isOpen,
  destination,
  startDate,
  endDate,
  durationDays = 1,
  activityCount,
  onRedirect,
  onClose,
}) => {
  const TOTAL_COUNTDOWN_SECONDS = 4;
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(TOTAL_COUNTDOWN_SECONDS);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onRedirect]);

  if (!isOpen) return null;

  const formatDateDisplay = () => {
    if (!startDate) return 'Dates Flexible';
    const s = new Date(startDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sStr = `${months[s.getMonth()]} ${s.getDate()}`;
    if (!endDate) return sStr;
    const e = new Date(endDate);
    const eStr = `${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
    return `${sStr} – ${eStr}`;
  };

  const progressPercentage = ((TOTAL_COUNTDOWN_SECONDS - timeLeft) / TOTAL_COUNTDOWN_SECONDS) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 select-none overflow-hidden"
      onClick={onClose}
    >
      {/* Animated Confetti Particles Falling Across Screen */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {CONFETTI_PIECES.map((c, i) => (
          <span
            key={i}
            className={`absolute top-0 animate-confetti shadow-xs ${c.bg} ${c.size}`}
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Celebration Card Dialog */}
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl border border-blue-100/80 animate-celebratory-pop z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Ambient Radial Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-b from-blue-400/20 via-sky-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Twinkling Top Sparkles */}
        <div className="absolute top-6 left-8 text-amber-400 animate-sparkle-twinkle pointer-events-none">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="absolute top-10 right-14 text-blue-500 animate-sparkle-twinkle pointer-events-none" style={{ animationDelay: '0.8s' }}>
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Center Animated Icon Badge */}
        <div className="relative mx-auto mb-4 w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1E60FF] via-[#3B82F6] to-[#60A5FA] shadow-xl shadow-blue-500/25 flex items-center justify-center text-white">
          <Plane className="w-10 h-10 animate-plane-soar drop-shadow-md" />
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </span>
        </div>

        {/* Best Wishes Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E60FF] border border-blue-200 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#1E60FF]" />
          <span>Trip Confirmed &amp; Activated</span>
        </div>

        {/* Main Best Wishes Headline */}
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mb-2">
          Best Wishes on Your Journey!
        </h2>

        {/* Cheerful Animated Text Message */}
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-md mx-auto mb-5">
          TripPilot &amp; Tripolio wish you unforgettable memories, joyful discoveries, and safe travels as you explore{' '}
          <strong className="text-neutral-900 font-extrabold">{destination}</strong>!
        </p>

        {/* Trip Details Snapshot Card */}
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 text-left space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-neutral-500 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#1E60FF]" />
              <span>Destination</span>
            </span>
            <span className="font-black text-neutral-900">{destination}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-neutral-500 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#1E60FF]" />
              <span>Dates &amp; Duration</span>
            </span>
            <span className="font-semibold text-neutral-800">
              {formatDateDisplay()} ({durationDays} {durationDays === 1 ? 'Day' : 'Days'})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60">
            <span className="flex items-center gap-1.5 text-neutral-500 font-semibold">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Confirmed Activities</span>
            </span>
            <span className="font-black text-[#1E60FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[11px]">
              {activityCount} Spot{activityCount === 1 ? '' : 's'} Locked
            </span>
          </div>
        </div>

        {/* Animated Redirect Countdown Progress */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
            <span>Redirecting to My Trips...</span>
            <span className="font-black text-[#1E60FF]">{timeLeft}s</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1E60FF] to-sky-400 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={onRedirect}
            className="w-full py-3.5 px-4 rounded-xl bg-[#1E60FF] hover:bg-[#0052FF] text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Go to My Trips</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-4 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
          >
            Stay on Itinerary
          </button>
        </div>
      </div>
    </div>
  );
};