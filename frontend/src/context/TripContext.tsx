import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Trip,
  TripDay,
  Activity,
  Accommodation,
  TripExpense,
  TripCollaborator,
  SavedPlace,
  ChecklistItem,
  TripCreateWizardInput
} from '../types';
import { LocalStore } from '../lib/storage';
import { TripPilotAPI, isValidUUID, generateSafeUUID } from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { detectCurrencyForDestination } from '../lib/currency';

interface TripContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  activeTripDays: TripDay[];
  activeTripActivities: Record<string, Activity[]>;
  tripDays: Record<string, TripDay[]>;
  activities: Record<string, Activity[]>;
  activeAccommodations: Accommodation[];
  activeExpenses: TripExpense[];
  activeCollaborators: TripCollaborator[];
  savedPlaces: SavedPlace[];
  activeChecklist: ChecklistItem[];
  loading: boolean;
  isCloudSynced: boolean;
  setActiveTripId: (tripId: string) => void;
  createTripWithWizard: (
    input: TripCreateWizardInput,
    onProgress?: (step: string, percent: number, logMsg: string) => void
  ) => Promise<Trip>;
  syncCurrentTripsToSupabase: () => Promise<{ success: boolean; count: number; error?: string }>;
  refreshData: () => Promise<void>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  addActivity: (dayId: string, activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addHangoutPlan: (trip: Trip, day: TripDay, activities: Activity[]) => void;
  addPlannedTrip: (plan: { trip: Trip; days: TripDay[]; activities: Record<string, Activity[]> }) => Trip;
  updateActivity: (dayId: string, activityId: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (dayId: string, activityId: string) => Promise<void>;
  reorderActivities: (dayId: string, orderedActivities: Activity[]) => Promise<void>;
  regenerateDay: (dayId: string, prompt?: string, dayNumber?: number) => Promise<void>;
  addExpense: (expense: Omit<TripExpense, 'id' | 'created_at'>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addCollaborator: (email: string, role: 'viewer' | 'editor') => Promise<void>;
  toggleChecklistItem: (itemId: string) => void;
  addChecklistItem: (text: string, category: ChecklistItem['category']) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

const VALID_DB_CATEGORIES = new Set([
  'sightseeing',
  'dining',
  'cultural',
  'outdoor',
  'transit',
  'shopping',
  'entertainment',
  'relaxation',
]);

export function normalizeActivityCategory(cat?: string): string {
  if (!cat) return 'sightseeing';
  const c = cat.toLowerCase().trim();
  if (VALID_DB_CATEGORIES.has(c)) return c;
  if (
    c.includes('food') ||
    c.includes('eat') ||
    c.includes('dining') ||
    c.includes('culinary') ||
    c.includes('cafe') ||
    c.includes('meal') ||
    c.includes('breakfast') ||
    c.includes('lunch') ||
    c.includes('dinner')
  ) {
    return 'dining';
  }
  if (
    c.includes('nature') ||
    c.includes('park') ||
    c.includes('hike') ||
    c.includes('outdoor') ||
    c.includes('beach') ||
    c.includes('adventure')
  ) {
    return 'outdoor';
  }
  if (
    c.includes('art') ||
    c.includes('museum') ||
    c.includes('temple') ||
    c.includes('shrine') ||
    c.includes('monument') ||
    c.includes('history') ||
    c.includes('historic') ||
    c.includes('heritage')
  ) {
    return 'cultural';
  }
  if (
    c.includes('night') ||
    c.includes('bar') ||
    c.includes('pub') ||
    c.includes('club') ||
    c.includes('entertainment') ||
    c.includes('show')
  ) {
    return 'entertainment';
  }
  if (c.includes('shop') || c.includes('market') || c.includes('mall') || c.includes('bazaar')) {
    return 'shopping';
  }
  if (
    c.includes('transit') ||
    c.includes('flight') ||
    c.includes('train') ||
    c.includes('bus') ||
    c.includes('commute') ||
    c.includes('travel')
  ) {
    return 'transit';
  }
  if (c.includes('relax') || c.includes('spa') || c.includes('leisure') || c.includes('wellness')) {
    return 'relaxation';
  }
  return 'sightseeing';
}

function sanitizeTripForDb(trip: Trip, userId: string, phone: string | null): Record<string, any> {
  const tripId = isValidUUID(trip.id) ? trip.id : generateSafeUUID();
  const nowIso = new Date().toISOString();
  const payload: Record<string, any> = {
    id: tripId,
    user_id: userId,
    title: trip.title,
    description: trip.description || '',
    origin: trip.origin,
    destination: trip.destination,
    start_date: trip.start_date,
    end_date: trip.end_date,
    duration_days: Math.max(1, trip.duration_days || 1),
    traveler_count: Math.max(1, trip.traveler_count || 1),
    travel_style: trip.travel_style || 'balanced',
    interests: Array.isArray(trip.interests) ? trip.interests : ['sightseeing'],
    total_budget: Math.max(0, trip.total_budget || 0),
    currency: trip.currency || detectCurrencyForDestination(trip.destination) || 'USD',
    status: trip.status || 'planning',
    cover_image_url: trip.cover_image_url || null,
    destination_lat: trip.destination_lat || null,
    destination_lng: trip.destination_lng || null,
    created_at: trip.created_at || nowIso,
    updated_at: nowIso,
  };
  if (phone) {
    payload.user_phone = phone;
  }
  return payload;
}

function sanitizeActivityForDb(act: Activity, tripId: string, dayId: string, orderIndex: number): Record<string, any> {
  const actId = isValidUUID(act.id) ? act.id : generateSafeUUID();
  const nowIso = new Date().toISOString();
  return {
    id: actId,
    trip_id: tripId,
    trip_day_id: dayId,
    title: act.title,
    description: act.description || '',
    category: normalizeActivityCategory(act.category),
    start_time: act.start_time || '09:00',
    end_time: act.end_time || '10:00',
    duration_minutes: Math.max(15, act.duration_minutes || 60),
    location_name: act.location_name || act.title,
    location_address: act.location_address || '',
    latitude: act.latitude || null,
    longitude: act.longitude || null,
    estimated_cost: Math.max(0, act.estimated_cost || 0),
    currency: act.currency || 'USD',
    order_index: orderIndex,
    created_at: act.created_at || nowIso,
    updated_at: nowIso,
  };
}

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripIdState] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [tripDays, setTripDays] = useState<Record<string, TripDay[]>>({});
  const [activities, setActivities] = useState<Record<string, Activity[]>>({});
  const [accommodations, setAccommodations] = useState<Record<string, Accommodation[]>>({});
  const [expenses, setExpenses] = useState<Record<string, TripExpense[]>>({});
  const [collaborators, setCollaborators] = useState<Record<string, TripCollaborator[]>>({});
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Load state whenever auth user state stabilizes
  useEffect(() => {
    loadData();
  }, [user?.id, profile?.phone]);

  const loadData = async () => {
    setLoading(true);

    // 1. If real Supabase is configured and authenticated user is present
    if (isSupabaseConfigured && user && user.id && !user.id.startsWith('demo-')) {
      try {
        let query = supabase.from('trips').select('*').order('created_at', { ascending: false });
        if (profile?.phone) {
          query = query.or(`user_id.eq.${user.id},user_phone.eq.${profile.phone}`);
        } else {
          query = query.eq('user_id', user.id);
        }

        const { data: dbTrips, error: tripsErr } = await query;

        if (!tripsErr && dbTrips && dbTrips.length > 0) {
          setTrips(dbTrips as Trip[]);
          setActiveTripIdState(dbTrips[0].id);

          const tripIds = dbTrips.map((t) => t.id);

          // Fetch days
          const { data: dbDays } = await supabase
            .from('trip_days')
            .select('*')
            .in('trip_id', tripIds)
            .order('day_number', { ascending: true });

          const daysByTrip: Record<string, TripDay[]> = {};
          if (dbDays) {
            for (const d of dbDays) {
              if (!daysByTrip[d.trip_id]) daysByTrip[d.trip_id] = [];
              daysByTrip[d.trip_id].push(d as TripDay);
            }
          }
          setTripDays(daysByTrip);

          // Fetch activities
          const { data: dbActs } = await supabase
            .from('activities')
            .select('*')
            .in('trip_id', tripIds)
            .order('order_index', { ascending: true });

          const actsByDay: Record<string, Activity[]> = {};
          if (dbActs) {
            for (const a of dbActs) {
              if (!actsByDay[a.trip_day_id]) actsByDay[a.trip_day_id] = [];
              actsByDay[a.trip_day_id].push(a as Activity);
            }
          }
          setActivities(actsByDay);

          // Fetch accommodations
          const { data: dbAcc } = await supabase
            .from('accommodations')
            .select('*')
            .in('trip_id', tripIds);

          const accByTrip: Record<string, Accommodation[]> = {};
          if (dbAcc) {
            for (const a of dbAcc) {
              if (!accByTrip[a.trip_id]) accByTrip[a.trip_id] = [];
              accByTrip[a.trip_id].push(a as Accommodation);
            }
          }
          setAccommodations(accByTrip);

          // Fetch expenses
          const { data: dbExp } = await supabase
            .from('trip_expenses')
            .select('*')
            .in('trip_id', tripIds);

          const expByTrip: Record<string, TripExpense[]> = {};
          if (dbExp) {
            for (const e of dbExp) {
              if (!expByTrip[e.trip_id]) expByTrip[e.trip_id] = [];
              expByTrip[e.trip_id].push(e as TripExpense);
            }
          }
          setExpenses(expByTrip);

          setIsCloudSynced(true);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to load trips from Supabase, falling back to local store:', err);
      }
    }

    // Fallback: Local storage (for offline, demo users, or before first trip creation)
    loadLocalData();
  };

  const loadLocalData = () => {
    const storedTrips = LocalStore.getTrips();
    setTrips(storedTrips);
    setTripDays(LocalStore.getTripDays());
    setActivities(LocalStore.getActivities());
    setAccommodations(LocalStore.getAccommodations());
    setExpenses(LocalStore.getExpenses());
    setCollaborators(LocalStore.getCollaborators());
    setSavedPlaces(LocalStore.getSavedPlaces());
    setIsCloudSynced(false);
    setLoading(false);
  };

  /**
   * Syncs existing offline/local trips into Supabase Database under user's ID & Phone
   */
  const syncCurrentTripsToSupabase = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!isSupabaseConfigured || !user || user.id.startsWith('demo-')) {
      return { success: false, count: 0, error: 'Please sign in with a registered account to sync to database.' };
    }

    try {
      let syncedCount = 0;
      for (const trip of trips) {
        // Upsert trip using sanitized payload compatible with Supabase schema
        const tripPayload = sanitizeTripForDb(trip, user.id, profile?.phone || profile?.mobile_number || null);
        const { error: tErr } = await supabase.from('trips').upsert(tripPayload);

        if (tErr) {
          console.warn(`Could not sync trip ${trip.id}:`, tErr.message);
          continue;
        }

        const effectiveTripId = tripPayload.id;

        // Upsert days
        const days = tripDays[trip.id] || [];
        for (const day of days) {
          const safeDayId = isValidUUID(day.id) ? day.id : generateSafeUUID();
          await supabase.from('trip_days').upsert({
            id: safeDayId,
            trip_id: effectiveTripId,
            day_number: Math.max(1, Number(day.day_number) || 1),
            date: day.date,
            theme: day.theme,
            summary: day.summary,
            weather_summary: day.weather_summary,
          });

          // Upsert activities with normalized category
          const dayActs = activities[day.id] || [];
          for (let idx = 0; idx < dayActs.length; idx++) {
            const act = dayActs[idx];
            const actPayload = sanitizeActivityForDb(act, effectiveTripId, safeDayId, idx);
            await supabase.from('activities').upsert(actPayload);
          }
        }
        syncedCount++;
      }

      setIsCloudSynced(true);
      await loadData();
      return { success: true, count: syncedCount };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Sync failed.' };
    }
  };

  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0] || null;
  const activeTripDays = activeTrip ? (tripDays[activeTrip.id] || []) : [];
  const activeAccommodations = activeTrip ? (accommodations[activeTrip.id] || []) : [];
  const activeExpenses = activeTrip ? (expenses[activeTrip.id] || []) : [];
  const activeCollaborators = activeTrip ? (collaborators[activeTrip.id] || []) : [];
  const activeChecklist = activeTrip ? (checklists[activeTrip.id] || LocalStore.getChecklist(activeTrip.id)) : [];

  const setActiveTripId = (tripId: string) => {
    setActiveTripIdState(tripId);
  };

  const createTripWithWizard = async (
    input: TripCreateWizardInput,
    onProgress?: (step: string, percent: number, logMsg: string) => void
  ): Promise<Trip> => {
    const response = await TripPilotAPI.startTripPlanning(
      { ...input, user_id: user?.id },
      onProgress
    );

    const newTrip = response.trip;
    const newDays = response.days;
    const newActs = response.activities;

    // Direct Supabase sync if user is authenticated
    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      try {
        const tripPayload = sanitizeTripForDb(newTrip, user.id, profile?.phone || profile?.mobile_number || null);
        newTrip.id = tripPayload.id;

        const { data: savedTrip, error: tErr } = await supabase
          .from('trips')
          .upsert(tripPayload)
          .select()
          .single();

        if (tErr) {
          console.error('Error inserting trip into Supabase:', tErr);
        }

        const effectiveTripId = savedTrip?.id || newTrip.id;

        for (const day of newDays) {
          const safeDayId = isValidUUID(day.id) ? day.id : generateSafeUUID();
          const dayActs = newActs[day.id] || [];

          day.id = safeDayId;
          day.trip_id = effectiveTripId;

          const { data: savedDay } = await supabase.from('trip_days').upsert({
            id: safeDayId,
            trip_id: effectiveTripId,
            day_number: Math.max(1, Number(day.day_number) || 1),
            date: day.date,
            theme: day.theme,
            summary: day.summary,
            weather_summary: day.weather_summary,
          }).select().single();

          if (dayActs.length > 0) {
            const actsToUpsert = dayActs.map((act, idx) => {
              const actPayload = sanitizeActivityForDb(act, effectiveTripId, safeDayId, idx);
              act.id = actPayload.id;
              act.trip_id = effectiveTripId;
              act.trip_day_id = safeDayId;
              return actPayload;
            });
            await supabase.from('activities').upsert(actsToUpsert);
          }
        }
        setIsCloudSynced(true);
        console.log('Successfully persisted trip and activities to Supabase cloud!');
      } catch (err) {
        console.warn('Error saving trip directly to Supabase:', err);
      }
    }

    const updatedTrips = [newTrip, ...trips];
    setTrips(updatedTrips);
    LocalStore.saveTrips(updatedTrips);

    const updatedDays = { ...tripDays, [newTrip.id]: newDays };
    setTripDays(updatedDays);
    LocalStore.saveTripDays(updatedDays);

    const updatedActs = { ...activities, ...newActs };
    setActivities(updatedActs);
    LocalStore.saveActivities(updatedActs);

    setActiveTripIdState(newTrip.id);
    return newTrip;
  };

  const updateTrip = async (tripId: string, updates: Partial<Trip>) => {
    const updated = trips.map((t) => (t.id === tripId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
    setTrips(updated);
    LocalStore.saveTrips(updated);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      await supabase.from('trips').update(updates).eq('id', tripId);
    }
  };

  const deleteTrip = async (tripId: string) => {
    const updated = trips.filter((t) => t.id !== tripId);
    setTrips(updated);
    LocalStore.saveTrips(updated);
    if (activeTripId === tripId && updated.length > 0) {
      setActiveTripIdState(updated[0].id);
    }

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      await supabase.from('trips').delete().eq('id', tripId);
    }
  };

  const addActivity = async (
    dayId: string,
    activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const actId = generateSafeUUID();
    const nowIso = new Date().toISOString();
    const newAct: Activity = {
      ...activityData,
      id: actId,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const dayActs = activities[dayId] || [];
    const updatedDayActs = [...dayActs, newAct];
    const updated = { ...activities, [dayId]: updatedDayActs };
    setActivities(updated);
    LocalStore.saveActivities(updated);

    if (isSupabaseConfigured && user && activeTrip && !user.id.startsWith('demo-')) {
      const actPayload = sanitizeActivityForDb(newAct, activeTrip.id, dayId, updatedDayActs.length - 1);
      await supabase.from('activities').upsert(actPayload);
    }
  };

  const addPlannedTrip = (plan: { trip: Trip; days: TripDay[]; activities: Record<string, Activity[]> }): Trip => {
    const { trip, days, activities: planActs } = plan;

    const safeTripId = isValidUUID(trip.id) ? trip.id : generateSafeUUID();
    trip.id = safeTripId;

    const nextTrips = [trip, ...trips.filter((t) => t.id !== trip.id)];
    const nextDays = { ...tripDays, [safeTripId]: days };
    const nextActivities = { ...activities, ...planActs };

    setTrips(nextTrips);
    setTripDays(nextDays);
    setActivities(nextActivities);
    setActiveTripIdState(safeTripId);

    LocalStore.saveTrips(nextTrips);
    LocalStore.saveTripDays(nextDays);
    LocalStore.saveActivities(nextActivities);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      (async () => {
        try {
          const tripPayload = sanitizeTripForDb(trip, user.id, profile?.phone || profile?.mobile_number || null);
          await supabase.from('trips').upsert(tripPayload);

          for (const day of days) {
            const safeDayId = isValidUUID(day.id) ? day.id : generateSafeUUID();
            day.id = safeDayId;
            day.trip_id = safeTripId;

            await supabase.from('trip_days').upsert({
              id: safeDayId,
              trip_id: safeTripId,
              day_number: Math.max(1, Number(day.day_number) || 1),
              date: day.date,
              theme: day.theme,
              summary: day.summary,
              weather_summary: day.weather_summary,
            });

            const dayActs = planActs[day.id] || [];
            if (dayActs.length > 0) {
              const actsToUpsert = dayActs.map((act, idx) => {
                const actPayload = sanitizeActivityForDb(act, safeTripId, safeDayId, idx);
                act.id = actPayload.id;
                act.trip_id = safeTripId;
                act.trip_day_id = safeDayId;
                return actPayload;
              });
              await supabase.from('activities').upsert(actsToUpsert);
            }
          }
          setIsCloudSynced(true);
        } catch (err: any) {
          console.warn('Could not sync planned trip to Supabase:', err);
        }
      })();
    }

    return trip;
  };

  const addHangoutPlan = (trip: Trip, day: TripDay, dayActivities: Activity[]) => {
    const nextTrips = [trip, ...trips];
    const nextDays = { ...tripDays, [trip.id]: [day] };
    const nextActivities = { ...activities, [day.id]: dayActivities };
    setTrips(nextTrips);
    setTripDays(nextDays);
    setActivities(nextActivities);
    setActiveTripIdState(trip.id);
    LocalStore.saveTrips(nextTrips);
    LocalStore.saveTripDays(nextDays);
    LocalStore.saveActivities(nextActivities);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      supabase.from('trips').insert({
        id: trip.id,
        user_id: user.id,
        user_phone: profile?.phone || null,
        title: trip.title,
        origin: trip.origin,
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        duration_days: trip.duration_days,
        traveler_count: trip.traveler_count,
        total_budget: trip.total_budget,
        currency: trip.currency,
      }).then(() => {
        supabase.from('trip_days').insert({
          id: day.id,
          trip_id: trip.id,
          day_number: day.day_number,
          date: day.date,
          theme: day.theme,
          summary: day.summary,
        });
      });
    }
  };

  const updateActivity = async (dayId: string, activityId: string, updates: Partial<Activity>) => {
    const dayActs = activities[dayId] || [];
    const updatedDayActs = dayActs.map((a) =>
      a.id === activityId ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
    );
    const updated = { ...activities, [dayId]: updatedDayActs };
    setActivities(updated);
    LocalStore.saveActivities(updated);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      await supabase.from('activities').update(updates).eq('id', activityId);
    }
  };

  const deleteActivity = async (dayId: string, activityId: string) => {
    const dayActs = activities[dayId] || [];
    const updatedDayActs = dayActs.filter((a) => a.id !== activityId);
    const updated = { ...activities, [dayId]: updatedDayActs };
    setActivities(updated);
    LocalStore.saveActivities(updated);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      await supabase.from('activities').delete().eq('id', activityId);
    }
  };

  const reorderActivities = async (dayId: string, orderedActivities: Activity[]) => {
    const reindexed = orderedActivities.map((act, index) => ({
      ...act,
      order_index: index,
    }));
    const updated = { ...activities, [dayId]: reindexed };
    setActivities(updated);
    LocalStore.saveActivities(updated);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      for (const act of reindexed) {
        await supabase.from('activities').update({ order_index: act.order_index }).eq('id', act.id);
      }
    }
  };

  const regenerateDay = async (dayId: string, prompt?: string, dayNumber?: number) => {
    if (!activeTrip) return;
    const resolvedDayNumber =
      dayNumber || tripDays[activeTrip.id]?.find((d) => d.id === dayId)?.day_number || 1;
    const newActs = await TripPilotAPI.regenerateDay(activeTrip.id, dayId, prompt, resolvedDayNumber);
    const updated = { ...activities, [dayId]: newActs };
    setActivities(updated);
    LocalStore.saveActivities(updated);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      for (let idx = 0; idx < newActs.length; idx++) {
        const actPayload = sanitizeActivityForDb(newActs[idx], activeTrip.id, dayId, idx);
        await supabase.from('activities').upsert(actPayload);
      }
    }
  };

  const addExpense = async (expenseData: Omit<TripExpense, 'id' | 'created_at'>) => {
    if (!activeTrip) return;
    const newExp: TripExpense = {
      ...expenseData,
      id: generateSafeUUID(),
      created_at: new Date().toISOString(),
    };
    const current = expenses[activeTrip.id] || [];
    const updated = { ...expenses, [activeTrip.id]: [...current, newExp] };
    setExpenses(updated);
    LocalStore.saveExpenses(updated);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      await supabase.from('trip_expenses').insert({
        id: newExp.id,
        trip_id: activeTrip.id,
        category: newExp.category,
        description: newExp.description,
        amount: newExp.amount,
        currency: newExp.currency,
        paid_by: user.id,
        payer_phone: profile?.phone || null,
        expense_date: newExp.date,
      });
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!activeTrip) return;
    const current = expenses[activeTrip.id] || [];
    const updated = { ...expenses, [activeTrip.id]: current.filter((e) => e.id !== expenseId) };
    setExpenses(updated);
    LocalStore.saveExpenses(updated);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      await supabase.from('trip_expenses').delete().eq('id', expenseId);
    }
  };

  const addCollaborator = async (email: string, role: 'viewer' | 'editor') => {
    if (!activeTrip) return;
    const newCollab: TripCollaborator = {
      id: generateSafeUUID(),
      trip_id: activeTrip.id,
      user_id: generateSafeUUID(),
      role,
      invited_email: email,
      created_at: new Date().toISOString(),
    };
    const current = collaborators[activeTrip.id] || [];
    const updated = { ...collaborators, [activeTrip.id]: [...current, newCollab] };
    setCollaborators(updated);
    LocalStore.saveCollaborators(updated);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      await supabase.from('trip_collaborators').insert({
        id: newCollab.id,
        trip_id: activeTrip.id,
        role,
        invited_email: email,
      });
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!activeTrip) return;
    const current = checklists[activeTrip.id] || LocalStore.getChecklist(activeTrip.id);
    const updated = current.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i));
    setChecklists((prev) => ({ ...prev, [activeTrip.id]: updated }));
    LocalStore.saveChecklist(activeTrip.id, updated);
  };

  const addChecklistItem = (text: string, category: ChecklistItem['category']) => {
    if (!activeTrip) return;
    const current = checklists[activeTrip.id] || LocalStore.getChecklist(activeTrip.id);
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text,
      category,
      completed: false,
    };
    const updated = [...current, newItem];
    setChecklists((prev) => ({ ...prev, [activeTrip.id]: updated }));
    LocalStore.saveChecklist(activeTrip.id, updated);
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        activeTripDays,
        activeTripActivities: activities,
        tripDays,
        activities,
        activeAccommodations,
        activeExpenses,
        activeCollaborators,
        savedPlaces,
        activeChecklist,
        loading,
        isCloudSynced,
        setActiveTripId,
        createTripWithWizard,
        syncCurrentTripsToSupabase,
        refreshData: loadData,
        updateTrip,
        deleteTrip,
        addActivity,
        addHangoutPlan,
        addPlannedTrip,
        updateActivity,
        deleteActivity,
        reorderActivities,
        regenerateDay,
        addExpense,
        deleteExpense,
        addCollaborator,
        toggleChecklistItem,
        addChecklistItem,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrips must be used within a TripProvider');
  return context;
};
