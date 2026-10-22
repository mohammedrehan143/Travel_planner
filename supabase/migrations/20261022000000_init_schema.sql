-- =====================================================================
-- TripPilot AI Database Schema Migration
-- Author: Person 2 (Backend & Agentic AI Lead)
-- Description: Core tables, indexes, constraints, triggers, and RLS
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    preferred_currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. TRIPS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    traveler_count INTEGER NOT NULL DEFAULT 1 CHECK (traveler_count > 0),
    travel_style TEXT NOT NULL DEFAULT 'balanced' 
        CHECK (travel_style IN ('budget', 'backpacking', 'balanced', 'cultural', 'luxury', 'adventure', 'relaxed')),
    interests TEXT[] NOT NULL DEFAULT '{}',
    total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_budget >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'planning'
        CHECK (status IN ('draft', 'planning', 'confirmed', 'completed', 'cancelled')),
    cover_image_url TEXT,
    destination_lat NUMERIC(10, 7),
    destination_lng NUMERIC(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- ---------------------------------------------------------------------
-- 3. TRIP COLLABORATORS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' 
        CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, user_id)
);

-- ---------------------------------------------------------------------
-- 4. TRIP DAYS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number > 0),
    date DATE NOT NULL,
    theme TEXT,
    summary TEXT,
    weather_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, day_number)
);

-- ---------------------------------------------------------------------
-- 5. ACTIVITIES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    trip_day_id UUID NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'sightseeing'
        CHECK (category IN ('sightseeing', 'dining', 'cultural', 'outdoor', 'transit', 'shopping', 'entertainment', 'relaxation')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    location_name TEXT NOT NULL,
    location_address TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    booking_required BOOLEAN NOT NULL DEFAULT false,
    booking_url TEXT,
    booking_status TEXT NOT NULL DEFAULT 'not_booked'
        CHECK (booking_status IN ('not_booked', 'booked', 'optional')),
    notes TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 6. ACCOMMODATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'hotel'
        CHECK (type IN ('hotel', 'hostel', 'resort', 'apartment', 'villa', 'other')),
    address TEXT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    booking_reference TEXT,
    booking_status TEXT NOT NULL DEFAULT 'not_booked'
        CHECK (booking_status IN ('not_booked', 'reserved', 'confirmed')),
    rating NUMERIC(3, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_stay_dates CHECK (check_out_date >= check_in_date)
);

-- ---------------------------------------------------------------------
-- 7. TRIP EXPENSES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    category TEXT NOT NULL 
        CHECK (category IN ('accommodation', 'flights', 'transport', 'activities', 'food', 'shopping', 'insurance', 'other')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    date DATE,
    paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 8. SAVED PLACES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT,
    address TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    rating NUMERIC(3, 2),
    notes TEXT,
    place_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 9. AGENT RUNS TABLE (Persistent AI Orchestrator Execution State)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    current_step TEXT NOT NULL DEFAULT 'initialized',
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    input_params JSONB NOT NULL,
    logs JSONB[] NOT NULL DEFAULT '{}',
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_trip_id ON public.trip_collaborators(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_user_id ON public.trip_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id ON public.trip_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON public.activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_day_id ON public.activities(trip_day_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_trip_id ON public.accommodations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON public.trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON public.saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_trip_id ON public.agent_runs(trip_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status);

-- ---------------------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger applications
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_trips_updated_at ON public.trips;
CREATE TRIGGER set_trips_updated_at BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_trip_days_updated_at ON public.trip_days;
CREATE TRIGGER set_trip_days_updated_at BEFORE UPDATE ON public.trip_days
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_activities_updated_at ON public.activities;
CREATE TRIGGER set_activities_updated_at BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_accommodations_updated_at ON public.accommodations;
CREATE TRIGGER set_accommodations_updated_at BEFORE UPDATE ON public.accommodations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_agent_runs_updated_at ON public.agent_runs;
CREATE TRIGGER set_agent_runs_updated_at BEFORE UPDATE ON public.agent_runs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------
-- RLS HELPER FUNCTIONS (Avoid Recursive Policy Lookups)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_trip_member(lookup_trip_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.trips WHERE id = lookup_trip_id AND user_id = lookup_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.trip_collaborators WHERE trip_id = lookup_trip_id AND user_id = lookup_user_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_trip_editor(lookup_trip_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.trips WHERE id = lookup_trip_id AND user_id = lookup_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.trip_collaborators 
        WHERE trip_id = lookup_trip_id AND user_id = lookup_user_id AND role IN ('owner', 'editor')
    );
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- RLS POLICIES
-- ---------------------------------------------------------------------

-- PROFILES
CREATE POLICY "Profiles are readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- TRIPS
CREATE POLICY "Users can read trips they own or collaborate on"
    ON public.trips FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_trip_member(id, auth.uid()));

CREATE POLICY "Users can create own trips"
    ON public.trips FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and editors can update trips"
    ON public.trips FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_trip_editor(id, auth.uid()))
    WITH CHECK (user_id = auth.uid() OR public.is_trip_editor(id, auth.uid()));

CREATE POLICY "Only trip owners can delete trips"
    ON public.trips FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- TRIP COLLABORATORS
CREATE POLICY "Trip members can read collaborators"
    ON public.trip_collaborators FOR SELECT
    TO authenticated
    USING (public.is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Only trip owner can manage collaborators"
    ON public.trip_collaborators FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.trips WHERE id = trip_collaborators.trip_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.trips WHERE id = trip_collaborators.trip_id AND user_id = auth.uid()));

-- TRIP DAYS
CREATE POLICY "Members can view trip days"
    ON public.trip_days FOR SELECT
    TO authenticated
    USING (public.is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Owners and editors can manage trip days"
    ON public.trip_days FOR ALL
    TO authenticated
    USING (public.is_trip_editor(trip_id, auth.uid()))
    WITH CHECK (public.is_trip_editor(trip_id, auth.uid()));

-- ACTIVITIES
CREATE POLICY "Members can view activities"
    ON public.activities FOR SELECT
    TO authenticated
    USING (public.is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Owners and editors can manage activities"
    ON public.activities FOR ALL
    TO authenticated
    USING (public.is_trip_editor(trip_id, auth.uid()))
    WITH CHECK (public.is_trip_editor(trip_id, auth.uid()));

-- ACCOMMODATIONS
CREATE POLICY "Members can view accommodations"
    ON public.accommodations FOR SELECT
    TO authenticated
    USING (public.is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Owners and editors can manage accommodations"
    ON public.accommodations FOR ALL
    TO authenticated
    USING (public.is_trip_editor(trip_id, auth.uid()))
    WITH CHECK (public.is_trip_editor(trip_id, auth.uid()));

-- TRIP EXPENSES
CREATE POLICY "Members can view expenses"
    ON public.trip_expenses FOR SELECT
    TO authenticated
    USING (public.is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Owners and editors can manage expenses"
    ON public.trip_expenses FOR ALL
    TO authenticated
    USING (public.is_trip_editor(trip_id, auth.uid()))
    WITH CHECK (public.is_trip_editor(trip_id, auth.uid()));

-- SAVED PLACES
CREATE POLICY "Users can manage own saved places"
    ON public.saved_places FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- AGENT RUNS
CREATE POLICY "Users can view own agent runs"
    ON public.agent_runs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own agent runs"
    ON public.agent_runs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own agent runs"
    ON public.agent_runs FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
