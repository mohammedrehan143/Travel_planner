import { Trip, TripDay, Activity, Accommodation, TripExpense, TripCollaborator, SavedPlace, ChecklistItem } from '../types';

/**
 * Production Initial State:
 * Empty initial states for clean production deployment without hardcoded past demo trips.
 */
export const INITIAL_TRIPS: Trip[] = [];

export const INITIAL_TRIP_DAYS: Record<string, TripDay[]> = {};

export const INITIAL_ACTIVITIES: Record<string, Activity[]> = {};

export const INITIAL_ACCOMMODATIONS: Record<string, Accommodation[]> = {};

export const INITIAL_EXPENSES: Record<string, TripExpense[]> = {};

export const INITIAL_COLLABORATORS: Record<string, TripCollaborator[]> = {};

export const INITIAL_SAVED_PLACES: SavedPlace[] = [];

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'chk-1', text: 'Passport / National ID with validity', category: 'Documents', completed: false },
  { id: 'chk-2', text: 'Travel insurance & emergency booking tickets', category: 'Documents', completed: false },
  { id: 'chk-3', text: 'Universal power plug adapter & chargers', category: 'Tech', completed: false },
  { id: 'chk-4', text: 'Portable power bank (10,000mAh+)', category: 'Tech', completed: false },
  { id: 'chk-5', text: 'Comfortable walking shoes', category: 'Clothing', completed: false },
  { id: 'chk-6', text: 'Lightweight weather-appropriate apparel', category: 'Clothing', completed: false },
  { id: 'chk-7', text: 'Prescription medicines and first aid kit', category: 'Health', completed: false },
  { id: 'chk-8', text: 'Local currency cash and backup payment cards', category: 'Essentials', completed: false },
];
