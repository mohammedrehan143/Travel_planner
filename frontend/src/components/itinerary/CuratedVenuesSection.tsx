import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  CheckSquare,
  Square,
  Plus,
  Check,
  Star,
  MapPin,
  Clock,
  Sparkles,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  DollarSign,
  Utensils,
  Landmark,
  Trees,
  Coffee,
  ShoppingBag,
  PartyPopper
} from 'lucide-react';
import { Trip, TripDay, Activity, VenueTopic, CuratedVenueItem } from '../../types';
import { TripPilotAPI } from '../../lib/api';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { useTrips } from '../../context/TripContext';

interface CuratedVenuesSectionProps {
  trip: Trip;
  days: TripDay[];
  currentDay?: TripDay;
}

export const CuratedVenuesSection: React.FC<CuratedVenuesSectionProps> = ({
  trip,
  days,
  currentDay
}) => {
  const { addActivity, activities } = useTrips();

  const [topics, setTopics] = useState<VenueTopic[]>(trip.curated_venues_by_topic || []);
  const [loading, setLoading] = useState<boolean>(!trip.curated_venues_by_topic || trip.curated_venues_by_topic.length === 0);
  const [activeTopicId, setActiveTopicId] = useState<string>('sightseeing');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non_veg'>('all');

  // Selected venues set across all topics
  const [selectedVenueIds, setSelectedVenueIds] = useState<Set<string>>(new Set());
  const [targetDayNumber, setTargetDayNumber] = useState<number>(currentDay?.day_number || 1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch curated venues by topic if not already on the trip object
  useEffect(() => {
    let isMounted = true;
    if (!trip.curated_venues_by_topic || trip.curated_venues_by_topic.length === 0) {
      setLoading(true);
      TripPilotAPI.getCuratedVenuesByTopic(trip.destination, 14)
        .then((fetchedTopics) => {
          if (isMounted && fetchedTopics && fetchedTopics.length > 0) {
            setTopics(fetchedTopics);
            if (fetchedTopics[0]) {
              setActiveTopicId(fetchedTopics[0].topicId);
            }
          }
        })
        .catch((err) => {
          console.warn('Could not load topics dynamically:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setTopics(trip.curated_venues_by_topic);
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [trip.id, trip.destination]);

  // Set of activity location names already in the trip to flag as "already scheduled"
  const scheduledVenueNames = useMemo(() => {
    const names = new Set<string>();
    Object.values(activities || {}).forEach((dayActs) => {
      dayActs.forEach((a) => {
        if (a.title) names.add(a.title.toLowerCase().trim());
        if (a.location_name) names.add(a.location_name.toLowerCase().trim());
      });
    });
    return names;
  }, [activities]);

  const activeTopic = useMemo(() => {
    return topics.find((t) => t.topicId === activeTopicId) || topics[0];
  }, [topics, activeTopicId]);

  // Filtered venues for the current topic
  const filteredVenues = useMemo(() => {
    if (!activeTopic) return [];
    return activeTopic.venues.filter((venue) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = venue.name.toLowerCase().includes(q);
        const matchesDesc = venue.description?.toLowerCase().includes(q) || false;
        const matchesSpec = venue.speciality?.toLowerCase().includes(q) || false;
        const matchesAddr = venue.address?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesDesc && !matchesSpec && !matchesAddr) return false;
      }
      if (dietaryFilter === 'veg') {
        if (venue.dietaryTag && venue.dietaryTag !== 'veg' && venue.dietaryTag !== 'both') return false;
      } else if (dietaryFilter === 'non_veg') {
        if (venue.dietaryTag && venue.dietaryTag !== 'non_veg' && venue.dietaryTag !== 'both') return false;
      }
      return true;
    });
  }, [activeTopic, searchQuery, dietaryFilter]);

  const toggleVenueSelection = (venueId: string) => {
    setSelectedVenueIds((prev) => {
      const next = new Set(prev);
      if (next.has(venueId)) {
        next.delete(venueId);
      } else {
        next.add(venueId);
      }
      return next;
    });
  };

  const selectAllInActiveTopic = () => {
    setSelectedVenueIds((prev) => {
      const next = new Set(prev);
      filteredVenues.forEach((v) => next.add(v.id));
      return next;
    });
  };

  const deselectAllInActiveTopic = () => {
    setSelectedVenueIds((prev) => {
      const next = new Set(prev);
      filteredVenues.forEach((v) => next.delete(v.id));
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Add a single venue to a target day
  const handleAddVenueToDay = async (venue: CuratedVenueItem, dayNum: number) => {
    const targetDay = days.find((d) => d.day_number === dayNum) || days[0];
    if (!targetDay) return;

    try {
      await addActivity(targetDay.id, {
        trip_id: trip.id,
        trip_day_id: targetDay.id,
        title: venue.name,
        description: venue.description || `Visit to ${venue.name} in ${trip.destination}`,
        category: (venue.category as any) || 'sightseeing',
        start_time: '14:00',
        end_time: '16:00',
        duration_minutes: 120,
        location_name: venue.name,
        location_address: venue.address,
        latitude: venue.lat,
        longitude: venue.lng,
        estimated_cost: venue.estimatedCost || 0,
        currency: trip.currency,
        speciality: venue.speciality,
        dietary_tag: venue.dietaryTag as any,
        booking_required: false,
        booking_status: 'not_booked',
        notes: venue.speciality ? `Speciality: ${venue.speciality}` : undefined,
        order_index: (activities[targetDay.id] || []).length,
        selected: true
      });
      showToast(`Added "${venue.name}" to Day ${dayNum} schedule!`);
    } catch (err: any) {
      alert(`Could not add activity: ${err?.message || err}`);
    }
  };

  // Add all selected venues to the target day
  const handleAddAllSelectedToDay = async () => {
    const targetDay = days.find((d) => d.day_number === targetDayNumber) || days[0];
    if (!targetDay) return;

    const allVenuesList: CuratedVenueItem[] = [];
    topics.forEach((t) => {
      t.venues.forEach((v) => {
        if (selectedVenueIds.has(v.id)) {
          allVenuesList.push(v);
        }
      });
    });

    if (allVenuesList.length === 0) {
      alert('Please select at least one venue using the checkboxes.');
      return;
    }

    try {
      let count = 0;
      for (const venue of allVenuesList) {
        await addActivity(targetDay.id, {
          trip_id: trip.id,
          trip_day_id: targetDay.id,
          title: venue.name,
          description: venue.description || `Visit to ${venue.name} in ${trip.destination}`,
          category: (venue.category as any) || 'sightseeing',
          start_time: '10:00',
          end_time: '12:00',
          duration_minutes: 120,
          location_name: venue.name,
          location_address: venue.address,
          latitude: venue.lat,
          longitude: venue.lng,
          estimated_cost: venue.estimatedCost || 0,
          currency: trip.currency,
          speciality: venue.speciality,
          dietary_tag: venue.dietaryTag as any,
          booking_required: false,
          booking_status: 'not_booked',
          notes: venue.speciality ? `Speciality: ${venue.speciality}` : undefined,
          order_index: (activities[targetDay.id] || []).length + count,
          selected: true
        });
        count++;
      }
      showToast(`Successfully added ${count} venue(s) to Day ${targetDayNumber} schedule!`);
    } catch (err: any) {
      alert(`Error adding venues: ${err.message}`);
    }
  };

  const totalVenuesCount = useMemo(() => {
    return topics.reduce((sum, t) => sum + t.venues.length, 0);
  }, [topics]);

  const getTopicIcon = (topicId: string) => {
    switch (topicId) {
      case 'sightseeing':
        return <Landmark className="w-4 h-4 text-[#F97316]" />;
      case 'dining':
        return <Utensils className="w-4 h-4 text-emerald-600" />;
      case 'cultural':
        return <Compass className="w-4 h-4 text-purple-600" />;
      case 'outdoor':
        return <Trees className="w-4 h-4 text-teal-600" />;
      case 'hangouts':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 'entertainment':
        return <PartyPopper className="w-4 h-4 text-pink-600" />;
      default:
        return <Landmark className="w-4 h-4 text-[#F97316]" />;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E7EB] shadow-card space-y-4">
        <Compass className="w-8 h-8 text-[#F97316] animate-spin mx-auto" />
        <h3 className="text-base font-bold text-[#171717]">Loading Curated Venue Catalog</h3>
        <p className="text-xs text-[#525252] max-w-md mx-auto">
          TripPilot AI is curating more than 10 verified venues across each sub-topic for {trip.destination}...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#171717] text-white text-xs font-bold shadow-2xl border border-neutral-800 flex items-center gap-2.5 animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-50 via-white to-amber-50 border border-orange-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Select & Customize Output Plan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#171717]">
            Curated Venues for {trip.destination}
          </h2>
          <p className="text-xs text-[#525252] max-w-2xl leading-relaxed">
            Browse <strong>more than 10 venues for each sub-topic</strong> below. Check the venues you want, then click "Add to Day" to dynamically inject them into your daily schedule!
          </p>
        </div>

        {/* Global Selection Summary Counter */}
        <div className="flex items-center gap-3 shrink-0 p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#171717] text-[#F97316] flex items-center justify-center font-black text-sm">
            {selectedVenueIds.size}
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#171717] block">Selected Venues</span>
            <span className="text-[11px] text-[#525252]">across {topics.length} topics</span>
          </div>
        </div>
      </div>

      {/* Sub-Topic Navigation Tabs (Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {topics.map((topic) => {
          const isSelected = activeTopicId === topic.topicId;
          const selectedInTopicCount = topic.venues.filter((v) => selectedVenueIds.has(v.id)).length;
          return (
            <button
              key={topic.topicId}
              onClick={() => {
                setActiveTopicId(topic.topicId);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? 'bg-[#171717] text-white border-[#171717] shadow-md ring-2 ring-neutral-300'
                  : 'bg-white text-[#171717] border-[#E5E7EB] hover:bg-[#F3F4F6]'
              }`}
            >
              <span>{topic.icon}</span>
              <span>{topic.title.split('&')[0].trim()}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-[#F97316] text-white' : 'bg-[#F3F4F6] text-[#525252]'
                }`}
              >
                {topic.venues.length}
              </span>
              {selectedInTopicCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Topic Description & Search / Filter Bar */}
      {activeTopic && (
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeTopic.icon}</span>
                <h3 className="text-lg font-black text-[#171717]">{activeTopic.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-[#F97316]">
                  {activeTopic.venues.length} Venues (10+ Guaranteed)
                </span>
              </div>
              <p className="text-xs text-[#525252]">{activeTopic.description}</p>
            </div>

            {/* Selection actions for this topic */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={selectAllInActiveTopic}
                className="px-3 py-1.5 rounded-xl bg-[#F3F4F6] hover:bg-neutral-200 text-[#171717] text-xs font-bold transition-colors"
              >
                Select All ({filteredVenues.length})
              </button>
              <button
                type="button"
                onClick={deselectAllInActiveTopic}
                className="px-3 py-1.5 rounded-xl bg-[#F3F4F6] hover:bg-neutral-200 text-[#525252] text-xs font-bold transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Search & Dietary Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[#525252] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search venues in ${activeTopic.title.split('&')[0]}...`}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {activeTopicId === 'dining' && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#525252] font-semibold">Dietary:</span>
                {(['all', 'veg', 'non_veg'] as const).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setDietaryFilter(tag)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                      dietaryFilter === tag
                        ? 'bg-[#171717] text-white shadow-sm'
                        : 'bg-[#F3F4F6] text-[#525252] hover:bg-neutral-200'
                    }`}
                  >
                    {tag === 'all' ? 'All' : tag === 'veg' ? 'Pure Veg' : 'Non-Veg'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Venues Grid (10+ venues per topic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVenues.map((venue) => {
          const isSelected = selectedVenueIds.has(venue.id);
          const isAlreadyScheduled = scheduledVenueNames.has(venue.name.toLowerCase().trim());

          return (
            <div
              key={venue.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between gap-3.5 transition-all shadow-card ${
                isSelected
                  ? 'bg-orange-50/50 border-[#F97316] ring-2 ring-orange-200'
                  : 'bg-white border-[#E5E7EB] hover:border-neutral-300'
              }`}
            >
              <div className="space-y-2.5">
                {/* Top Row: Selection Checkbox & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleVenueSelection(venue.id)}
                    className="flex items-center gap-2 text-left group"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#F97316] border-[#F97316] text-white'
                          : 'border-[#E5E7EB] bg-white group-hover:border-neutral-400'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                    </div>
                    <span className="text-[11px] font-bold text-[#525252] group-hover:text-[#171717]">
                      {isSelected ? 'Selected' : 'Select'}
                    </span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isAlreadyScheduled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                        In Itinerary
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

                {/* Venue Name & Description */}
                <div>
                  <h4 className="text-sm font-black text-[#171717] line-clamp-1 leading-snug">
                    {venue.name}
                  </h4>
                  <p className="text-xs text-[#525252] line-clamp-2 mt-1 leading-relaxed">
                    {venue.description}
                  </p>
                </div>

                {/* Speciality Highlight Pill */}
                {venue.speciality && (
                  <div className="p-2 rounded-xl bg-[#F3F4F6] text-[11px] text-[#171717] font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                    <span className="line-clamp-1">
                      <strong>Speciality:</strong> {venue.speciality}
                    </span>
                  </div>
                )}

                {/* Metadata: Address & Cost */}
                <div className="space-y-1 text-[11px] text-[#525252]">
                  {venue.address && (
                    <div className="flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate">{venue.address}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E5E7EB]">
                    <span className="font-semibold text-[#171717]">
                      {venue.estimatedCost && venue.estimatedCost > 0
                        ? `Est. Cost: ${formatCurrency(venue.estimatedCost, trip.currency, true)}`
                        : 'Free Admission / Public'}
                    </span>
                    {venue.openingHours && (
                      <span className="text-[10px] text-[#525252] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {venue.openingHours.openTime} - {venue.openingHours.closeTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Quick Add to Day Schedule */}
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#525252]">Schedule to:</span>

                <div className="flex items-center gap-1">
                  {days.slice(0, 5).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleAddVenueToDay(venue, d.day_number)}
                      title={`Add ${venue.name} to Day ${d.day_number}`}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-[#F97316] hover:text-white border border-[#E5E7EB] text-[#171717] font-bold text-[10px] transition-colors"
                    >
                      D{d.day_number}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVenues.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E7EB] space-y-2">
          <Search className="w-6 h-6 text-neutral-400 mx-auto" />
          <p className="text-xs font-bold text-[#171717]">No venues found matching your filter</p>
          <p className="text-[11px] text-[#525252]">Try clearing the search query or changing dietary filters.</p>
        </div>
      )}

      {/* Floating Bottom Toolbar when venues are selected */}
      {selectedVenueIds.size > 0 && (
        <div className="sticky bottom-6 z-40 p-4 rounded-3xl bg-[#171717] text-white border border-neutral-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F97316] text-white flex items-center justify-center font-bold text-xs">
              {selectedVenueIds.size}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedVenueIds.size} venue(s) selected across topics
              </p>
              <p className="text-[10px] text-neutral-300">
                Ready to inject into your itinerary schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700 text-xs">
              <span className="text-neutral-300 text-[11px]">Target Day:</span>
              <select
                value={targetDayNumber}
                onChange={(e) => setTargetDayNumber(Number(e.target.value))}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.day_number} className="bg-[#171717] text-white">
                    Day {d.day_number} ({d.date})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddAllSelectedToDay}
              className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Selected to Day {targetDayNumber}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
