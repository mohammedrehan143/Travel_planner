import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, ArrowRight } from 'lucide-react';
import { Trip } from '../../types';

interface YourTripsSectionProps {
  trips: Trip[];
  onOpenTrip: (tripId: string) => void;
}

export const YourTripsSection: React.FC<YourTripsSectionProps> = ({ trips, onOpenTrip }) => {
  const navigate = useNavigate();

  // Pick up to 3 trips to display side-by-side with the "Plan New Trip" card
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
        <h2 className="text-xl font-black text-neutral-900 tracking-tight">
          Your Trips
        </h2>
        <Link
          to="/dashboard"
          className="text-xs font-bold text-neutral-600 hover:text-[#16A34A] flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Trip Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayTrips.map((trip) => {
          return (
            <div
              key={trip.id}
              onClick={() => onOpenTrip(trip.id)}
              className="group bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] hover:border-[#16A34A]/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              {/* Trip Cover Image & Days Badge */}
              <div className="relative h-32 w-full overflow-hidden bg-neutral-100">
                <img
                  src={
                    trip.cover_image_url ||
                    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={trip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Days Badge */}
                <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-neutral-800 shadow-sm">
                  {trip.duration_days} Days
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 space-y-1">
                <h3 className="font-bold text-sm text-neutral-900 truncate group-hover:text-[#16A34A] transition-colors">
                  {trip.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Plan New Trip Card */}
        <button
          type="button"
          onClick={() => navigate('/wizard')}
          className="h-full min-h-[160px] rounded-2xl border-2 border-dashed border-[#16A34A]/30 bg-emerald-50/20 hover:bg-emerald-50/60 transition-all flex flex-col items-center justify-center gap-2 p-5 text-center group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#16A34A]/10 text-[#16A34A] group-hover:bg-[#16A34A] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-[#16A34A] group-hover:underline">
            Plan New Trip
          </span>
        </button>
      </div>
    </div>
  );
};
