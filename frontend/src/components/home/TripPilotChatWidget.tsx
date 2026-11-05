import React from 'react';
import { Plane, Calendar, Users, IndianRupee, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TripPilotChatWidgetProps {
  onOpenAssistant?: (prompt?: string) => void;
}

export const TripPilotChatWidget: React.FC<TripPilotChatWidgetProps> = ({ onOpenAssistant }) => {
  const navigate = useNavigate();

  const prompts = [
    { label: 'Plan a 5 day trip to Coorg', icon: Plane, query: 'Plan a 5 day trip to Coorg under ₹20,000' },
    { label: 'Under ₹20,000', icon: IndianRupee, query: 'Best trips in South India under ₹20,000' },
    { label: 'For 3 people', icon: Users, query: 'Weekend getaway for 3 people with scenic views' },
    { label: 'Next month', icon: Calendar, query: 'Plan a relaxing holiday for next month' },
  ];

  const handleChipClick = (p: typeof prompts[0]) => {
    if (onOpenAssistant) {
      onOpenAssistant(p.query);
    } else {
      navigate(`/wizard?q=${encodeURIComponent(p.query)}`);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-xs space-y-4">
      {/* Header with Online Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#1E60FF]/30 shadow-xs shrink-0 bg-white">
            <img src="/chatbot-avatar.png" alt="Tripolio AI" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-sm text-neutral-900">Tripolio AI</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E60FF] bg-[#EBF2FF] px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E60FF] animate-pulse" />
          <span>Online</span>
        </div>
      </div>

      {/* Intro AI Speech Bubble */}
      <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100 text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
        Hi, I am Tripolio! Tell me your travel idea, and I'll create a complete trip plan for you.
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="space-y-2">
        {prompts.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => handleChipClick(p)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 hover:border-[#1E60FF] hover:bg-blue-50/50 text-neutral-700 hover:text-[#1E60FF] text-xs font-medium transition-all text-left group"
            >
              <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#1E60FF] shrink-0" />
              <span className="truncate">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Ask Button */}
      <button
        type="button"
        onClick={() => onOpenAssistant ? onOpenAssistant() : navigate('/wizard')}
        className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>Ask Tripolio Anything</span>
      </button>
    </div>
  );
};
