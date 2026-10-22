import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ShieldCheck
} from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { TravelStyle, TripCreateWizardInput } from '../types';
import { getCurrencySymbol, formatCurrency, SUPPORTED_CURRENCIES } from '../lib/currency';

export const TripWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTripWithWizard } = useTrips();

  const [step, setStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAgentStep, setCurrentAgentStep] = useState<string>('initialized');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);

  // Wizard state
  const [origin, setOrigin] = useState('San Francisco, CA');
  const [destination, setDestination] = useState('Kyoto & Osaka, Japan');
  const [startDate, setStartDate] = useState('2026-11-10');
  const [endDate, setEndDate] = useState('2026-11-15');
  const [travelerCount, setTravelerCount] = useState<number>(2);
  const [totalBudget, setTotalBudget] = useState<number>(3200);
  const [currency, setCurrency] = useState('USD');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('balanced');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'culinary',
    'cultural',
    'photography',
  ]);
  const [transportPreference, setTransportPreference] = useState('Bullet Train & Metro');
  const [accommodationPreference, setAccommodationPreference] = useState('Traditional Ryokan & Boutique Hotel');

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
    setIsGenerating(true);
    setProgressPercent(10);
    setAgentLogs(['Initializing TripPilot Agentic AI orchestrator...']);

    const input: TripCreateWizardInput = {
      origin,
      destination,
      start_date: startDate,
      end_date: endDate,
      traveler_count: travelerCount,
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
          setProgressPercent(percent);
          setAgentLogs((prev) => [...prev, logMsg]);
        }
      );

      // Navigate to the newly generated trip
      setTimeout(() => {
        navigate(`/trip/${generatedTrip.id}`);
      }, 600);
    } catch (err) {
      console.error('Trip generation error', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Step-by-Step AI Trip Architect</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">Plan Your Next Trip</h1>
        <p className="text-xs text-slate-500">
          Our tool-calling AI agent validates schedules, weather, transit, and budgets.
        </p>
      </div>

      {/* Step Indicators */}
      {!isGenerating && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
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
                    ? 'bg-blue-600 text-white shadow-sm'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline-block ${
                  step === s.num ? 'text-slate-900 font-bold' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Wizard Form Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
        {/* Live Agent Generation Screen */}
        {isGenerating ? (
          <div className="py-8 space-y-6 text-center">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-30" />
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Compass className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                TripPilot AI is Orchestrating Your Itinerary
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Executing real-time tool calls for places, weather forecasts, route coordinates, and budget constraints.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Live Terminal-style Agent Logs */}
            <div className="max-w-md mx-auto text-left p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[11px] space-y-1.5 shadow-inner max-h-48 overflow-y-auto">
              <div className="flex items-center gap-1.5 text-blue-400 border-b border-slate-800 pb-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Agent Execution Stream</span>
              </div>
              {agentLogs.map((log, i) => (
                <p key={i} className="leading-relaxed">
                  <span className="text-emerald-400">✓</span> {log}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* STEP 1: Destination & Dates */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-slate-900">Where and when are you traveling?</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Starting City (Origin)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Destination
                    </label>
                    <div className="relative">
                      <Compass className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. Tokyo, Japan"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Travelers & Budget */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-slate-900">Travelers & Budget Parameters</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {num} {num === 1 ? 'Solo' : `${num} People`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Total Planned Budget
                      </label>
                      <div className="relative">
                        <span className="w-5 text-center font-bold text-sm text-emerald-600 absolute left-3 top-2.5 select-none">
                          {getCurrencySymbol(currency)}
                        </span>
                        <input
                          type="number"
                          min="100"
                          step="50"
                          value={totalBudget}
                          onChange={(e) => setTotalBudget(Number(e.target.value))}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
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
                <h3 className="text-base font-bold text-slate-900">Travel Style & Interests</h3>

                {/* Travel Style Radio Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                            ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className={`text-xs font-bold ${travelStyle === style.id ? 'text-blue-900' : 'text-slate-900'}`}>
                          {style.label}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Interests Tags */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
                <h3 className="text-base font-bold text-slate-900">Transport & Lodging Preferences</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Transport Preference
                    </label>
                    <div className="relative">
                      <Plane className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={transportPreference}
                        onChange={(e) => setTransportPreference(e.target.value)}
                        placeholder="e.g. Bullet Train, Metro, Rental Car"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Accommodation Style
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={accommodationPreference}
                        onChange={(e) => setAccommodationPreference(e.target.value)}
                        placeholder="e.g. Boutique Hotel, Ryokan, Airbnb"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Card Before Launch */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700">Trip Blueprint Summary</span>
                    <span className="font-bold text-blue-600">{destination}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                    <p><span className="font-semibold text-slate-900">Dates:</span> {startDate} to {endDate}</p>
                    <p><span className="font-semibold text-slate-900">Travelers:</span> {travelerCount} Person(s)</p>
                    <p><span className="font-semibold text-slate-900">Budget:</span> {formatCurrency(totalBudget, currency, true)}</p>
                    <p><span className="font-semibold text-slate-900">Style:</span> {travelStyle}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
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
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
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
