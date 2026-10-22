import React from 'react';
import { Compass, Heart, Github, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">
                TripPilot<span className="text-blue-500">.ai</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Autonomous Agentic AI travel orchestrator. Intelligent itineraries with real-time route optimization, verified attractions, and collaborative trip planning.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Built by Person 1 (Frontend Lead) & Person 2 (AI Agent Lead)</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/dashboard" className="hover:text-white transition-colors">Trip Dashboard</a></li>
              <li><a href="/wizard" className="hover:text-white transition-colors">AI Planning Wizard</a></li>
              <li><span className="text-slate-500">Supabase RLS Protected</span></li>
              <li><span className="text-slate-500">Geospatial Routing</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Integrations</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-400" /> Supabase Database</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-400" /> Agentic AI Tools</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-400" /> Weather & Route Engine</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-400" /> Recharts Analytics</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2026 TripPilot AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with React, TypeScript, Tailwind CSS & Supabase
          </p>
        </div>
      </div>
    </footer>
  );
};
