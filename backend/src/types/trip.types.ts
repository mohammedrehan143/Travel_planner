import { Database, TravelStyle, ActivityCategory, BookingStatus, ExpenseCategory, AgentRunStatus } from './database.types.js';

export type TripRow = Database['public']['Tables']['trips']['Row'];
export type TripDayRow = Database['public']['Tables']['trip_days']['Row'];
export type ActivityRow = Database['public']['Tables']['activities']['Row'];
export type AccommodationRow = Database['public']['Tables']['accommodations']['Row'];
export type TripExpenseRow = Database['public']['Tables']['trip_expenses']['Row'];
export type SavedPlaceRow = Database['public']['Tables']['saved_places']['Row'];
export type AgentRunRow = Database['public']['Tables']['agent_runs']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface PlanTripRequest {
  origin: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  travelerCount?: number;
  budget?: number;
  currency?: string;
  travelStyle?: TravelStyle;
  interests?: string[];
  transportPreference?: 'flight' | 'train' | 'car' | 'public_transit' | 'flexible';
  accommodationPreference?: 'hotel' | 'hostel' | 'resort' | 'apartment' | 'villa' | 'flexible';
  notes?: string;
  userId?: string;
  tripId?: string; // If re-planning or building into existing trip
}

export interface PlaceItem {
  id?: string;
  name: string;
  category: string;
  address?: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  estimatedCost?: number;
  openingHours?: {
    openTime: string;
    closeTime: string;
    daysOpen: string[];
    isOpenToday?: boolean;
  };
  description?: string;
  photoUrl?: string;
}

export interface WeatherDay {
  date: string;
  temperatureMaxC: number;
  temperatureMinC: number;
  condition: string;
  icon: string;
  precipitationProbability: number;
  windSpeedKmh?: number;
}

export interface RouteLeg {
  fromLocation: string;
  toLocation: string;
  distanceKm: number;
  durationMinutes: number;
  transportMode: 'walking' | 'driving' | 'transit' | 'cycling';
  polyline?: string;
}

export interface BudgetBreakdown {
  currency: string;
  totalBudget: number;
  estimatedTotalCost: number;
  surplusOrDeficit: number;
  isWithinBudget: boolean;
  categories: {
    accommodation: number;
    transport: number;
    activities: number;
    food: number;
    buffer: number;
  };
  costPerTraveler: number;
  recommendations: string[];
}

export interface PlannedActivity {
  id?: string;
  title: string;
  description: string;
  category: ActivityCategory;
  startTime: string; // "09:00"
  endTime: string;   // "11:00"
  durationMinutes: number;
  locationName: string;
  locationAddress?: string;
  latitude: number;
  longitude: number;
  estimatedCost: number;
  currency: string;
  bookingRequired: boolean;
  bookingUrl?: string;
  bookingStatus?: BookingStatus;
  notes?: string;
  orderIndex: number;
  travelFromPrevious?: {
    mode: 'walking' | 'transit' | 'driving';
    durationMinutes: number;
    distanceKm: number;
  };
}

export interface PlannedDay {
  dayNumber: number;
  date: string;
  theme: string;
  summary: string;
  weatherSummary?: WeatherDay;
  activities: PlannedActivity[];
  dayEstimatedCost: number;
}

export interface CompleteItinerary {
  tripId?: string;
  title: string;
  description: string;
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelerCount: number;
  travelStyle: TravelStyle;
  interests: string[];
  totalBudget: number;
  currency: string;
  destinationCoordinates: {
    lat: number;
    lng: number;
  };
  days: PlannedDay[];
  accommodationSuggestions: Array<{
    name: string;
    type: string;
    address: string;
    estimatedNightlyRate: number;
    totalPrice: number;
    rating: number;
    latitude: number;
    longitude: number;
  }>;
  budgetBreakdown: BudgetBreakdown;
  packingList?: string[];
  localTips?: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'opening_hours' | 'time_overlap' | 'travel_time' | 'budget_overrun' | 'pacing' | 'feasibility';
  dayNumber?: number;
  activityTitle?: string;
  message: string;
  suggestedFix?: string;
}

export interface ValidationReport {
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
  metrics: {
    totalActivities: number;
    averageActivitiesPerDay: number;
    totalTravelTimeMinutes: number;
    budgetUtilizationPercent: number;
  };
}

export interface AgentLogEntry {
  timestamp: string;
  step: string;
  message: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  status?: 'info' | 'success' | 'warning' | 'error';
}

export interface ModifyItineraryRequest {
  tripId: string;
  instructions: string; // Natural language user request, e.g. "Add a ramen tour on Day 2 evening"
  targetDay?: number;
}

export interface RegenerateDayRequest {
  tripId: string;
  dayNumber: number;
  customPacing?: 'relaxed' | 'packed' | 'adventure' | 'cultural';
  specificInterests?: string[];
}

export interface FullTripDetails extends TripRow {
  days: Array<TripDayRow & { activities: ActivityRow[] }>;
  accommodations: AccommodationRow[];
  expenses: TripExpenseRow[];
  collaborators: Array<{ id: string; userId: string; role: string; invitedEmail: string | null }>;
}
