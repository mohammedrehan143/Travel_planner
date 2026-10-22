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
import { TripPilotAPI } from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  regenerateDay: (dayId: string, prompt?: string) => Promise<void>;
  addExpense: (expense: Omit<TripExpense, 'id' | 'created_at'>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addCollaborator: (email: string, role: 'viewer' | 'editor') => Promise<void>;
  toggleChecklistItem: (itemId: string) => void;
  addChecklistItem: (text: string, category: ChecklistItem['category']) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

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
        // Upsert trip
        const { error: tErr } = await supabase.from('trips').upsert({
          id: trip.id,
          user_id: user.id,
          user_phone: profile?.phone || profile?.mobile_number || null,
          title: trip.title,
          description: trip.description,
          origin: trip.origin,
          destination: trip.destination,
          start_date: trip.start_date,
          end_date: trip.end_date,
          duration_days: trip.duration_days,
          traveler_count: trip.traveler_count,
          travel_companion: trip.travel_companion,
          travel_style: trip.travel_style,
          interests: trip.interests,
          total_budget: trip.total_budget,
          currency: trip.currency,
          status: trip.status || 'planning',
          cover_image_url: trip.cover_image_url,
          destination_lat: trip.destination_lat,
          destination_lng: trip.destination_lng,
          flight_ticket_estimate: trip.flight_ticket_estimate,
        });

        if (tErr) {
          console.warn(`Could not sync trip ${trip.id}:`, tErr.message);
          continue;
        }

        // Upsert days
        const days = tripDays[trip.id] || [];
        for (const day of days) {
          await supabase.from('trip_days').upsert({
            id: day.id,
            trip_id: trip.id,
            day_number: day.day_number,
            date: day.date,
            theme: day.theme,
            summary: day.summary,
            weather_summary: day.weather_summary,
          });

          // Upsert activities
          const dayActs = activities[day.id] || [];
          for (let idx = 0; idx < dayActs.length; idx++) {
            const act = dayActs[idx];
            await supabase.from('activities').upsert({
              id: act.id,
              trip_id: trip.id,
              trip_day_id: day.id,
              title: act.title,
              description: act.description,
              category: act.category,
              start_time: act.start_time,
              end_time: act.end_time,
              duration_minutes: act.duration_minutes,
              location_name: act.location_name,
              location_address: act.location_address,
              latitude: act.latitude,
              longitude: act.longitude,
              estimated_cost: act.estimated_cost,
              currency: act.currency,
              order_index: idx,
            });
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
  const activeChecklist = activeTrip ? LocalStore.getChecklist(activeTrip.id) : [];

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
        const { data: savedTrip, error: tErr } = await supabase.from('trips').insert({
          id: newTrip.id,
          user_id: user.id,
          user_phone: profile?.phone || profile?.mobile_number || null,
          title: newTrip.title,
          description: newTrip.description,
          origin: newTrip.origin,
          destination: newTrip.destination,
          start_date: newTrip.start_date,
          end_date: newTrip.end_date,
          duration_days: newTrip.duration_days,
          traveler_count: newTrip.traveler_count,
          travel_companion: newTrip.travel_companion,
          travel_style: newTrip.travel_style,
          interests: newTrip.interests,
          total_budget: newTrip.total_budget,
          currency: newTrip.currency,
          status: newTrip.status || 'planning',
          cover_image_url: newTrip.cover_image_url,
          destination_lat: newTrip.destination_lat,
          destination_lng: newTrip.destination_lng,
          flight_ticket_estimate: newTrip.flight_ticket_estimate,
        }).select().single();

        if (!tErr && savedTrip) {
          for (const day of newDays) {
            const { data: savedDay } = await supabase.from('trip_days').insert({
              id: day.id,
              trip_id: savedTrip.id,
              day_number: day.day_number,
              date: day.date,
              theme: day.theme,
              summary: day.summary,
              weather_summary: day.weather_summary,
            }).select().single();

            const dayActs = newActs[day.id] || [];
            if (dayActs.length > 0 && savedDay) {
              await supabase.from('activities').insert(
                dayActs.map((act, idx) => ({
                  id: act.id,
                  trip_id: savedTrip.id,
                  trip_day_id: savedDay.id,
                  title: act.title,
                  description: act.description,
                  category: act.category,
                  start_time: act.start_time,
                  end_time: act.end_time,
                  duration_minutes: act.duration_minutes,
                  location_name: act.location_name,
                  location_address: act.location_address,
                  latitude: act.latitude,
                  longitude: act.longitude,
                  estimated_cost: act.estimated_cost,
                  currency: act.currency,
                  order_index: idx,
                }))
              );
            }
          }
          setIsCloudSynced(true);
        }
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
    const newAct: Activity = {
      ...activityData,
      id: `act-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const dayActs = activities[dayId] || [];
    const updatedDayActs = [...dayActs, newAct];
    const updated = { ...activities, [dayId]: updatedDayActs };
    setActivities(updated);
    LocalStore.saveActivities(updated);

    if (isSupabaseConfigured && user && activeTrip && !user.id.startsWith('demo-')) {
      await supabase.from('activities').insert({
        id: newAct.id,
        trip_id: activeTrip.id,
        trip_day_id: dayId,
        title: newAct.title,
        description: newAct.description,
        category: newAct.category,
        start_time: newAct.start_time,
        end_time: newAct.end_time,
        duration_minutes: newAct.duration_minutes,
        location_name: newAct.location_name,
        location_address: newAct.location_address,
        latitude: newAct.latitude,
        longitude: newAct.longitude,
        estimated_cost: newAct.estimated_cost,
        currency: newAct.currency,
        order_index: updatedDayActs.length - 1,
      });
    }
  };

  const addPlannedTrip = (plan: { trip: Trip; days: TripDay[]; activities: Record<string, Activity[]> }): Trip => {
    const { trip, days, activities: planActs } = plan;

    const nextTrips = [trip, ...trips.filter((t) => t.id !== trip.id)];
    const nextDays = { ...tripDays, [trip.id]: days };
    const nextActivities = { ...activities, ...planActs };

    setTrips(nextTrips);
    setTripDays(nextDays);
    setActivities(nextActivities);
    setActiveTripIdState(trip.id);

    LocalStore.saveTrips(nextTrips);
    LocalStore.saveTripDays(nextDays);
    LocalStore.saveActivities(nextActivities);

    if (isSupabaseConfigured && user && !user.id.startsWith('demo-')) {
      (async () => {
        try {
          await supabase.from('trips').upsert({
            id: trip.id,
            user_id: user.id,
            user_phone: profile?.phone || profile?.mobile_number || null,
            title: trip.title,
            description: trip.description,
            origin: trip.origin,
            destination: trip.destination,
            start_date: trip.start_date,
            end_date: trip.end_date,
            duration_days: trip.duration_days,
            traveler_count: trip.traveler_count,
            travel_companion: trip.travel_companion,
            travel_style: trip.travel_style,
            interests: trip.interests,
            total_budget: trip.total_budget,
            currency: trip.currency,
            status: trip.status || 'planning',
            cover_image_url: trip.cover_image_url,
            destination_lat: trip.destination_lat,
            destination_lng: trip.destination_lng,
            flight_ticket_estimate: trip.flight_ticket_estimate,
          });

          for (const day of days) {
            await supabase.from('trip_days').upsert({
              id: day.id,
              trip_id: trip.id,
              day_number: day.day_number,
              date: day.date,
              theme: day.theme,
              summary: day.summary,
              weather_summary: day.weather_summary,
            });

            const dayActs = planActs[day.id] || [];
            if (dayActs.length > 0) {
              await supabase.from('activities').upsert(
                dayActs.map((act, idx) => ({
                  id: act.id,
                  trip_id: trip.id,
                  trip_day_id: day.id,
                  title: act.title,
                  description: act.description,
                  category: act.category,
                  start_time: act.start_time,
                  end_time: act.end_time,
                  duration_minutes: act.duration_minutes,
                  location_name: act.location_name,
                  location_address: act.location_address,
                  latitude: act.latitude,
                  longitude: act.longitude,
                  estimated_cost: act.estimated_cost,
                  currency: act.currency,
                  speciality: act.speciality,
                  dietary_tag: act.dietary_tag,
                  order_index: idx,
                }))
              );
            }
          }
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

  const regenerateDay = async (dayId: string, prompt?: string) => {
    if (!activeTrip) return;
    const newActs = await TripPilotAPI.regenerateDay(activeTrip.id, dayId, prompt);
    const updated = { ...activities, [dayId]: newActs };
    setActivities(updated);
    LocalStore.saveActivities(updated);
  };

  const addExpense = async (expenseData: Omit<TripExpense, 'id' | 'created_at'>) => {
    if (!activeTrip) return;
    const newExp: TripExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
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
      id: `collab-${Date.now()}`,
      trip_id: activeTrip.id,
      user_id: `user-${Date.now()}`,
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
        trip_id: activeTrip.id,
        role,
        invited_email: email,
      });
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!activeTrip) return;
    const current = LocalStore.getChecklist(activeTrip.id);
    const updated = current.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i));
    LocalStore.saveChecklist(activeTrip.id, updated);
  };

  const addChecklistItem = (text: string, category: ChecklistItem['category']) => {
    if (!activeTrip) return;
    const current = LocalStore.getChecklist(activeTrip.id);
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text,
      category,
      completed: false,
    };
    LocalStore.saveChecklist(activeTrip.id, [...current, newItem]);
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
