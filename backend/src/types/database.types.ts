/**
 * Supabase Database Schema TypeScript Types
 * Generated & curated for TripPilot AI
 * Compatible with @supabase/supabase-js createClient<Database>()
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TravelStyle =
  | 'budget'
  | 'backpacking'
  | 'balanced'
  | 'cultural'
  | 'luxury'
  | 'adventure'
  | 'relaxed';

export type TripStatus =
  | 'draft'
  | 'planning'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export type ActivityCategory =
  | 'sightseeing'
  | 'dining'
  | 'cultural'
  | 'outdoor'
  | 'transit'
  | 'shopping'
  | 'entertainment'
  | 'relaxation';

export type BookingStatus = 'not_booked' | 'booked' | 'optional' | 'reserved' | 'confirmed';

export type ExpenseCategory =
  | 'accommodation'
  | 'flights'
  | 'transport'
  | 'activities'
  | 'food'
  | 'shopping'
  | 'insurance'
  | 'other';

export type AgentRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          mobile_number: string | null;
          full_name: string | null;
          avatar_url: string | null;
          preferred_currency: string;
          terms_accepted: boolean;
          terms_accepted_at: string | null;
          terms_version: string | null;
          phone_verified: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          phone?: string | null;
          mobile_number?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string;
          terms_accepted?: boolean;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          phone_verified?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string | null;
          mobile_number?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string;
          terms_accepted?: boolean;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          phone_verified?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          origin: string;
          destination: string;
          start_date: string;
          end_date: string;
          duration_days: number;
          traveler_count: number;
          travel_style: TravelStyle;
          interests: string[];
          total_budget: number;
          currency: string;
          status: TripStatus;
          cover_image_url: string | null;
          destination_lat: number | null;
          destination_lng: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          origin: string;
          destination: string;
          start_date: string;
          end_date: string;
          duration_days: number;
          traveler_count?: number;
          travel_style?: TravelStyle;
          interests?: string[];
          total_budget?: number;
          currency?: string;
          status?: TripStatus;
          cover_image_url?: string | null;
          destination_lat?: number | null;
          destination_lng?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          origin?: string;
          destination?: string;
          start_date?: string;
          end_date?: string;
          duration_days?: number;
          traveler_count?: number;
          travel_style?: TravelStyle;
          interests?: string[];
          total_budget?: number;
          currency?: string;
          status?: TripStatus;
          cover_image_url?: string | null;
          destination_lat?: number | null;
          destination_lng?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_collaborators: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: CollaboratorRole;
          invited_email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role?: CollaboratorRole;
          invited_email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          user_id?: string;
          role?: CollaboratorRole;
          invited_email?: string | null;
          created_at?: string;
        };
      };
      trip_days: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          date: string;
          theme: string | null;
          summary: string | null;
          weather_summary: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_number: number;
          date: string;
          theme?: string | null;
          summary?: string | null;
          weather_summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_number?: number;
          date?: string;
          theme?: string | null;
          summary?: string | null;
          weather_summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          trip_id: string;
          trip_day_id: string;
          title: string;
          description: string | null;
          category: ActivityCategory;
          start_time: string;
          end_time: string;
          duration_minutes: number;
          location_name: string;
          location_address: string | null;
          latitude: number | null;
          longitude: number | null;
          estimated_cost: number;
          currency: string;
          booking_required: boolean;
          booking_url: string | null;
          booking_status: BookingStatus;
          notes: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          trip_day_id: string;
          title: string;
          description?: string | null;
          category?: ActivityCategory;
          start_time: string;
          end_time: string;
          duration_minutes?: number;
          location_name: string;
          location_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          estimated_cost?: number;
          currency?: string;
          booking_required?: boolean;
          booking_url?: string | null;
          booking_status?: BookingStatus;
          notes?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          trip_day_id?: string;
          title?: string;
          description?: string | null;
          category?: ActivityCategory;
          start_time?: string;
          end_time?: string;
          duration_minutes?: number;
          location_name?: string;
          location_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          estimated_cost?: number;
          currency?: string;
          booking_required?: boolean;
          booking_url?: string | null;
          booking_status?: BookingStatus;
          notes?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      accommodations: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          type: string;
          address: string | null;
          check_in_date: string;
          check_out_date: string;
          total_price: number;
          currency: string;
          latitude: number | null;
          longitude: number | null;
          booking_reference: string | null;
          booking_status: BookingStatus;
          rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          name: string;
          type?: string;
          address?: string | null;
          check_in_date: string;
          check_out_date: string;
          total_price?: number;
          currency?: string;
          latitude?: number | null;
          longitude?: number | null;
          booking_reference?: string | null;
          booking_status?: BookingStatus;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          name?: string;
          type?: string;
          address?: string | null;
          check_in_date?: string;
          check_out_date?: string;
          total_price?: number;
          currency?: string;
          latitude?: number | null;
          longitude?: number | null;
          booking_reference?: string | null;
          booking_status?: BookingStatus;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_expenses: {
        Row: {
          id: string;
          trip_id: string;
          category: ExpenseCategory;
          amount: number;
          currency: string;
          description: string;
          date: string | null;
          paid_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          category: ExpenseCategory;
          amount: number;
          currency?: string;
          description: string;
          date?: string | null;
          paid_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          category?: ExpenseCategory;
          amount?: number;
          currency?: string;
          description?: string;
          date?: string | null;
          paid_by?: string | null;
          created_at?: string;
        };
      };
      saved_places: {
        Row: {
          id: string;
          user_id: string;
          trip_id: string | null;
          name: string;
          category: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          rating: number | null;
          notes: string | null;
          place_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_id?: string | null;
          name: string;
          category?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rating?: number | null;
          notes?: string | null;
          place_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trip_id?: string | null;
          name?: string;
          category?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rating?: number | null;
          notes?: string | null;
          place_id?: string | null;
          created_at?: string;
        };
      };
      agent_runs: {
        Row: {
          id: string;
          trip_id: string | null;
          user_id: string;
          status: AgentRunStatus;
          current_step: string;
          progress_percent: number;
          input_params: Json;
          logs: Json[];
          result: Json | null;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id?: string | null;
          user_id: string;
          status?: AgentRunStatus;
          current_step?: string;
          progress_percent?: number;
          input_params: Json;
          logs?: Json[];
          result?: Json | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string | null;
          user_id?: string;
          status?: AgentRunStatus;
          current_step?: string;
          progress_percent?: number;
          input_params?: Json;
          logs?: Json[];
          result?: Json | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_trip_member: {
        Args: {
          lookup_trip_id: string;
          lookup_user_id: string;
        };
        Returns: boolean;
      };
      is_trip_editor: {
        Args: {
          lookup_trip_id: string;
          lookup_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
