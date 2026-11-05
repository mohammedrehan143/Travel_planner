import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Trees, Mountain, Umbrella, Coffee, Flame } from 'lucide-react';

interface HeroBannerProps {
  onSearchSubmit?: (prompt: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onSearchSubmit }) => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');

  const sampleTags = [
    { label: 'Popular', icon: Flame, color: 'text-amber-500', destination: 'Coorg' },
    { label: 'Coorg', icon: Coffee, color: 'text-emerald-600', destination: 'Coorg, Karnataka' },
    { label: 'Goa', icon: Umbrella, color: 'text-cyan-500', destination: 'Goa, India' },
    { label: 'Chikmagalur', icon: Mountain, color: 'text-emerald-700', destination: 'Chikmagalur, Karnataka' },
    { label: 'Wayanad', icon: Trees, color: 'text-green-600', destination: 'Wayanad, Kerala' },
    { label: 'Ooty', icon: Mountain, color: 'text-blue-500', destination: 'Ooty, Tamil Nadu' },
  ];

  const handleExecute = (searchQuery?: string) => {
    const q = (searchQuery ?? prompt).trim();
    if (onSearchSubmit && q) {
      onSearchSubmit(q);
      return;
    }
    if (q) {
      navigate(`/wizard?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/wizard');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleTagClick = (tag: typeof sampleTags[0]) => {
    const defaultQuery = `Plan a 5 day trip to ${tag.destination || tag.label} under ₹20,000`;
    setPrompt(defaultQuery);
    navigate(`/wizard?destination=${encodeURIComponent(tag.destination || tag.label)}&q=${encodeURIComponent(defaultQuery)}`);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-sm border border-neutral-100 min-h-[300px] sm:min-h-[330px] flex flex-col justify-center px-6 sm:px-10 py-8 select-none">
      {/* Background panoramic landscape from image copy.png */}
      <img
        src="/hero-banner.png"
        alt="Mountain adventure panorama with backpacker and soaring aircraft"
        className="absolute inset-0 w-full h-full object-cover object-[center_right] sm:object-center pointer-events-none"
      />

      {/* Subtle scenic gradient overlay to guarantee text and pill contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-xl space-y-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
          Where do you want to go?
        </h2>

        {/* Floating AI Prompt Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-white/60 p-1.5 pl-4 sm:pl-5 flex items-center gap-3 w-full transition-all focus-within:ring-2 focus-within:ring-[#16A34A]">
          <Sparkles className="w-4 h-4 text-[#16A34A] shrink-0" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Ask TripPilot AI... e.g. "Plan a 5 day trip to Coorg under ₹15,000"'
            className="w-full bg-transparent text-neutral-800 placeholder-neutral-400 text-xs sm:text-sm font-medium outline-none py-1"
          />
          <button
            type="button"
            onClick={() => handleExecute()}
            aria-label="Generate AI Trip Plan"
            className="w-9 h-9 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0"
          >
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Quick Filter Destination Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {sampleTags.map((tag) => {
            const Icon = tag.icon;
            return (
              <button
                key={tag.label}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="bg-white/90 hover:bg-white text-neutral-800 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-xs backdrop-blur-md border border-white/50 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <Icon className={`w-3 h-3 ${tag.color}`} />
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
