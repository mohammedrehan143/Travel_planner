import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Trash2,
  CheckCircle2,
  CloudUpload,
  Search,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { TripStatus } from '../types';
import { formatCurrency } from '../lib/currency';
import { HeroBanner } from '../components/home/HeroBanner';
import { FeatureCards } from '../components/home/FeatureCards';
import { YourTripsSection } from '../components/home/YourTripsSection';
import { TripPilotChatWidget } from '../components/home/TripPilotChatWidget';
import { MonthStatsWidget } from '../components/home/MonthStatsWidget';
import { AIChatDrawer } from '../components/itinerary/AIChatDrawer';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { trips, deleteTrip, setActiveTripId, isCloudSynced, syncCurrentTripsToSupabase } = useTrips();
  const { profile } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

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
    const title = t.title || '';
    const dest = t.destination || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const todayIso = new Date().toISOString().split('T')[0];
  const upcomingCount = trips.filter((t) => (t.start_date || '') >= todayIso).length;

  const STATUS_BADGES: Record<TripStatus, { bg: string; text: string }> = {
    planning: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'In Planning' },
    confirmed: { bg: 'bg-blue-50 text-blue-800 border-blue-200', text: 'Confirmed' },
    completed: { bg: 'bg-neutral-100 text-neutral-800 border-neutral-200', text: 'Completed' },
    draft: { bg: 'bg-neutral-100 text-neutral-600 border-neutral-200', text: 'Draft' },
    cancelled: { bg: 'bg-red-50 text-red-800 border-red-200', text: 'Cancelled' },
  };

  const handleOpenTrip = (tripId: string) => {
    setActiveTripId(tripId);
    navigate(`/trip/${tripId}`);
  };

  const handleOpenAssistant = (prompt?: string) => {
    setChatInitialPrompt(prompt);
    setIsAIChatOpen(true);
  };

  const activeTripForChat = trips[0] || {
    id: 'coorg-trip-0001',
    user_id: 'demo-user',
    title: 'Coorg Getaway',
    destination: 'Coorg, Karnataka',
    duration_days: 5,
    traveler_count: 2,
    travel_style: 'adventure',
    interests: ['coffee plantations', 'trekking'],
    total_budget: 15000,
    currency: 'INR',
    status: 'planning',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-8 select-none">
      {/* 1. Hero Section matching image.png with static background image */}
      <HeroBanner onSearchSubmit={(query) => navigate(`/wizard?q=${encodeURIComponent(query)}`)} />

      {/* 2. Four Feature Cards directly below Hero Section */}
      <FeatureCards />

      {/* 3. Main Dashboard 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Your Trips & All Trips Explorer */}
        <div className="lg:col-span-8 space-y-8">
          {/* "Your Trips" carousel/grid matching image.png */}
          <YourTripsSection trips={trips} onOpenTrip={handleOpenTrip} />

          {/* Detailed All Trips Manager & Status Filters */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-neutral-900 tracking-tight">
                  All Managed Trips
                </h3>
                <p className="text-xs text-neutral-500">
                  {filteredTrips.length} itineraries found &bull; {upcomingCount} upcoming
                </p>
              </div>

              {/* Cloud Sync & Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloudSync}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Sync trips to Supabase cloud"
                >
                  <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce text-[#16A34A]' : 'text-neutral-500'}`} />
                  <span>{isSyncing ? 'Syncing...' : isCloudSynced ? 'Synced' : 'Sync DB'}</span>
                </button>
                <Link
                  to="/wizard"
                  className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Trip</span>
                </Link>
              </div>
            </div>

            {syncMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>{syncMsg}</span>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-neutral-100 rounded-xl text-xs font-semibold border border-neutral-200">
                {['all', 'planning', 'confirmed', 'completed', 'draft'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                      filter === s
                        ? 'bg-white text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search destinations..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-[#16A34A] text-xs outline-none transition-colors"
                />
              </div>
            </div>

            {/* Filtered Trips List */}
            {filteredTrips.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-neutral-200 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-800">No itineraries match your criteria</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Try clearing filters or search query.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTrips.map((trip) => {
                  const badge = STATUS_BADGES[trip.status] || STATUS_BADGES.planning;
                  return (
                    <div
                      key={trip.id}
                      className="group bg-neutral-50/50 hover:bg-white rounded-2xl p-4 border border-neutral-200 hover:border-[#16A34A]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.text}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete trip "${trip.title}"?`)) {
                                deleteTrip(trip.id);
                              }
                            }}
                            className="text-neutral-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete itinerary"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4
                          onClick={() => handleOpenTrip(trip.id)}
                          className="font-bold text-sm text-neutral-900 group-hover:text-[#16A34A] transition-colors cursor-pointer line-clamp-1"
                        >
                          {trip.title}
                        </h4>

                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">{trip.destination}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800">
                          {formatCurrency(trip.total_budget, trip.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenTrip(trip.id)}
                          className="text-xs font-bold text-[#16A34A] hover:text-[#15803D] flex items-center gap-1"
                        >
                          <span>Open Plan</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): TripPilot AI Assistant Widget & Monthly Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* TripPilot AI Assistant Widget from image.png */}
          <TripPilotChatWidget onOpenAssistant={handleOpenAssistant} />

          {/* This Month Statistics Widget from image.png */}
          <MonthStatsWidget
            tripsCount={trips.length > 0 ? trips.length : 2}
            nightsCount={trips.reduce((acc, t) => acc + (t.duration_days || 0), 0) || 6}
            totalSpend={trips.reduce((acc, t) => acc + (t.total_budget || 0), 0) || 24500}
          />
        </div>
      </div>

      {/* Interactive AI Chat Drawer */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        trip={activeTripForChat}
      />
    </div>
  );
};
