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
  Luggage
} from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { TripStatus } from '../types';
import { formatCurrency } from '../lib/currency';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { trips, deleteTrip, setActiveTripId } = useTrips();
  const { profile, user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrips = trips.filter((t) => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingCount = trips.filter((t) => new Date(t.start_date) >= new Date()).length;

  const STATUS_BADGES: Record<TripStatus, { bg: string; text: string }> = {
    planning: { bg: 'bg-amber-100/80 text-amber-800 border-amber-200', text: 'In Planning' },
    confirmed: { bg: 'bg-emerald-100/80 text-emerald-800 border-emerald-200', text: 'Confirmed' },
    completed: { bg: 'bg-blue-100/80 text-blue-800 border-blue-200', text: 'Completed' },
    draft: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'Draft' },
    cancelled: { bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'Cancelled' },
  };

  const handleOpenTrip = (tripId: string) => {
    setActiveTripId(tripId);
    navigate(`/trip/${tripId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>TripPilot Workspace • Supabase Synchronized</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Welcome back, {profile?.full_name || 'Traveler'}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              You have {upcomingCount} upcoming adventure{upcomingCount === 1 ? '' : 's'} scheduled. Your AI agent has organized your attractions and budget allocations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/wizard"
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Trip</span>
            </Link>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Managed Trips</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{trips.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Departures</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{upcomingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agent Planning Status</p>
            <p className="text-2xl font-black text-slate-900 mt-1">Active</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-xl text-xs font-bold">
          {['all', 'planning', 'confirmed', 'draft'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition-colors ${
                filter === s ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="group bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Cover Image & Status Badge */}
              <div className="relative h-48 overflow-hidden bg-slate-100 cursor-pointer" onClick={() => handleOpenTrip(trip.id)}>
                <img
                  src={
                    trip.cover_image_url ||
                    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={trip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                <div className="absolute top-3 left-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm shadow-xs ${badge.bg}`}
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
                    className="p-1.5 rounded-full bg-black/40 hover:bg-rose-600 text-white transition-colors"
                    title="Delete Trip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider block">
                    {trip.duration_days} Days Journey
                  </span>
                  <h3 className="font-extrabold text-base line-clamp-1 group-hover:text-blue-300 transition-colors">
                    {trip.title}
                  </h3>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-semibold text-slate-800">{trip.destination}</span>
                    <span className="text-slate-400">from {trip.origin}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                      {trip.start_date} → {trip.end_date}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <span>{formatCurrency(trip.total_budget, trip.currency)}</span>
                      <span className="text-[11px] font-normal text-slate-400">{trip.currency}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users className="w-3.5 h-3.5" />
                      {trip.traveler_count} {trip.traveler_count === 1 ? 'traveler' : 'travelers'}
                    </span>
                  </div>
                </div>

                {/* View Trip Button */}
                <button
                  onClick={() => handleOpenTrip(trip.id)}
                  className="w-full py-2.5 rounded-xl bg-slate-50 group-hover:bg-blue-600 text-slate-700 group-hover:text-white font-bold text-xs border border-slate-200 group-hover:border-transparent transition-all flex items-center justify-center gap-1.5 shadow-xs"
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
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Trips Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? `No itineraries matching "${searchTerm}". Try a different keyword.`
              : `No trips found in this category.`}
          </p>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create a New Trip</span>
          </Link>
        </div>
      )}
    </div>
  );
};
