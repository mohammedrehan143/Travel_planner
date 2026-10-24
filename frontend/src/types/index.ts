export type TravelStyle = 'budget' | 'backpacking' | 'balanced' | 'cultural' | 'luxury' | 'adventure' | 'relaxed';
export type TripStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled';
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';
export type ActivityCategory = 'sightseeing' | 'dining' | 'cultural' | 'outdoor' | 'transit' | 'shopping' | 'entertainment' | 'relaxation';
export type BookingStatus = 'not_booked' | 'booked' | 'optional';
export type AccommodationType = 'hotel' | 'hostel' | 'resort' | 'apartment' | 'villa' | 'other';
export type ExpenseCategory = 'accommodation' | 'flights' | 'transport' | 'activities' | 'food' | 'shopping' | 'insurance' | 'other';
export type AgentRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  mobile_number?: string;
  full_name?: string;
  avatar_url?: string;
  preferred_currency: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
  terms_version?: string;
  phone_verified?: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  user_phone?: string;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  traveler_count: number;
  travel_companion?: 'solo' | 'couple' | 'family' | 'friends' | 'colleagues' | string;
  travel_style: TravelStyle;
  interests: string[];
  total_budget: number;
  currency: string;
  status: TripStatus;
  cover_image_url?: string;
  destination_lat?: number;
  destination_lng?: number;
  transport_preference?: string;
  accommodation_preference?: string;
  dietary_preference?: string;
  flight_ticket_estimate?: {
    cost: number;
    currency: string;
    airlines?: string;
    description?: string;
  };
  curated_venues_by_topic?: VenueTopic[];
  created_at: string;
  updated_at: string;
}

export interface CuratedVenueItem {
  id: string;
  name: string;
  category: string;
  address?: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  estimatedCost?: number;
  speciality?: string;
  dietaryTag?: 'veg' | 'non_veg' | 'both' | 'none';
  description?: string;
  photoUrl?: string;
  selected?: boolean;
  openingHours?: {
    openTime: string;
    closeTime: string;
    daysOpen: string[];
    isOpenToday?: boolean;
  };
}

export interface VenueTopic {
  topicId: string;
  title: string;
  icon: string;
  description: string;
  venues: CuratedVenueItem[];
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  theme?: string;
  summary?: string;
  weather_summary?: {
    temp_c: number;
    condition: string;
    icon: string;
    precipitation_prob?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  trip_id: string;
  trip_day_id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  duration_minutes: number;
  location_name: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  estimated_cost: number;
  currency: string;
  speciality?: string;
  dietary_tag?: 'veg' | 'non_veg' | 'both' | 'none';
  selected?: boolean;
  booking_required: boolean;
  booking_url?: string;
  booking_status: BookingStatus;
  notes?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Accommodation {
  id: string;
  trip_id: string;
  name: string;
  type: AccommodationType;
  address?: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  currency: string;
  latitude?: number;
  longitude?: number;
  booking_reference?: string;
  booking_status: 'not_booked' | 'reserved' | 'confirmed';
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  date?: string;
  paid_by?: string;
  created_at: string;
}

export interface TripCollaborator {
  id: string;
  trip_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface SavedPlace {
  id: string;
  user_id: string;
  trip_id?: string;
  name: string;
  category?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  notes?: string;
  place_id?: string;
  created_at: string;
}

export interface AgentRun {
  id: string;
  trip_id?: string;
  user_id: string;
  status: AgentRunStatus;
  current_step: string;
  progress_percent: number;
  input_params: Record<string, any>;
  logs: Array<{
    timestamp: string;
    step: string;
    message: string;
    level: 'info' | 'warn' | 'error';
    tool_name?: string;
  }>;
  result?: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface TripCreateWizardInput {
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  traveler_count: number;
  travel_companion?: 'solo' | 'couple' | 'family' | 'friends' | 'colleagues' | string;
  total_budget: number;
  currency: string;
  travel_style: TravelStyle;
  interests: string[];
  dietary_preference?: 'veg' | 'non_veg' | 'any' | string;
  transport_preference?: string;
  accommodation_preference?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: 'Essentials' | 'Clothing' | 'Tech' | 'Health' | 'Documents';
  completed: boolean;
}
