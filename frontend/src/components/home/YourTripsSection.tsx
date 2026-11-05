import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, ArrowRight, Compass, Sparkles } from 'lucide-react';
import { Trip } from '../../types';
import { formatCurrency } from '../../lib/currency';

interface YourTripsSectionProps {
  trips: Trip[];
  onOpenTrip: (tripId: string) => void;
}

export const YourTripsSection: React.FC<YourTripsSectionProps> = ({ trips, onOpenTrip }) => {
  const navigate = useNavigate();

  // Show up to 3 trips side-by-side with the "Plan New Trip" card
  const displayTrips = trips.slice(0, 3);

  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return 'Dates Flexible';
    const s = new Date(start);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sStr = `${months[s.getMonth()]} ${s.getDate()}`;
    if (!end) return sStr;
    const e = new Date(end);
    const eStr = `${months[e.getMonth()]} ${e.getDate()}`;
    return `${sStr} – ${eStr}`;
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-neutral-900 tracking-tight">
            Your Trips
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#1E60FF] border border-[#D3E3FD]">
            {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}
          </span>
        </div>
        {trips.length > 3 && (
          <Link
            to="/dashboard"
            className="text-xs font-bold text-neutral-600 hover:text-[#1E60FF] flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Grid of Trip Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayTrips.map((trip) => {
          return (
            <div
              key={trip.id}
              onClick={() => onOpenTrip(trip.id)}
              className="group bg-gradient-to-br from-white via-[#F8FBFF] to-[#EFF6FF] rounded-2xl border border-[#D3E3FD] hover:border-[#1E60FF] shadow-xs hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer p-4 flex flex-col justify-between min-h-[175px] relative overflow-hidden"
            >
              {/* Subtle Calligraphic Watermark Accent */}
              <div className="absolute -top-3 -right-2 w-20 h-20 rounded-full bg-blue-100/30 blur-xl pointer-events-none" />

              {/* Card Top: Duration Pill + Style */}
              <div className="flex items-center justify-between gap-2 relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90 border border-[#D3E3FD] text-[#1E60FF] shadow-2xs">
                  {trip.travel_style || 'Curated'}
                </span>
                <span className="bg-[#EBF2FF] text-[#1E60FF] border border-[#D3E3FD] px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0">
                  {trip.duration_days} Days
                </span>
              </div>

              {/* Card Center: Elegant Calligraphic Typing of Destination and Title */}
              <div className="my-3 space-y-1 relative z-10">
                <h3 className="font-serif italic font-extrabold text-xl text-[#0B2545] tracking-tight group-hover:text-[#1E60FF] transition-colors line-clamp-1 leading-snug">
                  {trip.destination || trip.title}
                </h3>
                <p className="font-sans text-[11px] font-semibold text-slate-500 truncate">
                  {trip.title}
                </p>
                {trip.origin && (
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    Departure: {trip.origin.split(',')[0]}
                  </p>
                )}
              </div>

              {/* Card Bottom: Date & Budget */}
              <div className="pt-2.5 border-t border-blue-100/80 flex items-center justify-between text-xs relative z-10">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#1E60FF] shrink-0" />
                  <span className="truncate">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </span>
                </div>
                {trip.total_budget > 0 && (
                  <span className="font-bold text-[11px] text-[#1E60FF] bg-[#EBF2FF] px-2 py-0.5 rounded-md">
                    {formatCurrency(trip.total_budget, trip.currency || 'USD', false)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Plan New Trip Card (always visible in Ocean Blue style) */}
        <button
          type="button"
          onClick={() => navigate('/wizard')}
          className="min-h-[175px] rounded-2xl border-2 border-dashed border-[#1E60FF]/30 bg-[#EBF2FF]/30 hover:bg-[#EBF2FF]/80 hover:border-[#1E60FF] transition-all duration-200 flex flex-col items-center justify-center gap-2.5 p-5 text-center group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#EBF2FF] text-[#1E60FF] group-hover:bg-[#1E60FF] group-hover:text-white flex items-center justify-center transition-all shadow-xs group-hover:scale-105">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-xs sm:text-sm text-[#1E60FF] block">
              Plan New Trip
            </span>
            <span className="text-[10px] text-slate-500 block">
              Generate custom itinerary with AI
            </span>
          </div>
        </button>
      </div>

      {/* Empty State Callout when user has 0 trips */}
      {displayTrips.length === 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F0F6FF] to-white border border-[#D3E3FD] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2FF] text-[#1E60FF] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#1E60FF]" />
            </div>
            <div>
              <p className="font-serif italic font-bold text-sm text-[#0B2545]">
                No trips planned yet
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Tap “Plan New Trip” to craft your first personalized itinerary in seconds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/wizard')}
            className="px-4 py-2 rounded-xl bg-[#1E60FF] hover:bg-[#0052FF] text-white text-xs font-bold transition-all shadow-sm shrink-0"
          >
            Get Started
          </button>
        </div>
      )}
    </div>
  );
};
