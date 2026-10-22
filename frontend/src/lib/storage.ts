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

const STORAGE_KEYS = {
  TRIPS: 'trippilot_trips',
  TRIP_DAYS: 'trippilot_trip_days',
  ACTIVITIES: 'trippilot_activities',
  ACCOMMODATIONS: 'trippilot_accommodations',
  EXPENSES: 'trippilot_expenses',
  COLLABORATORS: 'trippilot_collaborators',
  SAVED_PLACES: 'trippilot_saved_places',
  CHECKLISTS: 'trippilot_checklists',
};

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
  getTrips: (): Trip[] => getStored<Trip[]>(STORAGE_KEYS.TRIPS, INITIAL_TRIPS),
  saveTrips: (trips: Trip[]) => setStored(STORAGE_KEYS.TRIPS, trips),

  getTripDays: (): Record<string, TripDay[]> =>
    getStored<Record<string, TripDay[]>>(STORAGE_KEYS.TRIP_DAYS, INITIAL_TRIP_DAYS),
  saveTripDays: (days: Record<string, TripDay[]>) => setStored(STORAGE_KEYS.TRIP_DAYS, days),

  getActivities: (): Record<string, Activity[]> =>
    getStored<Record<string, Activity[]>>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES),
  saveActivities: (activities: Record<string, Activity[]>) =>
    setStored(STORAGE_KEYS.ACTIVITIES, activities),

  getAccommodations: (): Record<string, Accommodation[]> =>
    getStored<Record<string, Accommodation[]>>(STORAGE_KEYS.ACCOMMODATIONS, INITIAL_ACCOMMODATIONS),
  saveAccommodations: (acc: Record<string, Accommodation[]>) =>
    setStored(STORAGE_KEYS.ACCOMMODATIONS, acc),

  getExpenses: (): Record<string, TripExpense[]> =>
    getStored<Record<string, TripExpense[]>>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
  saveExpenses: (exp: Record<string, TripExpense[]>) =>
    setStored(STORAGE_KEYS.EXPENSES, exp),

  getCollaborators: (): Record<string, TripCollaborator[]> =>
    getStored<Record<string, TripCollaborator[]>>(STORAGE_KEYS.COLLABORATORS, INITIAL_COLLABORATORS),
  saveCollaborators: (collabs: Record<string, TripCollaborator[]>) =>
    setStored(STORAGE_KEYS.COLLABORATORS, collabs),

  getSavedPlaces: (): SavedPlace[] =>
    getStored<SavedPlace[]>(STORAGE_KEYS.SAVED_PLACES, INITIAL_SAVED_PLACES),
  saveSavedPlaces: (places: SavedPlace[]) =>
    setStored(STORAGE_KEYS.SAVED_PLACES, places),

  getChecklist: (tripId: string): ChecklistItem[] => {
    const all = getStored<Record<string, ChecklistItem[]>>(STORAGE_KEYS.CHECKLISTS, {});
    return all[tripId] || DEFAULT_CHECKLIST;
  },
  saveChecklist: (tripId: string, items: ChecklistItem[]) => {
    const all = getStored<Record<string, ChecklistItem[]>>(STORAGE_KEYS.CHECKLISTS, {});
    all[tripId] = items;
    setStored(STORAGE_KEYS.CHECKLISTS, all);
  },

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEYS.TRIPS);
    localStorage.removeItem(STORAGE_KEYS.TRIP_DAYS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.ACCOMMODATIONS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.COLLABORATORS);
    localStorage.removeItem(STORAGE_KEYS.SAVED_PLACES);
    localStorage.removeItem(STORAGE_KEYS.CHECKLISTS);
  }
};
