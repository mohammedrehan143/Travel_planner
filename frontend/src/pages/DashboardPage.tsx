import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Trash2,
  BookmarkCheck,
  CheckCircle2,
  SlidersHorizontal,
  Luggage,
  Database,
  CloudUpload,
  RefreshCw
} from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { TripStatus } from '../types';
import { formatCurrency } from '../lib/currency';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { trips, deleteTrip, setActiveTripId, isCloudSynced, syncCurrentTripsToSupabase, refreshData } = useTrips();
  const { profile, user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncMsg('');
    const res = await syncCurrentTripsToSupabase();
    setIsSyncing(false);
    if (res.success) {
      setSyncMsg(`Successfully synced ${res.count} trip(s) directly to Supabase under ${profile?.phone || 'your account'}!`);
      setTimeout(() => setSyncMsg(''), 5000);
    } else {
      setSyncMsg(res.error || 'Sync failed.');
      setTimeout(() => setSyncMsg(''), 5000);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingCount = trips.filter((t) => new Date(t.start_date) >= new Date()).length;

  const STATUS_BADGES: Record<TripStatus, { bg: string; text: string }> = {
    planning: { bg: 'bg-orange-50 text-orange-800 border-orange-200', text: 'In Planning' },
    confirmed: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'Confirmed' },
    completed: { bg: 'bg-[#F3F4F6] text-[#171717] border-[#E5E7EB]', text: 'Completed' },
    draft: { bg: 'bg-[#F3F4F6] text-[#525252] border-[#E5E7EB]', text: 'Draft' },
    cancelled: { bg: 'bg-red-50 text-red-800 border-red-200', text: 'Cancelled' },
  };

  const handleOpenTrip = (tripId: string) => {
    setActiveTripId(tripId);
    navigate(`/trip/${tripId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white">
      {/* Welcome Banner (Selective Dark Section) */}
      <div className="relative rounded-3xl bg-[#171717] text-white p-6 sm:p-8 overflow-hidden border border-neutral-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#F97316] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
              <span>
                {isCloudSynced ? '● Live Supabase Connected' : 'TripPilot Workspace • Local Storage'}
              </span>
              {profile?.phone && (
                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full ml-1">
                  ID: {profile.phone}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Welcome back, {profile?.full_name || 'Traveler'}!
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
              You have {upcomingCount} upcoming adventure{upcomingCount === 1 ? '' : 's'} scheduled. All trips, days, and budget activities are managed under your account.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCloudSync}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              title="Push all trips to Supabase database"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce text-[#F97316]' : 'text-neutral-300'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync to Cloud DB'}</span>
            </button>
            <Link
              to="/wizard"
              role="button"
              className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Trip</span>
            </Link>
          </div>
        </div>

        {syncMsg && (
          <div className="relative z-10 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{syncMsg}</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#525252] uppercase tracking-wider">Total Managed Trips</p>
            <p className="text-2xl font-black text-[#171717] mt-1">{trips.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] border border-orange-100 flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#F97316]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#525252] uppercase tracking-wider">Upcoming Departures</p>
            <p className="text-2xl font-black text-[#171717] mt-1">{upcomingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] text-[#171717] border border-[#E5E7EB] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#171717]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#525252] uppercase tracking-wider">Agent Planning Status</p>
            <p className="text-2xl font-black text-[#171717] mt-1">Active</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] border border-orange-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#F97316]" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-[#F3F4F6] rounded-xl text-xs font-bold border border-[#E5E7EB]">
          {['all', 'planning', 'confirmed', 'draft'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition-colors ${
                filter === s ? 'bg-white text-[#171717] shadow-sm border border-[#E5E7EB]' : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search destination or trip name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white text-[#171717] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.map((trip) => {
          const badge = STATUS_BADGES[trip.status] || STATUS_BADGES.planning;
          return (
            <div
              key={trip.id}
              className="group bg-white rounded-2xl border border-[#E5E7EB] shadow-card hover:shadow-lg hover:border-[#F97316]/50 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Cover Image & Status Badge */}
              <div className="relative h-48 overflow-hidden bg-neutral-100 cursor-pointer" onClick={() => handleOpenTrip(trip.id)}>
                <img
                  src={
                    trip.cover_image_url ||
                    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={trip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                <div className="absolute top-3 left-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm shadow-sm ${badge.bg}`}
                  >
                    {badge.text}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${trip.title}"?`)) {
                        deleteTrip(trip.id);
                      }
                    }}
                    className="p-1.5 rounded-full bg-black/50 hover:bg-[#DC2626] text-white transition-colors"
                    title="Delete Trip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[11px] font-semibold text-[#F97316] uppercase tracking-wider block">
                    {trip.duration_days} Days Journey
                  </span>
                  <h3 className="font-extrabold text-base line-clamp-1 group-hover:text-neutral-200 transition-colors">
                    {trip.title}
                  </h3>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5 text-xs text-[#525252]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                    <span className="font-semibold text-[#171717]">{trip.destination}</span>
                    <span className="text-[#525252]">from {trip.origin}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#525252] shrink-0" />
                    <span>
                      {trip.start_date} → {trip.end_date}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                    <span className="flex items-center gap-1 font-bold text-[#171717]">
                      <span>{formatCurrency(trip.total_budget, trip.currency)}</span>
                      <span className="text-[11px] font-normal text-[#525252]">{trip.currency}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#525252]">
                      <Users className="w-3.5 h-3.5" />
                      {trip.traveler_count} {trip.traveler_count === 1 ? 'traveler' : 'travelers'}
                    </span>
                  </div>
                </div>

                {/* View Trip Button */}
                <button
                  onClick={() => handleOpenTrip(trip.id)}
                  className="w-full py-2.5 rounded-xl bg-[#F3F4F6] group-hover:bg-[#F97316] text-[#171717] group-hover:text-white font-bold text-xs border border-[#E5E7EB] group-hover:border-transparent transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span>Open Itinerary Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTrips.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E7EB] p-8 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] border border-orange-100 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#171717]">No Trips Found</h3>
          <p className="text-xs text-[#525252] max-w-md mx-auto">
            {searchTerm
              ? `No itineraries matching "${searchTerm}". Try a different keyword.`
              : `No trips found in this category.`}
          </p>
          <Link
            to="/wizard"
            role="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create a New Trip</span>
          </Link>
        </div>
      )}
    </div>
  );
};
