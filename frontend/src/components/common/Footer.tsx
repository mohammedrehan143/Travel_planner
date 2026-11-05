import React from 'react';
import { Plane, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B3B2C] text-neutral-300 py-12 border-t border-emerald-900/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center text-white shadow-xs">
                <Plane className="w-4 h-4 -rotate-45 fill-white stroke-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                TripPilot <span className="text-[#16A34A]">AI</span>
              </span>
            </div>
            <p className="text-xs text-emerald-100/75 max-w-sm leading-relaxed">
              Autonomous Agentic AI travel orchestrator. Intelligent itineraries with real-time route optimization, verified attractions, and collaborative trip planning.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <span className="inline-block w-2 h-2 rounded-full bg-[#16A34A]"></span>
              <span>TripPilot System Active &bull; AI Travel Architect</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard" className="text-neutral-300 hover:text-white transition-colors">Trip Dashboard</Link></li>
              <li><Link to="/wizard" className="text-neutral-300 hover:text-white transition-colors">AI Planning Wizard</Link></li>
              <li><span className="text-emerald-200/60">Supabase Connected</span></li>
              <li><span className="text-emerald-200/60">Agent Tool Engine</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Integrations</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#16A34A]" /> Supabase Database</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#16A34A]" /> Gemini & Groq LLMs</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#16A34A]" /> Places & Weather Engine</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-emerald-900/60 flex flex-col sm:flex-row justify-between items-center text-xs text-emerald-200/70 gap-4">
          <p>© 2026 TripPilot AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with React, TypeScript, Tailwind CSS & Supabase
          </p>
        </div>
      </div>
    </footer>
  );
};
