import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CalendarDays, IndianRupee, Users } from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const features = [
    {
      title: 'AI Trip Planner',
      description: 'Get personalized itineraries in seconds',
      icon: Sparkles,
      iconBg: 'bg-emerald-50 text-emerald-600',
      link: '/wizard',
    },
    {
      title: 'Smart Itinerary',
      description: 'Day-wise plan with stays, travel & activities',
      icon: CalendarDays,
      iconBg: 'bg-purple-50 text-purple-600',
      link: '/dashboard',
    },
    {
      title: 'Budget Optimizer',
      description: 'Plan within your budget and save more',
      icon: IndianRupee,
      iconBg: 'bg-amber-50 text-amber-600',
      link: '/dashboard',
    },
    {
      title: 'Trip Collaborate',
      description: 'Plan together with your friends',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600',
      link: '/dashboard',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <Link
            key={f.title}
            to={f.link}
            className="bg-white rounded-2xl p-4 border border-[#E5E7EB] hover:border-[#16A34A]/40 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 group"
          >
            <div
              className={`w-11 h-11 rounded-2xl ${f.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#16A34A] transition-colors truncate">
                {f.title}
              </h3>
              <p className="text-xs text-neutral-500 leading-snug line-clamp-2">
                {f.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
