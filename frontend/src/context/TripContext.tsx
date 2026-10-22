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
  activeAccommodations: Accommodation[];
  activeExpenses: TripExpense[];
  activeCollaborators: TripCollaborator[];
  savedPlaces: SavedPlace[];
  activeChecklist: ChecklistItem[];
  loading: boolean;
  setActiveTripId: (tripId: string) => void;
  createTripWithWizard: (
    input: TripCreateWizardInput,
    onProgress?: (step: string, percent: number, logMsg: string) => void
  ) => Promise<Trip>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  addActivity: (dayId: string, activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
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
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripIdState] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [tripDays, setTripDays] = useState<Record<string, TripDay[]>>({});
  const [activities, setActivities] = useState<Record<string, Activity[]>>({});
  const [accommodations, setAccommodations] = useState<Record<string, Accommodation[]>>({});
  const [expenses, setExpenses] = useState<Record<string, TripExpense[]>>({});
  const [collaborators, setCollaborators] = useState<Record<string, TripCollaborator[]>>({});
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load state on mount
  useEffect(() => {
    loadLocalData();
  }, [user]);

  const loadLocalData = () => {
    const storedTrips = LocalStore.getTrips();
    setTrips(storedTrips);
    setTripDays(LocalStore.getTripDays());
    setActivities(LocalStore.getActivities());
    setAccommodations(LocalStore.getAccommodations());
    setExpenses(LocalStore.getExpenses());
    setCollaborators(LocalStore.getCollaborators());
    setSavedPlaces(LocalStore.getSavedPlaces());
    setLoading(false);
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
  };

  const deleteTrip = async (tripId: string) => {
    const updated = trips.filter((t) => t.id !== tripId);
    setTrips(updated);
    LocalStore.saveTrips(updated);
    if (activeTripId === tripId && updated.length > 0) {
      setActiveTripIdState(updated[0].id);
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
  };

  const updateActivity = async (dayId: string, activityId: string, updates: Partial<Activity>) => {
    const dayActs = activities[dayId] || [];
    const updatedDayActs = dayActs.map((a) =>
      a.id === activityId ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
    );
    const updated = { ...activities, [dayId]: updatedDayActs };
    setActivities(updated);
    LocalStore.saveActivities(updated);
  };

  const deleteActivity = async (dayId: string, activityId: string) => {
    const dayActs = activities[dayId] || [];
    const updatedDayActs = dayActs.filter((a) => a.id !== activityId);
    const updated = { ...activities, [dayId]: updatedDayActs };
    setActivities(updated);
    LocalStore.saveActivities(updated);
  };

  const reorderActivities = async (dayId: string, orderedActivities: Activity[]) => {
    const reindexed = orderedActivities.map((act, index) => ({
      ...act,
      order_index: index,
    }));
    const updated = { ...activities, [dayId]: reindexed };
    setActivities(updated);
    LocalStore.saveActivities(updated);
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
    const tripExps = expenses[activeTrip.id] || [];
    const updated = { ...expenses, [activeTrip.id]: [newExp, ...tripExps] };
    setExpenses(updated);
    LocalStore.saveExpenses(updated);
  };

  const deleteExpense = async (expenseId: string) => {
    if (!activeTrip) return;
    const tripExps = expenses[activeTrip.id] || [];
    const updated = { ...expenses, [activeTrip.id]: tripExps.filter((e) => e.id !== expenseId) };
    setExpenses(updated);
    LocalStore.saveExpenses(updated);
  };

  const addCollaborator = async (email: string, role: 'viewer' | 'editor') => {
    if (!activeTrip) return;
    const newCollab: TripCollaborator = {
      id: `collab-${Date.now()}`,
      trip_id: activeTrip.id,
      user_id: `user-${Date.now()}`,
      role,
      invited_email: email,
      full_name: email.split('@')[0],
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      created_at: new Date().toISOString(),
    };
    const current = collaborators[activeTrip.id] || [];
    const updated = { ...collaborators, [activeTrip.id]: [...current, newCollab] };
    setCollaborators(updated);
    LocalStore.saveCollaborators(updated);
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!activeTrip) return;
    const current = LocalStore.getChecklist(activeTrip.id);
    const updated = current.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    LocalStore.saveChecklist(activeTrip.id, updated);
    // trigger re-render
    setTrips([...trips]);
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
    setTrips([...trips]);
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        activeTripDays,
        activeTripActivities: activities,
        activeAccommodations,
        activeExpenses,
        activeCollaborators,
        savedPlaces,
        activeChecklist,
        loading,
        setActiveTripId,
        createTripWithWizard,
        updateTrip,
        deleteTrip,
        addActivity,
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
  if (!context) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};
