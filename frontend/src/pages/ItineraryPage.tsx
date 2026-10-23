import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Plus,
  Sparkles,
  Share2,
  FileDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sun,
  CloudSun,
  Cloud,
  ChevronRight,
  MessageSquare,
  Users,
  Luggage,
  Layers,
  Map as MapIcon,
  PieChart as ChartIcon,
  Plane,
  Rocket,
  Check,
  CheckSquare,
  Square,
  PartyPopper
} from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { ActivityCard } from '../components/itinerary/ActivityCard';
import { ActivityEditModal } from '../components/itinerary/ActivityEditModal';
import { ItineraryMap } from '../components/itinerary/ItineraryMap';
import { BudgetTracker } from '../components/itinerary/BudgetTracker';
import { AIChatDrawer } from '../components/itinerary/AIChatDrawer';
import { CollaborationModal } from '../components/itinerary/CollaborationModal';
import { PackingChecklist } from '../components/itinerary/PackingChecklist';
import { PDFExportView } from '../components/itinerary/PDFExportView';
import { Activity, TripDay } from '../types';
import { TripPilotAPI } from '../lib/api';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { getAccurateFlightEstimate } from '../lib/flightPricing';

export const ItineraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    trips,
    tripDays,
    activities,
    activeTrip,
    activeTripDays,
    activeTripActivities,
    activeAccommodations,
    activeExpenses,
    activeCollaborators,
    activeChecklist,
    setActiveTripId,
    updateTrip,
    addActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    regenerateDay,
  } = useTrips();

  // Find target trip
  const trip = trips.find((t) => t.id === id) || trips[0];

  // Accurate flight estimate computation
  const flightEstimate = trip
    ? getAccurateFlightEstimate(
        trip.origin,
        trip.destination,
        trip.currency,
        trip.flight_ticket_estimate
      )
    : null;

  // Set active trip in context whenever id or trip changes
  React.useEffect(() => {
    if (trip && trip.id) {
      setActiveTripId(trip.id);
    }
    setSelectedDayIndex(0);
  }, [id, trip?.id]);

  const days = (trip && tripDays && tripDays[trip.id]) || activeTripDays || [];
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const currentDay = days[selectedDayIndex] || days[0];
  const dayActivities = currentDay ? ((activities && activities[currentDay.id]) || activeTripActivities[currentDay.id] || []) : [];

  // Modals & Panels State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [pdfExportOpen, setPdfExportOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationScore, setValidationScore] = useState<number | null>(96);

  // Activity Selection & Trip Activation State
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set());
  const [isUserConfirmed, setIsUserConfirmed] = useState(false);
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [tripStartedModalOpen, setTripStartedModalOpen] = useState(false);

  // Initialize selected activity IDs when day changes or loads
  React.useEffect(() => {
    if (dayActivities.length > 0) {
      setSelectedActivityIds(new Set(dayActivities.map((a) => a.id)));
    }
  }, [currentDay?.id, dayActivities.length]);

  const toggleSelectActivity = (actId: string) => {
    setSelectedActivityIds((prev) => {
      const next = new Set(prev);
      if (next.has(actId)) {
        next.delete(actId);
      } else {
        next.add(actId);
      }
      return next;
    });
  };

  const selectAllActivities = () => {
    setSelectedActivityIds(new Set(dayActivities.map((a) => a.id)));
  };

  const deselectAllActivities = () => {
    setSelectedActivityIds(new Set());
  };

  const handleStartTrip = async () => {
    if (!trip) return;
    setIsStartingTrip(true);
    try {
      await updateTrip(trip.id, { status: 'confirmed' });
      setTripStartedModalOpen(true);
    } finally {
      setIsStartingTrip(false);
    }
  };

  // Tab view: 'schedule' | 'map' | 'budget' | 'checklist'
  const [activeTab, setActiveTab] = useState<'schedule' | 'map' | 'budget' | 'checklist'>('schedule');

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <p className="text-slate-600">Trip not found or has been removed.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Activity reorder handlers
  const handleMoveUp = (index: number) => {
    if (index === 0 || !currentDay) return;
    const items = [...dayActivities];
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;
    reorderActivities(currentDay.id, items);
  };

  const handleMoveDown = (index: number) => {
    if (index === dayActivities.length - 1 || !currentDay) return;
    const items = [...dayActivities];
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;
    reorderActivities(currentDay.id, items);
  };

  const handleRegenerateDay = async () => {
    if (!currentDay) return;
    setIsRegenerating(true);
    try {
      await regenerateDay(currentDay.id);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleValidateTrip = async () => {
    setIsValidating(true);
    try {
      const res = await TripPilotAPI.validateTrip(trip.id, trip, dayActivities);
      setValidationScore(res.score);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header Banner */}
      <div className="relative rounded-3xl bg-slate-900 text-white overflow-hidden shadow-xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={
              trip.cover_image_url ||
              'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80'
            }
            alt={trip.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Action pills top right */}
          <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2 z-10">
            <button
              onClick={() => setCollabModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Share ({activeCollaborators.length})</span>
            </button>

            <button
              onClick={() => setPdfExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => setChatDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Co-Pilot</span>
            </button>
          </div>

          {/* Bottom Title & Details */}
          <div className="absolute bottom-6 left-6 right-6 z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white backdrop-blur-sm border border-blue-400/40">
                {trip.destination}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                {trip.duration_days} Days Journey
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Budget: {formatCurrency(trip.total_budget, trip.currency, true)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30 flex items-center gap-1 backdrop-blur-sm">
                <Plane className="w-3 h-3 text-sky-300" />
                <span>
                  Flight: {flightEstimate?.cost === 0
                    ? `Local (${getCurrencySymbol(trip.currency)}0)`
                    : formatCurrency(flightEstimate?.cost || 0, trip.currency, true)}
                </span>
              </span>
              {trip.status === 'confirmed' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                  <span>Active Trip</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/70 text-amber-100 backdrop-blur-sm">
                  Review & Confirm
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {trip.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
              {trip.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs: Schedule, Interactive Map, Budget, Packing */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'schedule'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Day Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'map'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Interactive Map & Route</span>
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'budget'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChartIcon className="w-4 h-4" />
            <span>Budget Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'checklist'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Luggage className="w-4 h-4" />
            <span>Packing Checklist</span>
          </button>
        </div>

        {/* Validation Score Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleValidateTrip}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Validation Score: {validationScore}%</span>
          </button>
        </div>
      </div>

      {/* SCHEDULE VIEW */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Day Navigation Selector Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {days.map((day, idx) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex-1 min-w-[140px] p-3.5 rounded-2xl border text-left transition-all ${
                  selectedDayIndex === idx
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-400/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-black ${selectedDayIndex === idx ? 'text-blue-100' : 'text-slate-900'}`}>
                    Day {day.day_number}
                  </span>
                  <span className={`text-[10px] ${selectedDayIndex === idx ? 'text-blue-200' : 'text-slate-400'}`}>
                    {day.date}
                  </span>
                </div>
                <p className={`text-[11px] font-medium line-clamp-1 ${selectedDayIndex === idx ? 'text-white' : 'text-slate-600'}`}>
                  {day.theme || `Day ${day.day_number} highlights`}
                </p>
              </button>
            ))}
          </div>

          {/* Current Day Header Card */}
          {currentDay && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">
                    Day {currentDay.day_number}: {currentDay.theme}
                  </h2>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {currentDay.summary}
                </p>
              </div>

              {/* Weather & Day Actions */}
              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                {currentDay.weather_summary && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{currentDay.weather_summary.temp_c}°C {currentDay.weather_summary.condition}</span>
                  </div>
                )}

                <button
                  onClick={handleRegenerateDay}
                  disabled={isRegenerating}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
                  title="Ask AI to suggest alternative activities for this day"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate Day</span>
                </button>

                <button
                  onClick={() => {
                    setEditingActivity(null);
                    setEditModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Activity</span>
                </button>
              </div>
            </div>
          )}

          {/* Flight Ticket Charges Estimation Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">✈️ Flight & Long-Distance Fare Estimate:</span>
                  <span className="font-black text-blue-700 text-sm">
                    {flightEstimate?.cost === 0
                      ? `Local Traveling Only (${getCurrencySymbol(trip.currency)}0)`
                      : formatCurrency(flightEstimate?.cost || 0, trip.currency, true)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                    AI Live Market Rate
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {flightEstimate?.description || `Estimated round-trip airfare from ${trip.origin} to ${trip.destination}.`}
                  {flightEstimate?.airlines ? ` • Carrier: ${flightEstimate.airlines}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Selection Controls Toolbar */}
          {dayActivities.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">
                  Select Activities to Include in Your Journey ({selectedActivityIds.size} of {dayActivities.length} selected)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllActivities}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-300 shadow-2xs transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAllActivities}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-300 shadow-2xs transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Activity Cards List */}
          <div className="space-y-4">
            {dayActivities.length > 0 ? (
              dayActivities.map((act, index) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  index={index}
                  totalActivities={dayActivities.length}
                  isSelected={selectedActivityIds.has(act.id)}
                  onToggleSelect={() => toggleSelectActivity(act.id)}
                  onEdit={(activity) => {
                    setEditingActivity(activity);
                    setEditModalOpen(true);
                  }}
                  onDelete={(activityId) => {
                    if (confirm(`Remove "${act.title}" from Day ${currentDay?.day_number}?`)) {
                      if (currentDay) deleteActivity(currentDay.id, activityId);
                    }
                  }}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                />
              ))
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
                <Compass className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Activities Scheduled for this Day</h4>
                <p className="text-xs text-slate-500">
                  Click 'Add Activity' or use 'Regenerate Day' to automatically build a schedule with AI.
                </p>
                <button
                  onClick={() => {
                    setEditingActivity(null);
                    setEditModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Add First Activity
                </button>
              </div>
            )}
          </div>

          {/* User Confirmation & Start Trip Section */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Trip Ready for Acceptance</span>
                </div>
                <h3 className="text-lg font-black text-white">Accept & Start Your Trip</h3>
                <p className="text-xs text-slate-300 max-w-lg mt-0.5">
                  Select the places you love, check "Yes" to confirm this itinerary, and start your real-world journey!
                </p>
              </div>

              {/* User Confirmation Toggle ("Say Yes") */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={isUserConfirmed}
                  onChange={(e) => setIsUserConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black text-white block">
                    Yes, I accept this plan!
                  </span>
                  <span className="text-[10px] text-slate-300">
                    Confirm {selectedActivityIds.size} selected spot(s)
                  </span>
                </div>
              </label>
            </div>

            {/* When user checks "Yes": The Start Trip button pops up! */}
            {isUserConfirmed && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Plan accepted! All selected places are ready in your itinerary.</span>
                </div>

                <button
                  onClick={handleStartTrip}
                  disabled={isStartingTrip || selectedActivityIds.size === 0}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Rocket className="w-4 h-4 text-slate-950" />
                  <span>🚀 Start Trip (Accept & Activate)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAP VIEW */}
      {activeTab === 'map' && (
        <ItineraryMap
          trip={trip}
          activities={dayActivities}
          selectedDayNumber={currentDay?.day_number || 1}
        />
      )}

      {/* BUDGET VIEW */}
      {activeTab === 'budget' && (
        <BudgetTracker trip={trip} expenses={activeExpenses} />
      )}

      {/* PACKING CHECKLIST VIEW */}
      {activeTab === 'checklist' && (
        <PackingChecklist items={activeChecklist} />
      )}

      {/* Activity Edit / Add Modal */}
      {currentDay && (
        <ActivityEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          dayId={currentDay.id}
          initialActivity={editingActivity}
          onSave={(data) => {
            if (editingActivity) {
              updateActivity(currentDay.id, editingActivity.id, data);
            } else {
              addActivity(currentDay.id, {
                ...data,
                trip_id: trip.id,
                trip_day_id: currentDay.id,
                order_index: dayActivities.length,
                currency: trip.currency,
              } as any);
            }
          }}
        />
      )}

      {/* AI Assistant Chat Drawer */}
      <AIChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        trip={trip}
        currentDay={currentDay}
      />

      {/* Collaboration Modal */}
      <CollaborationModal
        isOpen={collabModalOpen}
        onClose={() => setCollabModalOpen(false)}
        trip={trip}
        collaborators={activeCollaborators}
      />

      {/* PDF Export View */}
      {pdfExportOpen && (
        <PDFExportView
          trip={trip}
          days={days}
          activitiesByDay={activeTripActivities}
          expenses={activeExpenses}
          onClose={() => setPdfExportOpen(false)}
        />
      )}

      {/* Trip Started Celebration Modal */}
      {tripStartedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl border border-slate-100">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <Rocket className="w-8 h-8 animate-bounce text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                🎉 Trip Started & Accepted!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your journey to <span className="font-bold text-slate-900">{trip.destination}</span> is now active with <span className="font-bold text-blue-600">{selectedActivityIds.size} places</span> confirmed.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5 text-left font-medium">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Trip status updated to <strong>Active / Confirmed</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Selected itinerary and daily schedule verified and locked</span>
              </p>
            </div>

            <button
              onClick={() => setTripStartedModalOpen(false)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              Continue Exploring My Itinerary
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
