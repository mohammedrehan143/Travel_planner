import React from 'react';
import { X, Calendar, IndianRupee, Bed, Compass, CloudSun, Headphones, CheckCircle2 } from 'lucide-react';

interface AIAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAgentsModal: React.FC<AIAgentsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const agents = [
    {
      name: 'Planner Agent',
      desc: 'Creates personalized itineraries',
      icon: Calendar,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      name: 'Budget Agent',
      desc: 'Optimizes cost and finds the best deals',
      icon: IndianRupee,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      name: 'Booking Agent',
      desc: 'Handles stays, travel and activities',
      icon: Bed,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      name: 'Local Guide Agent',
      desc: 'Recommends hidden gems and local experiences',
      icon: Compass,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      name: 'Weather Agent',
      desc: 'Monitors weather and adjusts plans',
      icon: CloudSun,
      iconBg: 'bg-cyan-50 text-cyan-600',
    },
    {
      name: 'Support Agent',
      desc: 'Real-time help during your trip',
      icon: Headphones,
      iconBg: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 relative space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            AI Agents
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            A team of specialized agents that plan, optimize and manage your trip.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {agents.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.name}
                className="rounded-2xl border border-neutral-200 p-4 space-y-3 bg-neutral-50/50 hover:bg-white hover:border-[#16A34A] transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${a.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900">{a.name}</h4>
                  <p className="text-xs text-neutral-500 leading-snug mt-0.5">
                    {a.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  <span>Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
