import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Heart,
  Plane,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { TravelStyle, TripCreateWizardInput } from '../types';
import { getCurrencySymbol, formatCurrency, SUPPORTED_CURRENCIES } from '../lib/currency';
import { PlaceAutocomplete } from '../components/common/PlaceAutocomplete';

export const TripWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createTripWithWizard } = useTrips();

  const [step, setStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAgentStep, setCurrentAgentStep] = useState<string>('initialized');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timersRef = useRef<number[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the terminal stream to latest message
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentLogs]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Wizard state with route prefill support
  const initialDest =
    (location.state as any)?.destination ||
    new URLSearchParams(location.search).get('destination') ||
    '';
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState(initialDest);
  const [startDate, setStartDate] = useState('2026-11-10');
  const [endDate, setEndDate] = useState('2026-11-10');
  const [travelerCount, setTravelerCount] = useState<number>(1);
  const [travelCompanion, setTravelCompanion] = useState<string>('solo');
  const [dietaryPreference, setDietaryPreference] = useState<string>('veg');
  const [totalBudget, setTotalBudget] = useState<number>(500);
  const [currency, setCurrency] = useState('INR');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('balanced');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'culinary',
    'cultural',
    'sightseeing',
  ]);
  const [transportPreference, setTransportPreference] = useState('Traveling');
  const [accommodationPreference, setAccommodationPreference] = useState('None (Single Day Outing)');

  const isOneDay = startDate === endDate;

  const setDurationDays = (days: number) => {
    const [y, m, d] = startDate.split('-').map(Number);
    const end = new Date(y, m - 1, d + (days - 1));
    const formattedEnd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setEndDate(formattedEnd);
    if (days === 1) {
      if (currency === 'INR') setTotalBudget(500);
      setAccommodationPreference('None (Single Day Outing)');
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (endDate < newStart) {
      setEndDate(newStart);
    }
  };

  const COMPANIONS = [
    { id: 'solo', label: 'Solo', desc: 'Traveling alone / Solo explorer', defaultTravelers: 1, icon: '🚶' },
    { id: 'couple', label: 'Couple', desc: 'Partner / Romantic travel', defaultTravelers: 2, icon: '💑' },
    { id: 'friends', label: 'Friends', desc: 'Friends group / Fun outings', defaultTravelers: 3, icon: '🎒' },
    { id: 'family', label: 'Family', desc: 'Family with kids / Relaxed', defaultTravelers: 4, icon: '👨‍👩‍👧‍👦' },
    { id: 'colleagues', label: 'Colleagues', desc: 'Business trip / Co-workers', defaultTravelers: 2, icon: '💼' }
  ];

  const DIETARY_OPTIONS = [
    { id: 'veg', label: 'Vegetarian', desc: 'Pure veg dining & local plant-based specialities', icon: '🥬' },
    { id: 'non_veg', label: 'Non-Vegetarian', desc: 'Authentic regional meat, biryanis & seafood grills', icon: '🍗' },
    { id: 'any', label: 'Both / Any', desc: 'No restrictions, explore all regional cuisine', icon: '🥗' }
  ];

  const TRAVEL_STYLES: { id: TravelStyle; label: string; desc: string }[] = [
    { id: 'balanced', label: 'Balanced', desc: 'Mix of highlights, downtime, and quality dining' },
    { id: 'cultural', label: 'Cultural & Historic', desc: 'Museums, ancient shrines, traditions, and arts' },
    { id: 'budget', label: 'Budget-Savvy', desc: 'Hostels, public transit, and delicious street food' },
    { id: 'luxury', label: 'Luxury & Comfort', desc: '5-star suites, private drivers, Michelin dining' },
    { id: 'adventure', label: 'Active Adventure', desc: 'Hiking, cycling, outdoors, and thrill-seeking' },
    { id: 'relaxed', label: 'Relaxed & Slow', desc: 'Cafes, botanical gardens, and scenic strolls' },
  ];

  const INTERESTS_OPTIONS = [
    { id: 'culinary', label: 'Culinary & Dining', icon: '🍜' },
    { id: 'cultural', label: 'Heritage & Temples', icon: '⛩️' },
    { id: 'photography', label: 'Photography Spots', icon: '📸' },
    { id: 'shopping', label: 'Shopping & Boutiques', icon: '🛍️' },
    { id: 'nature', label: 'Nature & Parks', icon: '🌲' },
    { id: 'art', label: 'Art & Galleries', icon: '🎨' },
    { id: 'nightlife', label: 'Nightlife & Bars', icon: '🍸' },
    { id: 'architecture', label: 'Architecture & Design', icon: '🏛️' },
  ];

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setErrorMsg(null);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const dest = destination.trim() || 'your destination';
    setProgressPercent(12);
    setAgentLogs([`Initializing TripPilot AI Agent for ${dest}...`]);

    // Schedule realistic tool-execution progression while awaiting backend AI synthesis
    const stages = [
      { delay: 1200, percent: 28, log: `Interpreting trip preferences & travel style for ${dest}...` },
      { delay: 3200, percent: 46, log: `Querying Google Places & OpenStreetMap for top spots in ${dest}...` },
      { delay: 5800, percent: 64, log: `Analyzing real-time weather forecasts & ideal visiting windows...` },
      { delay: 8400, percent: 79, log: `Optimizing route coordinates, transit connections & commute times...` },
      { delay: 11000, percent: 89, log: `Balancing budget limits, meal allocations & activity expenses...` },
      { delay: 13800, percent: 95, log: `Synthesizing AI schedule & assembling daily itinerary...` },
    ];

    stages.forEach(({ delay, percent, log }) => {
      const t = window.setTimeout(() => {
        setProgressPercent((prev) => Math.max(prev, percent));
        setAgentLogs((prev) => (prev.includes(log) ? prev : [...prev, log]));
      }, delay);
      timersRef.current.push(t);
    });

    const input: TripCreateWizardInput = {
      origin,
      destination,
      start_date: startDate,
      end_date: endDate,
      traveler_count: travelerCount,
      travel_companion: travelCompanion,
      dietary_preference: dietaryPreference,
      total_budget: totalBudget,
      currency,
      travel_style: travelStyle,
      interests: selectedInterests,
      transport_preference: transportPreference,
      accommodation_preference: accommodationPreference,
    };

    try {
      const generatedTrip = await createTripWithWizard(
        input,
        (stepName, percent, logMsg) => {
          setCurrentAgentStep(stepName);
          setProgressPercent((prev) => Math.max(prev, percent));
          setAgentLogs((prev) => (prev.includes(logMsg) ? prev : [...prev, logMsg]));
        }
      );

      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      setProgressPercent(100);
      setAgentLogs((prev) => [
        ...prev,
        `Finalized itinerary successfully for ${dest}! Redirecting...`,
      ]);

      // Navigate to the newly generated trip
      setTimeout(() => {
        navigate(`/trip/${generatedTrip.id}`);
      }, 700);
    } catch (err: any) {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      console.error('Trip generation error', err);
      setErrorMsg(err?.message || 'Failed to generate itinerary. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 bg-white">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
          <span>Step-by-Step AI Trip Architect</span>
        </div>
        <h1 className="text-3xl font-black text-[#171717]">Plan Your Next Trip</h1>
        <p className="text-xs text-[#525252]">
          Our tool-calling AI agent validates schedules, weather, transit, and budgets.
        </p>
      </div>

      {/* Step Indicators */}
      {!isGenerating && (
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          {[
            { num: 1, label: 'Destination' },
            { num: 2, label: 'Travelers & Budget' },
            { num: 3, label: 'Style & Interests' },
            { num: 4, label: 'Preferences' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  step === s.num
                    ? 'bg-[#F97316] text-white shadow-sm ring-2 ring-orange-200'
                    : step > s.num
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#F3F4F6] text-[#525252] border border-[#E5E7EB]'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4 text-white" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline-block ${
                  step === s.num ? 'text-[#171717] font-bold' : 'text-[#525252]'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Wizard Form Container */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card p-6 sm:p-8">
        {/* Live Agent Generation Screen */}
        {isGenerating ? (
          <div className="py-10 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            {/* Animated Compass with Glowing Radar Rings */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Outer Ripple / Radar Rings */}
              <div className="absolute inset-0 rounded-3xl bg-orange-500/20 animate-ping opacity-60" />
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 opacity-25 blur-lg animate-pulse" />
              <div className="absolute inset-1 rounded-2xl border-2 border-dashed border-orange-400/50 animate-[spin_8s_linear_infinite]" />
              
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white flex items-center justify-center shadow-xl shadow-orange-500/25">
                <Compass className="w-8 h-8 animate-[spin_4s_linear_infinite]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span>Active Agent Pipeline Running</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#171717]">
                TripPilot AI is Orchestrating Your Itinerary
              </h3>
              <p className="text-xs text-[#525252] max-w-md mx-auto">
                Executing real-time tool calls for places, weather forecasts, route coordinates, and budget constraints.
              </p>
            </div>

            {/* Progress Bar with smooth animated glow & shimmer */}
            <div className="w-full max-w-md mx-auto space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-mono font-medium text-[#525252] px-1">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#F97316]" />
                  <span>Synthesizing trip parameters...</span>
                </span>
                <span className="font-bold text-[#F97316]">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-[#F3F4F6] rounded-full h-3 overflow-hidden border border-[#E5E7EB] p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 transition-all duration-500 ease-out rounded-full relative overflow-hidden shadow-sm"
                  style={{ width: `${Math.max(6, progressPercent)}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Live Terminal-style Agent Logs (Dark Section) */}
            <div className="max-w-md mx-auto text-left p-4 rounded-2xl bg-[#171717] text-neutral-300 font-mono text-[11px] space-y-2 shadow-2xl max-h-56 overflow-y-auto border border-neutral-800">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5 text-[#F97316] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#F97316] animate-pulse" />
                  <span>Agent Execution Stream</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">STREAMING</span>
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                {agentLogs.map((log, i) => {
                  const isLast = i === agentLogs.length - 1;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 leading-relaxed transition-all duration-200"
                    >
                      {isLast ? (
                        <Loader2 className="w-3.5 h-3.5 mt-0.5 text-[#F97316] animate-spin flex-shrink-0" />
                      ) : (
                        <span className="text-[#16A34A] font-bold flex-shrink-0">✓</span>
                      )}
                      <span className={isLast ? 'text-white font-medium' : 'text-neutral-400'}>
                        {log}
                        {isLast && (
                          <span className="inline-block w-1.5 h-3 ml-1 bg-[#F97316] animate-pulse align-middle" />
                        )}
                      </span>
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* STEP 1: Destination & Dates */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-[#171717]">Where and when are you traveling?</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PlaceAutocomplete
                    label="Starting City (Origin)"
                    value={origin}
                    onChange={setOrigin}
                    placeholder="e.g. Current Location, Mumbai, London"
                    icon={<MapPin className="w-4 h-4 text-neutral-400" />}
                  />

                  <PlaceAutocomplete
                    label="Target Destination"
                    value={destination}
                    onChange={setDestination}
                    placeholder="e.g. Goa, Paris, Tokyo, Manali, Jaipur"
                    icon={<Compass className="w-4 h-4 text-[#F97316]" />}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white text-[#171717]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="date"
                        required
                        min={startDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white text-[#171717]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Quick Duration Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { days: 1, label: '⚡ 1-Day Outing' },
                      { days: 2, label: 'Weekend (2D)' },
                      { days: 3, label: '3 Days' },
                      { days: 5, label: '5 Days' },
                    ].map((preset) => {
                      const computedDays = Math.max(
                        1,
                        Math.round(
                          (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
                        ) + 1
                      );
                      const isPresetActive = preset.days === 1 ? isOneDay : computedDays === preset.days;
                      return (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => setDurationDays(preset.days)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                            isPresetActive
                              ? 'bg-[#F97316] text-white border-[#F97316] shadow-sm'
                              : 'bg-white text-[#171717] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  {isOneDay && (
                    <div className="text-[11px] text-orange-900 bg-orange-50 border border-orange-200 rounded-xl p-2.5 flex items-center gap-2">
                      <span className="font-bold text-[#F97316]">⚡ Single-Day Outing active:</span>
                      <span>Optimized to cover maximum top attractions in 1 day with zero lodging expenses.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Travelers & Budget */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-[#171717]">Travelers & Budget Parameters</h3>

                <div className="space-y-4">
                  {/* Travel Companion */}
                  <div>
                    <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                      With Whom Are You Traveling?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {COMPANIONS.map((comp) => (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => {
                            setTravelCompanion(comp.id);
                            setTravelerCount(comp.defaultTravelers);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            travelCompanion === comp.id
                              ? 'bg-orange-50 border-[#F97316] ring-2 ring-orange-500/20 shadow-sm'
                              : 'bg-white border-[#E5E7EB] hover:border-neutral-300'
                          }`}
                        >
                          <span className="text-xl block mb-1">{comp.icon}</span>
                          <p className="text-xs font-bold text-[#171717]">{comp.label}</p>
                          <p className="text-[10px] text-[#525252] line-clamp-1">{comp.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Preference */}
                  <div>
                    <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                      Food & Dietary Preference
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {DIETARY_OPTIONS.map((diet) => (
                        <button
                          key={diet.id}
                          type="button"
                          onClick={() => setDietaryPreference(diet.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            dietaryPreference === diet.id
                              ? 'bg-orange-50 border-[#F97316] ring-2 ring-orange-500/20 shadow-sm'
                              : 'bg-white border-[#E5E7EB] hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{diet.icon}</span>
                            <p className="text-xs font-bold text-[#171717]">{diet.label}</p>
                          </div>
                          <p className="text-[10px] text-[#525252] leading-tight">{diet.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Number of Travelers
                    </label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setTravelerCount(num)}
                          className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                            travelerCount === num
                              ? 'bg-[#F97316] text-white border-[#F97316] shadow-sm'
                              : 'bg-white text-[#171717] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                          }`}
                        >
                          {num} {num === 1 ? 'Solo' : `${num} People`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                        Total Planned Budget (Min: 500)
                      </label>
                      <div className="relative">
                        <span className="w-5 text-center font-bold text-sm text-[#171717] absolute left-3 top-2.5 select-none">
                          {getCurrencySymbol(currency)}
                        </span>
                        <input
                          type="number"
                          min="500"
                          step="100"
                          value={totalBudget}
                          onChange={(e) => setTotalBudget(Number(e.target.value))}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] font-semibold text-[#171717]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-semibold text-[#525252]">Presets:</span>
                        {[500, 1500, 5000, 15000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setTotalBudget(amt)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3F4F6] hover:bg-neutral-200 text-[#171717] border border-[#E5E7EB] transition-colors"
                          >
                            {getCurrencySymbol(currency)}{amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white font-medium text-[#171717]"
                      >
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} ({c.symbol}) - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Travel Style & Interests */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-[#171717]">Travel Style & Interests</h3>

                {/* Travel Style Radio Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Travel Pace & Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TRAVEL_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setTravelStyle(style.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all ${
                          travelStyle === style.id
                            ? 'bg-orange-50 border-[#F97316] ring-2 ring-orange-500/20 shadow-sm'
                            : 'bg-white border-[#E5E7EB] hover:border-neutral-300'
                        }`}
                      >
                        <p className={`text-xs font-bold ${travelStyle === style.id ? 'text-[#F97316]' : 'text-[#171717]'}`}>
                          {style.label}
                        </p>
                        <p className="text-[11px] text-[#525252] mt-1">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Interests Tags */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Select Your Top Interests (Select at least 2)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {INTERESTS_OPTIONS.map((item) => {
                      const isSel = selectedInterests.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleInterest(item.id)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                            isSel
                              ? 'bg-[#F97316] text-white border-[#F97316] shadow-sm'
                              : 'bg-white text-[#171717] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Preferences & Confirmation */}
            {step === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-[#171717]">Transport & Lodging Preferences</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Transport Preference
                    </label>
                    <div className="relative">
                      <Plane className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={transportPreference}
                        onChange={(e) => setTransportPreference(e.target.value)}
                        placeholder="e.g. Traveling, Train, Flight, Private Cab"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] text-[#171717]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Accommodation Style
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={accommodationPreference}
                        onChange={(e) => setAccommodationPreference(e.target.value)}
                        placeholder="e.g. Boutique Hotel, Resort, Airbnb"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] text-[#171717]"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Card Before Launch */}
                <div className="p-4 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                    <span className="font-bold text-[#171717]">Trip Blueprint Summary</span>
                    <span className="font-bold text-[#F97316]">
                      {origin.trim() ? `${origin.trim()} → ${destination}` : destination}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[#525252] pt-1">
                    <p><span className="font-semibold text-[#171717]">Origin:</span> {origin.trim() || 'Current Location'}</p>
                    <p><span className="font-semibold text-[#171717]">Destination:</span> {destination}</p>
                    <p><span className="font-semibold text-[#171717]">Dates:</span> {startDate} to {endDate} ({isOneDay ? '⚡ 1-Day Outing' : `${Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)} Days`})</p>
                    <p><span className="font-semibold text-[#171717]">Party:</span> {travelerCount} Person(s) • <span className="capitalize">{travelCompanion}</span></p>
                    <p><span className="font-semibold text-[#171717]">Dietary:</span> <span className="capitalize font-semibold text-[#171717]">{dietaryPreference === 'veg' ? '🥬 Pure Vegetarian' : dietaryPreference === 'non_veg' ? '🍗 Non-Vegetarian' : '🥗 Veg & Non-Veg'}</span></p>
                    <p><span className="font-semibold text-[#171717]">Budget:</span> {formatCurrency(totalBudget, currency, true)}</p>
                    <p><span className="font-semibold text-[#171717]">Style:</span> {travelStyle}</p>
                    <p><span className="font-semibold text-[#171717]">Transit:</span> {transportPreference}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-red-500 hover:text-red-700 font-bold text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Step Navigation Buttons */}
            <div className="pt-6 border-t border-[#E5E7EB] flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#171717] font-bold text-xs hover:bg-[#F3F4F6] flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1) {
                      if (!destination.trim()) {
                        setErrorMsg('Please specify a destination to proceed.');
                        return;
                      }
                      if (!startDate || !endDate) {
                        setErrorMsg('Please select valid start and end dates.');
                        return;
                      }
                      if (endDate < startDate) {
                        setErrorMsg('End date must be on or after start date.');
                        return;
                      }
                    } else if (step === 2) {
                      if (!totalBudget || totalBudget < 500) {
                        setErrorMsg('Please enter a total planned budget of at least 500.');
                        return;
                      }
                      if (travelerCount < 1) {
                        setErrorMsg('Please select at least 1 traveler.');
                        return;
                      }
                    } else if (step === 3) {
                      if (selectedInterests.length < 2) {
                        setErrorMsg('Please select at least 2 interests to personalize your itinerary.');
                        return;
                      }
                    }
                    setErrorMsg(null);
                    setStep(step + 1);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Orchestrate Trip with AI Agent</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
