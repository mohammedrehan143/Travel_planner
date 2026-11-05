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
  AlertTriangle,
  User,
  Briefcase,
  Home,
  Leaf,
  Utensils,
  Soup,
  Landmark,
  Camera,
  ShoppingBag,
  Trees,
  Palette,
  Wine,
  X,
  Navigation
} from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { TravelStyle, TripCreateWizardInput } from '../types';
import {
  getCurrencySymbol,
  formatCurrency,
  SUPPORTED_CURRENCIES,
  detectCurrencyForDestination,
  getCountryForDestination,
  getDefaultBudgetForCurrency,
  getBudgetPresetsForCurrency,
  getMinBudgetForCurrency
} from '../lib/currency';
import { detectLocation, DEFAULT_LOCATION } from '../lib/location';
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
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the terminal stream box to latest message without scrolling the main window/page
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
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
  const initialCurrency = detectCurrencyForDestination(initialDest) || 'INR';
  const [origin, setOrigin] = useState<string>('Bangalore, Karnataka, India');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [destination, setDestination] = useState(initialDest);
  const [startDate, setStartDate] = useState('2026-11-10');
  const [endDate, setEndDate] = useState('2026-11-10');
  const [travelerCount, setTravelerCount] = useState<number>(1);
  const [travelCompanion, setTravelCompanion] = useState<string>('solo');
  const [dietaryPreference, setDietaryPreference] = useState<string>('veg');
  const [currency, setCurrency] = useState(initialCurrency);
  const [totalBudget, setTotalBudget] = useState<number>(() => getDefaultBudgetForCurrency(initialCurrency, 1));
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('balanced');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'culinary',
    'cultural',
    'sightseeing',
  ]);
  const [transportPreference, setTransportPreference] = useState('Traveling');
  const [accommodationPreference, setAccommodationPreference] = useState('None (Single Day Outing)');

  const isOneDay = startDate === endDate;
  const durationDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);

  // Auto-detect user location on mount (defaulting to Bangalore, India)
  useEffect(() => {
    let isMounted = true;
    const runAutoDetect = async () => {
      try {
        const detected = await detectLocation(false);
        if (isMounted && detected) {
          setOrigin(detected.formatted || 'Bangalore, Karnataka, India');
          if (!initialDest) {
            setCurrency(detected.currency || 'INR');
            setTotalBudget(getDefaultBudgetForCurrency(detected.currency || 'INR', 1));
          }
        }
      } catch {
        if (isMounted) {
          setOrigin('Bangalore, Karnataka, India');
        }
      }
    };
    runAutoDetect();
    return () => {
      isMounted = false;
    };
  }, [initialDest]);

  // Manual one-click Auto-Detect location handler
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await detectLocation(true);
      if (loc) {
        setOrigin(loc.formatted);
        if (!destination || destination.toLowerCase().includes('india') || destination.toLowerCase().includes('bangalore')) {
          setCurrency(loc.currency || 'INR');
          setTotalBudget(getDefaultBudgetForCurrency(loc.currency || 'INR', isOneDay ? 1 : durationDays));
        }
      }
    } catch (e) {
      console.warn('Location detection failed:', e);
      setOrigin('Bangalore, Karnataka, India');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleDestinationChange = (newDest: string) => {
    setDestination(newDest);
    const detected = detectCurrencyForDestination(newDest);
    if (detected && detected !== currency) {
      setCurrency(detected);
      setTotalBudget(getDefaultBudgetForCurrency(detected, isOneDay ? 1 : durationDays));
    }
  };

  const setDurationDays = (days: number) => {
    const [y, m, d] = startDate.split('-').map(Number);
    const end = new Date(y, m - 1, d + (days - 1));
    const formattedEnd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setEndDate(formattedEnd);
    if (days === 1) {
      setTotalBudget(getDefaultBudgetForCurrency(currency, 1));
      setAccommodationPreference('None (Single Day Outing)');
    } else {
      setTotalBudget(getDefaultBudgetForCurrency(currency, days));
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (endDate < newStart) {
      setEndDate(newStart);
    }
  };

  const COMPANIONS = [
    { id: 'solo', label: 'Solo', desc: 'Traveling alone / Solo explorer', defaultTravelers: 1, icon: User },
    { id: 'couple', label: 'Couple', desc: 'Partner / Romantic travel', defaultTravelers: 2, icon: Heart },
    { id: 'friends', label: 'Friends', desc: 'Friends group / Fun outings', defaultTravelers: 3, icon: Users },
    { id: 'family', label: 'Family', desc: 'Family with kids / Relaxed', defaultTravelers: 4, icon: Home },
    { id: 'colleagues', label: 'Colleagues', desc: 'Business trip / Co-workers', defaultTravelers: 2, icon: Briefcase }
  ];

  const DIETARY_OPTIONS = [
    { id: 'veg', label: 'Vegetarian', desc: 'Pure veg dining & local plant-based specialities', icon: Leaf },
    { id: 'non_veg', label: 'Non-Vegetarian', desc: 'Authentic regional cuisine, grills & seafood', icon: Utensils },
    { id: 'any', label: 'Both / Any', desc: 'No restrictions, explore all regional cuisine', icon: Soup }
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
    { id: 'culinary', label: 'Culinary & Dining', icon: Utensils },
    { id: 'cultural', label: 'Heritage & Temples', icon: Landmark },
    { id: 'photography', label: 'Photography Spots', icon: Camera },
    { id: 'shopping', label: 'Shopping & Boutiques', icon: ShoppingBag },
    { id: 'nature', label: 'Nature & Parks', icon: Trees },
    { id: 'art', label: 'Art & Galleries', icon: Palette },
    { id: 'nightlife', label: 'Nightlife & Lounges', icon: Wine },
    { id: 'architecture', label: 'Architecture & Design', icon: Building },
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

    const dest = destination.trim();
    setAgentLogs([
      `Initializing TripPilot AI Multi-Agent pipeline for ${dest}...`,
      `Validating origin: ${origin.trim() || 'Auto-detected current location'}...`,
    ]);
    setProgressPercent(12);

    // Schedule realistic tool-execution progression while awaiting backend AI synthesis
    const scheduleStep = (ms: number, stepName: string, percent: number, logMsg: string) => {
      const timer = window.setTimeout(() => {
        setCurrentAgentStep(stepName);
        setProgressPercent((prev) => Math.max(prev, percent));
        setAgentLogs((prev) => [...prev, logMsg]);
      }, ms);
      timersRef.current.push(timer);
    };

    scheduleStep(
      600,
      'resolve_coordinates',
      24,
      `Resolving geographic coordinates & boundary polygon for ${dest}...`
    );
    scheduleStep(
      1400,
      'search_places',
      42,
      `Searching categorized attractions: sightseeing, dining (${dietaryPreference}), cultural sites...`
    );
    scheduleStep(
      2200,
      'fetch_weather',
      58,
      `Inspecting historical meteorological models & weather forecast (${startDate} to ${endDate})...`
    );
    scheduleStep(
      3200,
      'compute_routes',
      74,
      `Calculating real-world transit matrices and route sequencing...`
    );
    scheduleStep(
      4200,
      'validate_itinerary',
      88,
      `Enforcing total budget caps (${currency} ${totalBudget}) and pacing guidelines...`
    );

    try {
      const wizardInput: TripCreateWizardInput = {
        origin: origin.trim() || 'Current Location',
        destination: dest,
        start_date: startDate,
        end_date: endDate,
        traveler_count: travelerCount,
        travel_style: travelStyle,
        dietary_preference: dietaryPreference as any,
        travel_companion: travelCompanion,
        interests: selectedInterests,
        total_budget: totalBudget,
        currency: currency,
        transport_preference: transportPreference,
        accommodation_preference: accommodationPreference,
      };

      const generatedTrip = await createTripWithWizard(wizardInput, (stepName, pct, msg) => {
        setCurrentAgentStep(stepName);
        setProgressPercent((prev) => Math.max(prev, pct));
        setAgentLogs((prev) => [...prev, msg]);
      });

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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E60FF] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#1E60FF]" />
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
                    ? 'bg-[#1E60FF] text-white shadow-sm ring-2 ring-blue-200'
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
            {/* Animated Compass with Glowing Ocean Blue Radar Rings */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-blue-500/20 animate-ping opacity-60" />
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#0052FF] to-[#1E60FF] opacity-25 blur-lg animate-pulse" />
              <div className="absolute inset-1 rounded-2xl border-2 border-dashed border-blue-400/50 animate-[spin_8s_linear_infinite]" />
              
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0052FF] to-[#1E60FF] text-white flex items-center justify-center shadow-xl shadow-blue-500/25">
                <Compass className="w-8 h-8 animate-[spin_4s_linear_infinite]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E60FF] text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E60FF]"></span>
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
                  <Loader2 className="w-3 h-3 animate-spin text-[#1E60FF]" />
                  <span>Synthesizing trip parameters...</span>
                </span>
                <span className="font-bold text-[#1E60FF]">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-[#F3F4F6] rounded-full h-3 overflow-hidden border border-[#E5E7EB] p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#1E60FF] via-[#0052FF] to-[#1E60FF] transition-all duration-500 ease-out rounded-full relative overflow-hidden shadow-sm"
                  style={{ width: `${Math.max(6, progressPercent)}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Live Terminal-style Agent Logs (Dark Section) */}
            <div
              ref={logsContainerRef}
              className="max-w-md mx-auto text-left p-4 rounded-2xl bg-[#171717] text-neutral-300 font-mono text-[11px] space-y-2 shadow-2xl max-h-56 overflow-y-auto border border-neutral-800"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5 text-[#1E60FF] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#1E60FF] animate-pulse" />
                  <span>Agent Execution Stream</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E60FF]"></span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">STREAMING</span>
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
                        <Loader2 className="w-3.5 h-3.5 mt-0.5 text-[#1E60FF] animate-spin flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-[#1E60FF] flex-shrink-0" />
                      )}
                      <span className={isLast ? 'text-white font-medium' : 'text-neutral-400'}>
                        {log}
                        {isLast && (
                          <span className="inline-block w-1.5 h-3 ml-1 bg-[#1E60FF] animate-pulse align-middle" />
                        )}
                      </span>
                    </div>
                  );
                })}
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
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                        Starting City (Origin)
                      </label>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E60FF] border border-blue-200 text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                        title="Auto-detect current location using GPS/Network"
                      >
                        <Navigation className={`w-3 h-3 text-[#1E60FF] ${isDetectingLocation ? 'animate-spin' : ''}`} />
                        <span>{isDetectingLocation ? 'Detecting...' : 'Auto-Detect Location'}</span>
                      </button>
                    </div>

                    <PlaceAutocomplete
                      value={origin}
                      onChange={setOrigin}
                      placeholder="e.g. Bangalore, Mumbai, London"
                      icon={<MapPin className="w-4 h-4 text-[#1E60FF]" />}
                    />
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-neutral-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Default Location: <strong className="text-neutral-900">{origin || 'Bangalore, Karnataka, India'}</strong></span>
                    </div>
                  </div>

                  <div>
                    <PlaceAutocomplete
                      label="Target Destination"
                      value={destination}
                      onChange={handleDestinationChange}
                      placeholder="e.g. Goa, Paris, Tokyo, Manali, Jaipur"
                      icon={<Compass className="w-4 h-4 text-[#1E60FF]" />}
                      required
                    />
                    {destination.trim() && (
                      <div className="flex items-center gap-2 mt-1.5 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-[#171717] animate-in fade-in">
                        <span className="font-bold text-[#1E60FF]">Country:</span>
                        <span className="font-semibold">{getCountryForDestination(destination) || 'Global Destination'}</span>
                        <span className="text-neutral-300">•</span>
                        <span className="text-[#525252]">Currency:</span>
                        <span className="font-bold text-[#171717] px-1.5 py-0.5 rounded-md bg-white border border-[#E5E7EB]">
                          {currency} ({getCurrencySymbol(currency)})
                        </span>
                      </div>
                    )}
                  </div>
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
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60FF] bg-white text-[#171717]"
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
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60FF] bg-white text-[#171717]"
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
                      { days: 1, label: '1-Day Outing' },
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
                              ? 'bg-[#1E60FF] text-white border-[#1E60FF] shadow-sm'
                              : 'bg-white text-[#171717] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  {isOneDay && (
                    <div className="text-[11px] text-blue-900 bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center gap-2">
                      <span className="font-bold text-[#1E60FF]">Single-Day Outing active:</span>
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
                      {COMPANIONS.map((comp) => {
                        const Icon = comp.icon;
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => {
                              setTravelCompanion(comp.id);
                              setTravelerCount(comp.defaultTravelers);
                            }}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              travelCompanion === comp.id
                                ? 'bg-blue-50 border-[#1E60FF] ring-2 ring-blue-500/20 shadow-sm'
                                : 'bg-white border-[#E5E7EB] hover:border-neutral-300'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                              travelCompanion === comp.id ? 'bg-[#1E60FF] text-white' : 'bg-blue-50 text-[#1E60FF]'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-bold text-[#171717]">{comp.label}</p>
                            <p className="text-[10px] text-[#525252] line-clamp-1">{comp.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dietary Preference */}
                  <div>
                    <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                      Food & Dietary Preference
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {DIETARY_OPTIONS.map((diet) => {
                        const Icon = diet.icon;
                        return (
                          <button
                            key={diet.id}
                            type="button"
                            onClick={() => setDietaryPreference(diet.id)}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              dietaryPreference === diet.id
                                ? 'bg-blue-50 border-[#1E60FF] ring-2 ring-blue-500/20 shadow-sm'
                                : 'bg-white border-[#E5E7EB] hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                dietaryPreference === diet.id ? 'bg-[#1E60FF] text-white' : 'bg-blue-50 text-[#1E60FF]'
                              }`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-xs font-bold text-[#171717]">{diet.label}</p>
                            </div>
                            <p className="text-[10px] text-[#525252] leading-tight">{diet.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                        Number of Travelers
                      </label>
                      <span className="text-xs font-semibold text-[#1E60FF]">
                        {travelerCount} {travelerCount === 1 ? 'Person' : 'People'} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setTravelerCount(num)}
                          className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                            travelerCount === num
                              ? 'bg-[#1E60FF] text-white border-[#1E60FF] shadow-sm'
                              : 'bg-white text-[#171717] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                          }`}
                        >
                          {num === 1 ? '1 Person' : `${num} People`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget Setup */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                        Total Target Budget
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#525252]">
                          {getCurrencySymbol(currency)}
                        </span>
                        <input
                          type="number"
                          min={getMinBudgetForCurrency(currency)}
                          step={100}
                          value={totalBudget}
                          onChange={(e) => setTotalBudget(Number(e.target.value))}
                          className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60FF] font-semibold text-[#171717]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-[#525252]">Presets:</span>
                        {getBudgetPresetsForCurrency(currency).map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setTotalBudget(amt)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3F4F6] hover:bg-neutral-200 text-[#171717] border border-[#E5E7EB] transition-colors"
                          >
                            {formatCurrency(amt, currency, false)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                          Currency
                        </label>
                        <span className="text-[10px] font-semibold text-[#1E60FF]">
                          {getCountryForDestination(destination) ? `for ${getCountryForDestination(destination)}` : 'Auto-detected'}
                        </span>
                      </div>
                      <select
                        value={currency}
                        onChange={(e) => {
                          const newCurr = e.target.value;
                          setCurrency(newCurr);
                          setTotalBudget(getDefaultBudgetForCurrency(newCurr, isOneDay ? 1 : durationDays));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60FF] bg-white font-medium text-[#171717]"
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
                            ? 'bg-blue-50 border-[#1E60FF] ring-2 ring-blue-500/20 shadow-sm'
                            : 'bg-white border-[#E5E7EB] hover:border-neutral-300'
                        }`}
                      >
                        <p className={`text-xs font-bold ${travelStyle === style.id ? 'text-[#1E60FF]' : 'text-[#171717]'}`}>
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
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleInterest(item.id)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                            isSel
                              ? 'bg-[#1E60FF] text-white border-[#1E60FF] shadow-sm'
                              : 'bg-white text-[#171717] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
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
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60FF] text-[#171717]"
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
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60FF] text-[#171717]"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Card Before Launch */}
                <div className="p-4 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                    <span className="font-bold text-[#171717]">Trip Blueprint Summary</span>
                    <span className="font-bold text-[#1E60FF]">
                      {origin.trim() ? `${origin.trim()} → ${destination}` : destination}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[#525252] pt-1">
                    <p><span className="font-semibold text-[#171717]">Origin:</span> {origin.trim() || 'Current Location'}</p>
                    <p><span className="font-semibold text-[#171717]">Destination:</span> {destination}</p>
                    <p><span className="font-semibold text-[#171717]">Dates:</span> {startDate} to {endDate} ({isOneDay ? '1-Day Outing' : `${Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)} Days`})</p>
                    <p><span className="font-semibold text-[#171717]">Party:</span> {travelerCount} {travelerCount === 1 ? 'Person' : 'People'} • <span className="capitalize">{travelCompanion}</span></p>
                    <p><span className="font-semibold text-[#171717]">Dietary:</span> <span className="capitalize font-semibold text-[#171717]">{dietaryPreference === 'veg' ? 'Pure Vegetarian' : dietaryPreference === 'non_veg' ? 'Non-Vegetarian' : 'Veg & Non-Veg'}</span></p>
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
                  <X className="w-3.5 h-3.5" />
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
                      const minBudget = getMinBudgetForCurrency(currency);
                      if (!totalBudget || totalBudget < minBudget) {
                        setErrorMsg(`Please enter a total planned budget of at least ${formatCurrency(minBudget, currency, true)}.`);
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
                  className="px-5 py-2.5 rounded-xl bg-[#1E60FF] hover:bg-[#0052FF] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-6 py-2.5 rounded-xl bg-[#1E60FF] hover:bg-[#0052FF] text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
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
