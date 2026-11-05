import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  MapPin,
  Calendar,
  IndianRupee,
  CheckCircle2,
  ArrowRight,
  Plane,
  Compass,
  Star,
  ShieldCheck,
  Play
} from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'preview' | 'breakdown'>('preview');
  const [selectedDemoTrip, setSelectedDemoTrip] = useState<'coorg' | 'goa'>('coorg');

  if (!isOpen) return null;

  const demoData = {
    coorg: {
      title: '5-Day Coorg Coffee & Mist Escape',
      destination: 'Coorg, Karnataka',
      duration: '5 Days / 4 Nights',
      budget: '₹18,500',
      travelers: '2 Travelers',
      style: 'Relaxed Nature & Adventure',
      highlights: [
        'Private plantation stay at Abbey Falls valley',
        'Morning trek to Mandalpatti peak with sunrise jeep safari',
        'Curated coffee brewing workshop & estate walk',
        'Tibetan monastery visit & local Kodava cuisine trail'
      ],
      agentStats: {
        destinationsChecked: 42,
        budgetSaved: '₹3,400',
        driveTimeSaved: '2.5 hrs',
        hotelRating: '4.9/5'
      }
    },
    goa: {
      title: '4-Day Sun, Susegad & Heritage Goa',
      destination: 'North & South Goa',
      duration: '4 Days / 3 Nights',
      budget: '₹22,000',
      travelers: '3 Friends',
      style: 'Beaches, Food & Sunset Cruises',
      highlights: [
        'Boutique Portuguese villa stay in Fontainhas, Panaji',
        'Private catamaran sunset sail along Mandovi river',
        'Curated coastal cafes & seafood shack hopping',
        'Secret beach exploration & historic Cabo de Rama fort'
      ],
      agentStats: {
        destinationsChecked: 58,
        budgetSaved: '₹4,800',
        driveTimeSaved: '3.1 hrs',
        hotelRating: '4.8/5'
      }
    }
  };

  const current = demoData[selectedDemoTrip];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 via-sky-50 to-white border-b border-blue-100/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1E60FF] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/80 text-[#1E60FF] text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Live Product Walkthrough
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                TripPilot AI in Action
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors border border-slate-200/60"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Quick Select Destination Pill Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sample AI Output:
            </span>
            <div className="inline-flex rounded-full bg-slate-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => setSelectedDemoTrip('coorg')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedDemoTrip === 'coorg'
                    ? 'bg-[#1E60FF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌲 Coorg Nature
              </button>
              <button
                type="button"
                onClick={() => setSelectedDemoTrip('goa')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedDemoTrip === 'goa'
                    ? 'bg-[#1E60FF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏖️ Goa Coast
              </button>
            </div>
          </div>

          {/* AI Itinerary Card Showcase */}
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl p-5 border border-blue-100/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#1E60FF] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {current.destination}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {current.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
                  {current.duration}
                </span>
                <span className="px-3 py-1 bg-[#1E60FF] text-white rounded-full text-xs font-bold shadow-xs">
                  {current.budget}
                </span>
              </div>
            </div>

            {/* AI Agent Highlights */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1E60FF]" />
                Generated Day-Wise Highlights
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {current.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 bg-white/90 p-3 rounded-xl border border-blue-100/50 shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#1E60FF] shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700 font-medium leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Agent Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-blue-100/70">
              <div className="bg-white/80 p-2.5 rounded-xl text-center border border-slate-100">
                <div className="text-lg font-black text-[#1E60FF]">{current.agentStats.budgetSaved}</div>
                <div className="text-[11px] font-medium text-slate-500">Budget Saved</div>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl text-center border border-slate-100">
                <div className="text-lg font-black text-slate-800">{current.agentStats.destinationsChecked}</div>
                <div className="text-[11px] font-medium text-slate-500">Spots Evaluated</div>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl text-center border border-slate-100">
                <div className="text-lg font-black text-slate-800">{current.agentStats.driveTimeSaved}</div>
                <div className="text-[11px] font-medium text-slate-500">Drive Time Cut</div>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl text-center border border-slate-100">
                <div className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {current.agentStats.hotelRating}
                </div>
                <div className="text-[11px] font-medium text-slate-500">Curated Stays</div>
              </div>
            </div>
          </div>

          {/* How TripPilot works 3-step banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1E60FF] font-bold text-xs flex items-center justify-center mx-auto mb-2">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-800">Prompt or Pick</h4>
              <p className="text-[11px] text-slate-500 mt-1">Tell TripPilot your destination, days & budget in plain English.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1E60FF] font-bold text-xs flex items-center justify-center mx-auto mb-2">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-800">4 AI Agents Work</h4>
              <p className="text-[11px] text-slate-500 mt-1">Scout, Budget Guardian, Route Maestro & Stay Matcher synthesize your plan.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1E60FF] font-bold text-xs flex items-center justify-center mx-auto mb-2">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-800">Experience & Book</h4>
              <p className="text-[11px] text-slate-500 mt-1">Collaborate with friends, view on live map, and export to PDF.</p>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Ready to design your personalized getaway? Takes only 30 seconds.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors w-full sm:w-auto"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/wizard');
              }}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1E60FF] hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              <span>Launch AI Wizard</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
