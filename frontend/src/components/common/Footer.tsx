import React from 'react';
import { Plane, Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800 select-none">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 aspect-square rounded-2xl overflow-hidden shadow-md shadow-blue-500/25 shrink-0">
                <img
                  src="/app-logo.png"
                  alt="TripPilot AI Logo"
                  width="40"
                  height="40"
                  className="w-full h-full object-cover shrink-0"
                />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                TripPilot <span className="text-[#1E60FF]">AI</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Your autonomous AI travel co-pilot. Intelligent multi-agent itineraries with real-time budget optimization, stay recommendations, and collaborative trip planning.
            </p>

            <div className="flex items-center gap-2 text-xs text-blue-400">
              <span className="inline-block w-2 h-2 rounded-full bg-[#1E60FF] animate-pulse" />
              <span>Multi-Agent Engine Operational &bull; Ready to Plan</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore & Plan
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/wizard" className="text-slate-400 hover:text-white transition-colors">
                  AI Planning Wizard
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  Trip Dashboard
                </Link>
              </li>
              <li>
                <a href="#features" className="text-slate-400 hover:text-white transition-colors">
                  Features & AI Agents
                </a>
              </li>
              <li>
                <a href="#destinations" className="text-slate-400 hover:text-white transition-colors">
                  Popular Destinations
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Technology & Integrations */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Engineered With
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#1E60FF]" />
                Supabase Real-Time DB
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#1E60FF]" />
                Gemini & Groq LLMs
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#1E60FF]" />
                Multi-Currency Engine (INR/USD)
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#1E60FF]" />
                OpenStreetMap & Routing API
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2026 TripPilot AI. Built for smarter, stress-free travel journeys.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for travellers worldwide
          </p>
        </div>
      </div>
    </footer>
  );
};
