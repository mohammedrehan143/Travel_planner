import { Trip, TripDay, Activity, Accommodation, TripExpense, TripCollaborator, SavedPlace, ChecklistItem } from '../types';
import {
  INITIAL_TRIPS,
  INITIAL_TRIP_DAYS,
  INITIAL_ACTIVITIES,
  INITIAL_ACCOMMODATIONS,
  INITIAL_EXPENSES,
  INITIAL_COLLABORATORS,
  INITIAL_SAVED_PLACES,
  DEFAULT_CHECKLIST
} from './mockData';

const BASE_STORAGE_KEYS = {
  TRIPS: 'trippilot_trips',
  TRIP_DAYS: 'trippilot_trip_days',
  ACTIVITIES: 'trippilot_activities',
  ACCOMMODATIONS: 'trippilot_accommodations',
  EXPENSES: 'trippilot_expenses',
  COLLABORATORS: 'trippilot_collaborators',
  SAVED_PLACES: 'trippilot_saved_places',
  CHECKLISTS: 'trippilot_checklists',
};

function getScopedKey(baseKey: string, userId?: string | null): string {
  if (!userId || userId === 'guest' || userId.startsWith('demo-')) {
    return `${baseKey}_demo`;
  }
  return `${baseKey}_${userId}`;
}

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage, using default`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export const LocalStore = {
  getTrips: (userId?: string | null): Trip[] => {
    const key = getScopedKey(BASE_STORAGE_KEYS.TRIPS, userId);
    // Also check legacy unscoped key if scoped is not yet populated
    let trips = getStored<Trip[]>(key, []);
    if ((!trips || trips.length === 0) && (!userId || userId.startsWith('demo-'))) {
      trips = getStored<Trip[]>(BASE_STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    }
    return Array.isArray(trips) ? trips.filter((t) => !t.id?.includes('trip-000')) : [];
  },
  saveTrips: (trips: Trip[], userId?: string | null) => {
    const key = getScopedKey(BASE_STORAGE_KEYS.TRIPS, userId);
    setStored(key, trips);
  },

  getTripDays: (userId?: string | null): Record<string, TripDay[]> => {
    const key = getScopedKey(BASE_STORAGE_KEYS.TRIP_DAYS, userId);
    return getStored<Record<string, TripDay[]>>(key, INITIAL_TRIP_DAYS);
  },
  saveTripDays: (days: Record<string, TripDay[]>, userId?: string | null) => {
    const key = getScopedKey(BASE_STORAGE_KEYS.TRIP_DAYS, userId);
    setStored(key, days);
  },

  getActivities: (userId?: string | null): Record<string, Activity[]> => {
    const key = getScopedKey(BASE_STORAGE_KEYS.ACTIVITIES, userId);
    return getStored<Record<string, Activity[]>>(key, INITIAL_ACTIVITIES);
  },
  saveActivities: (activities: Record<string, Activity[]>, userId?: string | null) => {
    const key = getScopedKey(BASE_STORAGE_KEYS.ACTIVITIES, userId);
    setStored(key, activities);
  },

  getAccommodations: (userId?: string | null): Record<string, Accommodation[]> => {
    const key = getScopedKey(BASE_STORAGE_KEYS.ACCOMMODATIONS, userId);
    return getStored<Record<string, Accommodation[]>>(key, INITIAL_ACCOMMODATIONS);
  },
  saveAccommodations: (acc: Record<string, Accommodation[]>, userId?: string | null) => {
    const key = getScopedKey(BASE_STORAGE_KEYS.ACCOMMODATIONS, userId);
    setStored(key, acc);
  },

  getExpenses: (userId?: string | null): Record<string, TripExpense[]> => {
    const key = getScopedKey(BASE_STORAGE_KEYS.EXPENSES, userId);
    return getStored<Record<string, TripExpense[]>>(key, INITIAL_EXPENSES);
  },
  saveExpenses: (exp: Record<string, TripExpense[]>, userId?: string | null) => {
    const key = getScopedKey(BASE_STORAGE_KEYS.EXPENSES, userId);
    setStored(key, exp);
  },

  getCollaborators: (userId?: string | null): Record<string, TripCollaborator[]> => {
    const key = getScopedKey(BASE_STORAGE_KEYS.COLLABORATORS, userId);
    return getStored<Record<string, TripCollaborator[]>>(key, INITIAL_COLLABORATORS);
  },
  saveCollaborators: (collabs: Record<string, TripCollaborator[]>, userId?: string | null) => {
    const key = getScopedKey(BASE_STORAGE_KEYS.COLLABORATORS, userId);
    setStored(key, collabs);
  },

  getSavedPlaces: (userId?: string | null): SavedPlace[] => {
    const key = getScopedKey(BASE_STORAGE_KEYS.SAVED_PLACES, userId);
    return getStored<SavedPlace[]>(key, INITIAL_SAVED_PLACES);
  },
  saveSavedPlaces: (places: SavedPlace[], userId?: string | null) => {
    const key = getScopedKey(BASE_STORAGE_KEYS.SAVED_PLACES, userId);
    setStored(key, places);
  },

  getChecklist: (tripId: string, userId?: string | null): ChecklistItem[] => {
    const key = getScopedKey(BASE_STORAGE_KEYS.CHECKLISTS, userId);
    const all = getStored<Record<string, ChecklistItem[]>>(key, {});
    return all[tripId] || DEFAULT_CHECKLIST;
  },
  saveChecklist: (tripId: string, items: ChecklistItem[], userId?: string | null) => {
    const key = getScopedKey(BASE_STORAGE_KEYS.CHECKLISTS, userId);
    const all = getStored<Record<string, ChecklistItem[]>>(key, {});
    all[tripId] = items;
    setStored(key, all);
  },

  /**
   * Complete purge of all cached trip data, conversation threads, and account-linked storage keys.
   * Invoked upon sign out or when switching to another account.
   */
  resetAll: () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('trippilot_') || k.includes('conversation'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error clearing localStorage in LocalStore.resetAll', e);
    }
  },

  /**
   * Resets local storage keys specifically associated with a particular user.
   */
  resetUserData: (userId?: string | null) => {
    try {
      const targetSuffix = userId && !userId.startsWith('demo-') ? `_${userId}` : '_demo';
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.endsWith(targetSuffix) || k.includes('conversation') || (userId && k.includes(userId)))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error clearing user data in LocalStore.resetUserData', e);
    }
  }
};
