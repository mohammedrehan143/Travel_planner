import React from 'react';
import { Compass, Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#171717] text-neutral-400 py-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-[#F97316] border border-neutral-700">
                <Compass className="w-4 h-4 text-[#F97316]" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                TripPilot<span className="text-[#F97316]">.ai</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              Autonomous Agentic AI travel orchestrator. Intelligent itineraries with real-time route optimization, verified attractions, and collaborative trip planning.
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="inline-block w-2 h-2 rounded-full bg-[#F97316]"></span>
              <span>TripPilot System Active • High-Contrast Mono & Orange Experience</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard" className="text-neutral-400 hover:text-[#F97316] transition-colors">Trip Dashboard</Link></li>
              <li><Link to="/wizard" className="text-neutral-400 hover:text-[#F97316] transition-colors">AI Planning Wizard</Link></li>
              <li><span className="text-neutral-500">Supabase RLS Protected</span></li>
              <li><span className="text-neutral-500">Geospatial Routing Engine</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Integrations</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#F97316]" /> Supabase Database</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#F97316]" /> Google Gemini Tool Calling</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#F97316]" /> Weather & Route Engine</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#F97316]" /> Recharts Analytics</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-500 gap-4">
          <p>© 2026 TripPilot AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with React, TypeScript, Tailwind CSS & Supabase
          </p>
        </div>
      </div>
    </footer>
  );
};
