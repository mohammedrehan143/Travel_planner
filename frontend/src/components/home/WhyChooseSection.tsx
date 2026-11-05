import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Layers,
  CalendarCheck,
  Route,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface WhyChooseSectionProps {
  onOpenAgents?: () => void;
  onOpenDemo?: () => void;
}

export const WhyChooseSection: React.FC<WhyChooseSectionProps> = ({
  onOpenAgents,
  onOpenDemo
}) => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 'ai-planning',
      icon: Bot,
      title: 'AI-Powered Planning',
      desc: 'Get personalized trip plans in seconds.',
      action: () => navigate('/wizard')
    },
    {
      id: 'multi-agent',
      icon: Layers,
      title: 'Multi-Agent System',
      desc: 'Specialized AI agents for research, budget, routes and more.',
      action: () => {
        if (onOpenAgents) onOpenAgents();
        else navigate('/wizard');
      }
    },
    {
      id: 'smart-budgeting',
      isRupee: true,
      title: 'Smart Budgeting',
      desc: 'Accurate cost estimation and spend optimization.',
      action: () => navigate('/wizard')
    },
    {
      id: 'day-wise',
      icon: CalendarCheck,
      title: 'Day-Wise Itinerary',
      desc: 'A complete, realistic plan with timings and travel details.',
      action: () => navigate('/wizard')
    },
    {
      id: 'route-optimization',
      icon: Route,
      title: 'Route Optimization',
      desc: 'Find the best and most efficient travel routes.',
      action: () => navigate('/wizard')
    },
    {
      id: 'trip-validation',
      icon: ShieldCheck,
      title: 'Trip Validation',
      desc: 'AI checks weather, timings and feasibility for a smooth trip.',
      action: () => {
        if (onOpenDemo) onOpenDemo();
        else navigate('/wizard');
      }
    }
  ];

  return (
    <section
      id="why-choose-us"
      className="relative w-full py-16 sm:py-24 lg:py-28 overflow-hidden select-none"
    >
      {/* 
        High-Resolution River Mountain Landscape (image copy 3.png)
        Scenic alpine river valley with pine trees and snow peaks
      */}
      <img
        src="/why-choose-bg.png"
        alt="TripPilot Alpine River Valley"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
      />

      {/* Subtle top and bottom transition overlays to blend smoothly with adjacent sections */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-white via-white/40 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none z-10" />

      {/* Main Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 space-y-10 sm:space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/70 text-[#1E60FF] text-xs sm:text-sm font-semibold shadow-2xs">
            <Sparkles className="w-4 h-4 fill-[#1E60FF]" />
            <span>Why Choose Us</span>
          </div>

          {/* Headline with custom curved underline under TripPilot AI? */}
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black text-slate-900 tracking-tight leading-[1.15]">
            Why Choose{' '}
            <span className="relative inline-block text-[#1E60FF]">
              TripPilot AI?
              {/* Curved brush underline stroke matching image copy 2.png */}
              <svg
                className="absolute -bottom-2.5 left-0 w-full h-3.5 text-[#1E60FF] pointer-events-none"
                viewBox="0 0 170 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 10C50 4 120 4 166 10"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>

          {/* Subtitle Paragraph */}
          <p className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed max-w-2xl mx-auto pt-1">
            More than a travel planner — your AI-powered travel co-pilot that researches, plans, optimizes and validates your entire trip.
          </p>
        </div>

        {/* 6 Glassmorphic Feature Cards Grid (3x2 on desktop, 2x3 on tablet, 1x6 on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 pt-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={card.action}
                className="group relative bg-white/55 hover:bg-white/75 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/75 shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex items-center gap-4.5"
              >
                {/* Soft top border shine/reflection */}
                <div className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

                {/* Left Icon Container */}
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/90 shadow-md shadow-blue-500/10 flex items-center justify-center text-[#1E60FF] shrink-0 group-hover:scale-105 group-hover:bg-[#1E60FF] group-hover:text-white transition-all duration-300">
                  {card.isRupee ? (
                    <span className="font-bold text-2xl leading-none">₹</span>
                  ) : (
                    Icon && <Icon className="w-6 h-6 stroke-[2.2]" />
                  )}
                </div>

                {/* Right Text Content */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#1E60FF] transition-colors leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-snug mt-1.5">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
