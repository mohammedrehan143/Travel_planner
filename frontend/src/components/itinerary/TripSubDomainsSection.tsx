import React, { useState, useEffect, useMemo } from 'react';
import {
  Hotel,
  Utensils,
  Compass,
  Check,
  CheckSquare,
  Square,
  DollarSign,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  MapPin,
  Star,
  Clock,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  ChevronDown,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Trip, TripDay, Activity, CuratedVenueItem, SubDomainHotelOption } from '../../types';
import { TripPilotAPI } from '../../lib/api';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { useTrips } from '../../context/TripContext';

interface TripSubDomainsSectionProps {
  trip: Trip;
  days: TripDay[];
  currentDay?: TripDay;
}

export const TripSubDomainsSection: React.FC<TripSubDomainsSectionProps> = ({
  trip,
  days,
  currentDay
}) => {
  const { addActivity, activities } = useTrips();

  // Sub-domain tab: 'all' | 'hotels' | 'restaurants' | 'sightseeing'
  const [activeSubDomain, setActiveSubDomain] = useState<'all' | 'hotels' | 'restaurants' | 'sightseeing'>('all');

  // Data states
  const [hotels, setHotels] = useState<SubDomainHotelOption[]>([]);
  const [restaurants, setRestaurants] = useState<CuratedVenueItem[]>([]);
  const [sightseeing, setSightseeing] = useState<CuratedVenueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selections
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState<Set<string>>(new Set());
  const [selectedSightseeingIds, setSelectedSightseeingIds] = useState<Set<string>>(new Set());

  // Filter toggles
  const [onlyInBudget, setOnlyInBudget] = useState<boolean>(false);
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non_veg'>('all');
  const [targetDayNumber, setTargetDayNumber] = useState<number>(currentDay?.day_number || 1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const durationNights = Math.max(1, trip.duration_days || days.length || 1);
  const travelerCount = Math.max(1, trip.traveler_count || 1);
  const totalBudget = trip.total_budget || 2000;
  const currency = trip.currency || 'USD';

  // Fetch data across the 3 sub-domains
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      TripPilotAPI.getAccommodations({
        destination: trip.destination,
        nights: durationNights,
        travelStyle: trip.travel_style,
        currency: trip.currency,
        budget: totalBudget * 0.45 // standard ~40-45% accommodation budget guideline
      }),
      TripPilotAPI.searchPlacesByCategory({
        destination: trip.destination,
        category: 'restaurants',
        limit: 14
      }),
      TripPilotAPI.searchPlacesByCategory({
        destination: trip.destination,
        category: 'tourist_attractions',
        limit: 14
      })
    ])
      .then(([accommodationsData, restaurantsData, sightseeingData]) => {
        if (!isMounted) return;

        setHotels(accommodationsData || []);
        setRestaurants(restaurantsData.places || []);
        setSightseeing(sightseeingData.places || []);

        // Default initial selections (top rated budget-friendly hotel and 2 spots)
        if (accommodationsData && accommodationsData.length > 0) {
          // Find first hotel that fits reasonably in 40% budget
          const budgetFitHotel = accommodationsData.find((h) => h.totalPrice <= totalBudget * 0.5) || accommodationsData[0];
          setSelectedHotelId(budgetFitHotel.id);
        }
        if (restaurantsData.places && restaurantsData.places.length > 0) {
          setSelectedRestaurantIds(new Set(restaurantsData.places.slice(0, 2).map((r) => r.id)));
        }
        if (sightseeingData.places && sightseeingData.places.length > 0) {
          setSelectedSightseeingIds(new Set(sightseeingData.places.slice(0, 3).map((s) => s.id)));
        }
      })
      .catch((err) => {
        console.warn('Error loading sub-domains data:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [trip.destination, durationNights, currency, totalBudget]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // -------------------------------------------------------------
  // Budget Calculations
  // -------------------------------------------------------------
  const selectedHotel = useMemo(() => {
    return hotels.find((h) => h.id === selectedHotelId) || null;
  }, [hotels, selectedHotelId]);

  const hotelTotalCost = selectedHotel ? selectedHotel.totalPrice : 0;

  const restaurantsTotalCost = useMemo(() => {
    return restaurants
      .filter((r) => selectedRestaurantIds.has(r.id))
      .reduce((sum, r) => sum + (r.estimatedCost || 25) * travelerCount, 0);
  }, [restaurants, selectedRestaurantIds, travelerCount]);

  const sightseeingTotalCost = useMemo(() => {
    return sightseeing
      .filter((s) => selectedSightseeingIds.has(s.id))
      .reduce((sum, s) => sum + (s.estimatedCost || 0) * travelerCount, 0);
  }, [sightseeing, selectedSightseeingIds, travelerCount]);

  const totalSelectedCost = hotelTotalCost + restaurantsTotalCost + sightseeingTotalCost;
  const remainingBudget = totalBudget - totalSelectedCost;
  const isOverBudget = remainingBudget < 0;
  const budgetUtilizationPct = Math.min(100, Math.round((totalSelectedCost / totalBudget) * 100));

  // -------------------------------------------------------------
  // Filtered Items (Accounting for "in budget" checkbox)
  // -------------------------------------------------------------
  const filteredHotels = useMemo(() => {
    if (!onlyInBudget) return hotels;
    return hotels.filter((h) => h.totalPrice <= totalBudget * 0.6);
  }, [hotels, onlyInBudget, totalBudget]);

  const filteredRestaurants = useMemo(() => {
    let list = restaurants;
    if (dietaryFilter === 'veg') {
      list = list.filter((r) => r.dietaryTag === 'veg' || r.dietaryTag === 'both');
    } else if (dietaryFilter === 'non_veg') {
      list = list.filter((r) => r.dietaryTag === 'non_veg' || r.dietaryTag === 'both');
    }
    if (onlyInBudget) {
      list = list.filter((r) => (r.estimatedCost || 25) * travelerCount <= Math.max(100, totalBudget * 0.15));
    }
    return list;
  }, [restaurants, dietaryFilter, onlyInBudget, totalBudget, travelerCount]);

  const filteredSightseeing = useMemo(() => {
    if (!onlyInBudget) return sightseeing;
    return sightseeing.filter((s) => (s.estimatedCost || 0) * travelerCount <= Math.max(80, totalBudget * 0.1));
  }, [sightseeing, onlyInBudget, totalBudget, travelerCount]);

  // -------------------------------------------------------------
  // Interactive Toggles
  // -------------------------------------------------------------
  const toggleHotelSelection = (hotelId: string) => {
    setSelectedHotelId((prev) => (prev === hotelId ? null : hotelId));
  };

  const toggleRestaurantSelection = (id: string) => {
    setSelectedRestaurantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSightseeingSelection = (id: string) => {
    setSelectedSightseeingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-Select optimal bundle within budget
  const handleAutoSelectBudget = () => {
    // 1. Pick highest-rated hotel that costs <= 45% of budget
    const targetHotelMax = totalBudget * 0.45;
    const affordableHotel = hotels
      .filter((h) => h.totalPrice <= targetHotelMax)
      .sort((a, b) => b.rating - a.rating)[0] || hotels[0];

    if (affordableHotel) {
      setSelectedHotelId(affordableHotel.id);
    }

    // 2. Pick top 2-3 restaurants
    const chosenRest = new Set<string>();
    let restSpent = 0;
    const restMax = totalBudget * 0.25;
    for (const r of restaurants) {
      const cost = (r.estimatedCost || 25) * travelerCount;
      if (restSpent + cost <= restMax && chosenRest.size < 4) {
        chosenRest.add(r.id);
        restSpent += cost;
      }
    }
    setSelectedRestaurantIds(chosenRest);

    // 3. Pick top sightseeing spots
    const chosenSight = new Set<string>();
    let sightSpent = 0;
    const sightMax = totalBudget * 0.15;
    for (const s of sightseeing) {
      const cost = (s.estimatedCost || 0) * travelerCount;
      if (sightSpent + cost <= sightMax && chosenSight.size < 5) {
        chosenSight.add(s.id);
        sightSpent += cost;
      }
    }
    setSelectedSightseeingIds(chosenSight);

    showToast('Auto-selected top-rated hotel, dining and sights optimized to fit your budget!');
  };

  const handleClearAll = () => {
    setSelectedHotelId(null);
    setSelectedRestaurantIds(new Set());
    setSelectedSightseeingIds(new Set());
    showToast('Cleared all selections.');
  };

  // Inject selected restaurants & sights into chosen trip day
  const handleInjectToSchedule = async () => {
    const targetDay = days.find((d) => d.day_number === targetDayNumber) || days[0];
    if (!targetDay) {
      alert('Please create or select an itinerary day first.');
      return;
    }

    const selectedRestItems = restaurants.filter((r) => selectedRestaurantIds.has(r.id));
    const selectedSightItems = sightseeing.filter((s) => selectedSightseeingIds.has(s.id));
    const itemsToInject = [...selectedSightItems, ...selectedRestItems];

    if (itemsToInject.length === 0 && !selectedHotel) {
      alert('No items selected. Please check at least one hotel, restaurant, or sightseeing spot.');
      return;
    }

    try {
      let count = 0;
      for (const item of itemsToInject) {
        const isDining = item.category === 'restaurants' || item.category === 'dining';
        const startHour = 10 + (count * 2);

        await addActivity(targetDay.id, {
          trip_id: trip.id,
          trip_day_id: targetDay.id,
          title: item.name,
          category: isDining ? 'dining' : 'sightseeing',
          start_time: `${startHour.toString().padStart(2, '0')}:00`,
          end_time: `${(startHour + 2).toString().padStart(2, '0')}:00`,
          duration_minutes: 120,
          location_name: item.name,
          location_address: item.address,
          latitude: item.lat,
          longitude: item.lng,
          estimated_cost: (item.estimatedCost || 15) * travelerCount,
          currency: trip.currency,
          speciality: item.speciality,
          dietary_tag: item.dietaryTag === 'non_veg' ? 'non_veg' : item.dietaryTag === 'veg' ? 'veg' : 'none',
          booking_required: false,
          booking_status: 'not_booked',
          google_maps_url: item.googleMapsUrl,
          description: item.description,
          order_index: (activities[targetDay.id] || []).length + count,
          selected: true
        });
        count++;
      }

      showToast(`Added ${count} in-budget places to Day ${targetDayNumber} schedule!`);
    } catch (err: any) {
      alert(`Error scheduling places: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E7EB] shadow-card space-y-4">
        <Compass className="w-8 h-8 text-[#F97316] animate-spin mx-auto" />
        <h3 className="text-base font-bold text-[#171717]">Loading Trip Sub-Domains</h3>
        <p className="text-xs text-[#525252] max-w-md mx-auto">
          Gathering hotels, restaurants, and sightseeing places within your budget for {trip.destination}...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#171717] text-white text-xs font-bold shadow-2xl border border-neutral-800 flex items-center gap-2.5 animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header & Live Budget Health Dock */}
      <div className="rounded-3xl bg-gradient-to-r from-orange-50 via-white to-amber-50 border border-orange-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] text-xs font-bold">
              <Layers className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Trip Sub-Domains & Budget Selection</span>
            </div>
            <h2 className="text-2xl font-black text-[#171717]">
              Plan & Select in Budget for {trip.destination}
            </h2>
            <p className="text-xs text-[#525252] max-w-2xl leading-relaxed">
              Browse the 3 core sub-domains below: <strong>Hotels</strong>, <strong>Restaurants</strong>, and <strong>Sightseeing</strong>. Check the options you prefer, and the real-time budget meter ensures everything stays strictly within your budget!
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAutoSelectBudget}
              className="px-4 py-2.5 rounded-xl bg-[#171717] hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              title="Auto-select options that maximize value while fitting in your budget"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Auto-Select in Budget</span>
            </button>

            <button
              onClick={handleClearAll}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#525252] text-xs font-bold transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Live Budget Meter Card */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#F97316] flex items-center justify-center font-black">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[#525252] block font-medium">Total Trip Budget</span>
                <span className="text-lg font-black text-[#171717]">
                  {formatCurrency(totalBudget, currency, true)}
                </span>
              </div>
            </div>

            {/* Selected Cost Breakdown Pillars */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F4F6]">
                <Hotel className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[#525252]">Hotels:</span>
                <span className="text-[#171717] font-bold">{formatCurrency(hotelTotalCost, currency, true)}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F4F6]">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[#525252]">Dining:</span>
                <span className="text-[#171717] font-bold">{formatCurrency(restaurantsTotalCost, currency, true)}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F4F6]">
                <Compass className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-[#525252]">Sights:</span>
                <span className="text-[#171717] font-bold">{formatCurrency(sightseeingTotalCost, currency, true)}</span>
              </div>

              <div className="border-l border-[#E5E7EB] pl-3">
                <span className="text-[#525252] block text-[10px]">Total Selected</span>
                <span className={`text-sm font-black ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(totalSelectedCost, currency, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                {isOverBudget ? (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    Over Budget by {formatCurrency(Math.abs(remainingBudget), currency, true)}!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Within Budget — {formatCurrency(remainingBudget, currency, true)} surplus remaining
                  </span>
                )}
              </span>
              <span className="text-[#525252] text-[11px] font-semibold">
                {budgetUtilizationPct}% utilized
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#E5E7EB] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isOverBudget
                    ? 'bg-red-500'
                    : budgetUtilizationPct > 85
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
              />
            </div>
          </div>

          {/* Quick Filters Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E7EB] text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-[#171717]">
              <input
                type="checkbox"
                checked={onlyInBudget}
                onChange={(e) => setOnlyInBudget(e.target.checked)}
                className="w-4 h-4 rounded text-[#F97316] accent-[#F97316] cursor-pointer"
              />
              <span>Filter: Only show places fitting comfortably in budget</span>
            </label>

            {/* Inject to Day Schedule Toolbar */}
            <div className="flex items-center gap-2">
              <span className="text-[#525252] font-semibold">Inject to:</span>
              <select
                value={targetDayNumber}
                onChange={(e) => setTargetDayNumber(Number(e.target.value))}
                className="px-2.5 py-1 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.day_number}>
                    Day {d.day_number}
                  </option>
                ))}
              </select>

              <button
                onClick={handleInjectToSchedule}
                className="px-3.5 py-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Selected to Day {targetDayNumber}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Domains Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
        <button
          onClick={() => setActiveSubDomain('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeSubDomain === 'all'
              ? 'bg-[#171717] text-white shadow-sm'
              : 'bg-white text-[#525252] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Sub-Domains</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-200 text-[#171717] font-black">
            {filteredHotels.length + filteredRestaurants.length + filteredSightseeing.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubDomain('hotels')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeSubDomain === 'hotels'
              ? 'bg-[#171717] text-white shadow-sm'
              : 'bg-white text-[#525252] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
          }`}
        >
          <Hotel className="w-4 h-4 text-blue-500" />
          <span>Hotels & Stays</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-900 font-black">
            {filteredHotels.length}
          </span>
          {selectedHotel && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
        </button>

        <button
          onClick={() => setActiveSubDomain('restaurants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeSubDomain === 'restaurants'
              ? 'bg-[#171717] text-white shadow-sm'
              : 'bg-white text-[#525252] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
          }`}
        >
          <Utensils className="w-4 h-4 text-emerald-500" />
          <span>Restaurants & Dining</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-black">
            {filteredRestaurants.length}
          </span>
          {selectedRestaurantIds.size > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-black">
              {selectedRestaurantIds.size}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubDomain('sightseeing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeSubDomain === 'sightseeing'
              ? 'bg-[#171717] text-white shadow-sm'
              : 'bg-white text-[#525252] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
          }`}
        >
          <Compass className="w-4 h-4 text-purple-500" />
          <span>Sightseeing & Attractions</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-900 font-black">
            {filteredSightseeing.length}
          </span>
          {selectedSightseeingIds.size > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-600 text-white font-black">
              {selectedSightseeingIds.size}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-DOMAIN 1: HOTELS & STAYS */}
      {/* ========================================================= */}
      {(activeSubDomain === 'all' || activeSubDomain === 'hotels') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-l-4 border-blue-500 pl-3">
            <div>
              <div className="flex items-center gap-2">
                <Hotel className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-[#171717]">Hotels & Accommodations in Budget</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                  {filteredHotels.length} available
                </span>
              </div>
              <p className="text-xs text-[#525252] mt-0.5">
                Select your preferred hotel for {durationNights} night(s). Nightly rates and total stay prices are computed in {currency}.
              </p>
            </div>

            {selectedHotel && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Selected: {selectedHotel.name} ({formatCurrency(selectedHotel.totalPrice, currency, true)})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHotels.map((hotel) => {
              const isSelected = selectedHotelId === hotel.id;
              const fitsInRemaining = hotel.totalPrice <= (remainingBudget + (selectedHotel?.totalPrice || 0));

              return (
                <div
                  key={hotel.id}
                  onClick={() => toggleHotelSelection(hotel.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/30 shadow-md ring-2 ring-blue-300'
                      : 'border-[#E5E7EB] bg-white hover:border-neutral-300 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Checkbox, Type Badge & Rating */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-[#E5E7EB] bg-white'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F3F4F6] text-[#525252]">
                          {hotel.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          {hotel.rating}
                        </span>
                      </div>
                    </div>

                    {/* Hotel Name with Google Maps link */}
                    <div>
                      <a
                        href={hotel.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View hotel on Google Maps"
                        className="text-sm font-black text-[#171717] hover:text-blue-600 transition-colors inline-flex items-center gap-1 leading-snug group/link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="hover:underline">{hotel.name}</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400 group-hover/link:text-blue-600 shrink-0" />
                      </a>
                      <p className="text-xs text-[#525252] line-clamp-2 mt-1 leading-relaxed">
                        {hotel.description}
                      </p>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1 text-[11px] text-[#525252]">
                      <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate">{hotel.address}</span>
                    </div>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hotel.amenities.slice(0, 3).map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[10px] font-medium text-[#525252]">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & Budget Fit Tag */}
                  <div className="pt-3 mt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-[#171717] block">
                        {formatCurrency(hotel.nightlyRate, currency, true)}
                        <span className="text-[10px] font-normal text-[#525252]"> / night</span>
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700">
                        {formatCurrency(hotel.totalPrice, currency, true)} ({durationNights} nights)
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        fitsInRemaining
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {fitsInRemaining ? '✓ Fits in Budget' : 'Exceeds Budget'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* SUB-DOMAIN 2: RESTAURANTS & DINING */}
      {/* ========================================================= */}
      {(activeSubDomain === 'all' || activeSubDomain === 'restaurants') && (
        <section className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-l-4 border-emerald-500 pl-3">
            <div>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-[#171717]">Restaurants & Dining in Budget</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  {filteredRestaurants.length} places
                </span>
              </div>
              <p className="text-xs text-[#525252] mt-0.5">
                Check the dining spots you love. Costs are scaled for {travelerCount} traveler(s).
              </p>
            </div>

            {/* Dietary Filter Pills */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
              <button
                onClick={() => setDietaryFilter('all')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  dietaryFilter === 'all'
                    ? 'bg-[#171717] text-white'
                    : 'bg-white text-[#525252] border border-[#E5E7EB]'
                }`}
              >
                All Food
              </button>
              <button
                onClick={() => setDietaryFilter('veg')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  dietaryFilter === 'veg'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-[#525252] border border-[#E5E7EB]'
                }`}
              >
                🥬 Pure Veg
              </button>
              <button
                onClick={() => setDietaryFilter('non_veg')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  dietaryFilter === 'non_veg'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-[#525252] border border-[#E5E7EB]'
                }`}
              >
                🍗 Non-Veg
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map((venue) => {
              const isSelected = selectedRestaurantIds.has(venue.id);
              const mealCost = (venue.estimatedCost || 20) * travelerCount;

              return (
                <div
                  key={venue.id}
                  onClick={() => toggleRestaurantSelection(venue.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/30 shadow-md ring-2 ring-emerald-300'
                      : 'border-[#E5E7EB] bg-white hover:border-neutral-300 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Checkbox, Dietary & Rating */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-[#E5E7EB] bg-white'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        </div>
                        <span className="text-xs font-bold text-[#171717]">
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {venue.dietaryTag && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3F4F6] text-[#171717]">
                            {venue.dietaryTag === 'veg' ? '🥬 Veg' : venue.dietaryTag === 'non_veg' ? '🍗 Non-Veg' : '🥗 Both'}
                          </span>
                        )}
                        {venue.rating && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            {venue.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Venue Name with Google Maps link */}
                    <div>
                      <a
                        href={venue.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View restaurant on Google Maps"
                        className="text-sm font-black text-[#171717] hover:text-emerald-600 transition-colors inline-flex items-center gap-1 leading-snug group/link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="hover:underline">{venue.name}</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400 group-hover/link:text-emerald-600 shrink-0" />
                      </a>
                      <p className="text-xs text-[#525252] line-clamp-2 mt-1 leading-relaxed">
                        {venue.description}
                      </p>
                    </div>

                    {/* Speciality Badge */}
                    {venue.speciality && (
                      <div className="p-2 rounded-xl bg-orange-50 border border-orange-200/80 text-[11px] font-medium text-orange-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                        <span className="truncate"><strong>Speciality:</strong> {venue.speciality}</span>
                      </div>
                    )}

                    {/* Address */}
                    {venue.address && (
                      <div className="flex items-center gap-1 text-[11px] text-[#525252]">
                        <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate">{venue.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing footer */}
                  <div className="pt-3 mt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#171717] block">
                        Est. {formatCurrency(mealCost, currency, true)}
                      </span>
                      <span className="text-[10px] text-[#525252]">for {travelerCount} person(s)</span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ✓ Fits in Budget
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* SUB-DOMAIN 3: SIGHTSEEING & ATTRACTIONS */}
      {/* ========================================================= */}
      {(activeSubDomain === 'all' || activeSubDomain === 'sightseeing') && (
        <section className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-l-4 border-purple-500 pl-3">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-black text-[#171717]">Sightseeing & Attractions in Budget</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200">
                  {filteredSightseeing.length} landmarks
                </span>
              </div>
              <p className="text-xs text-[#525252] mt-0.5">
                Select must-see monuments, lookouts, and cultural landmarks. Most public sights are completely free!
              </p>
            </div>

            <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {selectedSightseeingIds.size} sight(s) selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSightseeing.map((venue) => {
              const isSelected = selectedSightseeingIds.has(venue.id);
              const admissionCost = (venue.estimatedCost || 0) * travelerCount;

              return (
                <div
                  key={venue.id}
                  onClick={() => toggleSightseeingSelection(venue.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/30 shadow-md ring-2 ring-purple-300'
                      : 'border-[#E5E7EB] bg-white hover:border-neutral-300 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Checkbox & Rating */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-[#E5E7EB] bg-white'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        </div>
                        <span className="text-xs font-bold text-[#171717]">
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>

                      {venue.rating && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          {venue.rating}
                        </span>
                      )}
                    </div>

                    {/* Venue Name with Google Maps link */}
                    <div>
                      <a
                        href={venue.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View landmark on Google Maps"
                        className="text-sm font-black text-[#171717] hover:text-purple-600 transition-colors inline-flex items-center gap-1 leading-snug group/link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="hover:underline">{venue.name}</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400 group-hover/link:text-purple-600 shrink-0" />
                      </a>
                      <p className="text-xs text-[#525252] line-clamp-2 mt-1 leading-relaxed">
                        {venue.description}
                      </p>
                    </div>

                    {/* Speciality Badge */}
                    {venue.speciality && (
                      <div className="p-2 rounded-xl bg-purple-50 border border-purple-200/80 text-[11px] font-medium text-purple-950 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="truncate"><strong>Feature:</strong> {venue.speciality}</span>
                      </div>
                    )}

                    {/* Address & Hours */}
                    <div className="space-y-1 text-[11px] text-[#525252]">
                      {venue.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{venue.address}</span>
                        </div>
                      )}
                      {venue.openingHours && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{venue.openingHours.openTime} - {venue.openingHours.closeTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing footer */}
                  <div className="pt-3 mt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#171717]">
                      {admissionCost === 0 ? 'Free Entry' : `Est. ${formatCurrency(admissionCost, currency, true)}`}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ✓ In Budget
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Sticky Bottom Summary Bar */}
      <div className="sticky bottom-4 z-40 p-4 rounded-2xl bg-[#171717] text-white shadow-2xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-black text-sm">
            {(selectedHotel ? 1 : 0) + selectedRestaurantIds.size + selectedSightseeingIds.size}
          </div>
          <div className="text-xs">
            <span className="font-bold block text-white">
              Selected in Budget ({selectedHotel ? '1 Hotel' : '0 Hotels'}, {selectedRestaurantIds.size} Dining, {selectedSightseeingIds.size} Sights)
            </span>
            <span className={`text-[11px] font-semibold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
              Total: {formatCurrency(totalSelectedCost, currency, true)} of {formatCurrency(totalBudget, currency, true)} ({isOverBudget ? 'Budget Exceeded' : 'Fits in Budget'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInjectToSchedule}
            className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-102 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Day {targetDayNumber} Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};
