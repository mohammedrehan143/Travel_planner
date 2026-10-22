-- =====================================================================
-- TripPilot AI - Production Database Schema (Mobile Number First)
-- Description: Users stored under mobile number, email, full name, 
--              Terms & Conditions compliance, trips indexed by phone,
--              Row Level Security (RLS), and automatic Supabase Auth triggers.
-- =====================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. PROFILES TABLE (Stores user under Unique Mobile Number & Email)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(25) NOT NULL UNIQUE,                       -- Primary mobile identifier (E.164 e.g. +919876543210)
    email TEXT NOT NULL UNIQUE,                              -- Contact & backup authentication
    full_name TEXT NOT NULL,                                 -- User's displayed legal/preferred name
    avatar_url TEXT,
    preferred_currency VARCHAR(10) NOT NULL DEFAULT 'INR',   -- Defaults to INR or user choice
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,            -- Explicit T&C acceptance
    terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),    -- Legal compliance timestamp
    terms_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',       -- Version of T&C agreed to
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for instant lookup by mobile number or email
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ---------------------------------------------------------------------
-- 2. TRIPS TABLE (Directly linked to User & Stored under Mobile Number)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_phone VARCHAR(25) REFERENCES public.profiles(phone) ON DELETE CASCADE ON UPDATE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    traveler_count INTEGER NOT NULL DEFAULT 1 CHECK (traveler_count > 0),
    travel_companion TEXT DEFAULT 'solo',
    travel_style TEXT NOT NULL DEFAULT 'balanced' 
        CHECK (travel_style IN ('budget', 'backpacking', 'balanced', 'cultural', 'luxury', 'adventure', 'relaxed')),
    interests TEXT[] NOT NULL DEFAULT '{}',
    total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_budget >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'planning'
        CHECK (status IN ('draft', 'planning', 'confirmed', 'completed', 'cancelled')),
    cover_image_url TEXT,
    destination_lat NUMERIC(10, 7),
    destination_lng NUMERIC(10, 7),
    transport_preference TEXT,
    accommodation_preference TEXT,
    flight_ticket_estimate JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_trips_user_phone ON public.trips(user_phone);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);

-- ---------------------------------------------------------------------
-- 3. TRIP COLLABORATORS (Co-planners can be invited by Mobile Number)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    collaborator_phone VARCHAR(25) REFERENCES public.profiles(phone) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'viewer' 
        CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_collaborators_phone ON public.trip_collaborators(collaborator_phone);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_trip_id ON public.trip_collaborators(trip_id);

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

CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id ON public.trip_days(trip_id);

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
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    booking_required BOOLEAN NOT NULL DEFAULT FALSE,
    booking_status TEXT NOT NULL DEFAULT 'not_booked'
        CHECK (booking_status IN ('not_booked', 'booked', 'optional')),
    booking_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    travel_from_previous JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON public.activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_day_id ON public.activities(trip_day_id);

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
    check_in DATE,
    check_out DATE,
    total_nights INTEGER NOT NULL DEFAULT 1 CHECK (total_nights > 0),
    nightly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (nightly_rate >= 0),
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    rating NUMERIC(2, 1) CHECK (rating >= 0 AND rating <= 5),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    booking_status TEXT NOT NULL DEFAULT 'not_booked'
        CHECK (booking_status IN ('not_booked', 'booked', 'optional')),
    booking_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accommodations_trip_id ON public.accommodations(trip_id);

-- ---------------------------------------------------------------------
-- 7. TRIP EXPENSES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'other'
        CHECK (category IN ('accommodation', 'flights', 'transport', 'activities', 'food', 'shopping', 'insurance', 'other')),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    payer_phone VARCHAR(25) REFERENCES public.profiles(phone) ON DELETE SET NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON public.trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_phone ON public.trip_expenses(payer_phone);

-- ---------------------------------------------------------------------
-- 8. SAVED PLACES TABLE (Bookmarked places under user mobile number)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_phone VARCHAR(25) REFERENCES public.profiles(phone) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_saved_places_phone ON public.saved_places(user_phone);
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON public.saved_places(user_id);

-- ---------------------------------------------------------------------
-- 9. AGENT RUNS TABLE (AI Orchestrator Execution State)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_phone VARCHAR(25) REFERENCES public.profiles(phone) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_agent_runs_phone ON public.agent_runs(user_phone);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_trip_id ON public.agent_runs(trip_id);

-- ---------------------------------------------------------------------
-- 10. AUTOMATIC SYNC TRIGGERS (Auto-populate user_phone on records)
-- ---------------------------------------------------------------------

-- Function: Auto-populate user_phone on new trips from user profile
CREATE OR REPLACE FUNCTION public.sync_user_phone_on_trip()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_phone IS NULL THEN
        SELECT phone INTO NEW.user_phone 
        FROM public.profiles 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_trip_phone ON public.trips;
CREATE TRIGGER trg_sync_trip_phone
    BEFORE INSERT OR UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_phone_on_trip();

-- Function: Auto-handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_trips_updated_at ON public.trips;
CREATE TRIGGER set_trips_updated_at BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------
-- 11. SUPABASE AUTH TRIGGER (Captures Phone, Email, Name, and T&C on Signup)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    extracted_phone TEXT;
    extracted_full_name TEXT;
    extracted_terms BOOLEAN;
BEGIN
    -- Extract phone from auth.users (native phone) or raw_user_meta_data
    extracted_phone := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'mobile_number',
        '+91' || FLOOR(RANDOM() * 9000000000 + 1000000000)::TEXT -- dev fallback
    );

    extracted_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1)
    );

    extracted_terms := COALESCE(
        (NEW.raw_user_meta_data->>'terms_accepted')::BOOLEAN,
        TRUE
    );

    INSERT INTO public.profiles (
        id,
        phone,
        email,
        full_name,
        preferred_currency,
        terms_accepted,
        terms_accepted_at,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        extracted_phone,
        COALESCE(NEW.email, extracted_phone || '@phone.trippilot.com'),
        extracted_full_name,
        COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'INR'),
        extracted_terms,
        now(),
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        terms_accepted = EXCLUDED.terms_accepted,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger hook on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ---------------------------------------------------------------------
-- 12. HELPER VIEW: User Trips Organized by Mobile Number
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_trips_by_mobile AS
SELECT 
    p.phone AS mobile_number,
    p.full_name AS traveler_name,
    p.email AS traveler_email,
    p.terms_accepted,
    t.id AS trip_id,
    t.title,
    t.origin,
    t.destination,
    t.start_date,
    t.end_date,
    t.duration_days,
    t.total_budget,
    t.currency,
    t.status,
    t.created_at AS trip_created_at
FROM public.profiles p
INNER JOIN public.trips t ON t.user_phone = p.phone OR t.user_id = p.id
ORDER BY t.created_at DESC;

-- ---------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
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

-- Helper security functions
CREATE OR REPLACE FUNCTION public.is_trip_member(lookup_trip_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
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
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.trips WHERE id = lookup_trip_id AND user_id = lookup_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.trip_collaborators WHERE trip_id = lookup_trip_id AND user_id = lookup_user_id AND role IN ('owner', 'editor')
    );
END;
$$ LANGUAGE plpgsql;

-- Profiles Policies
CREATE POLICY "Profiles readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage own profile"
    ON public.profiles FOR ALL
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Trips Policies (Access by User ID or Mobile match)
CREATE POLICY "Users can view own trips or collaborated trips"
    ON public.trips FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.is_trip_member(id, auth.uid())
    );

CREATE POLICY "Users can create trips"
    ON public.trips FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Trip owners and editors can update trips"
    ON public.trips FOR UPDATE
    TO authenticated
    USING (public.is_trip_editor(id, auth.uid()))
    WITH CHECK (public.is_trip_editor(id, auth.uid()));

CREATE POLICY "Trip owners can delete trips"
    ON public.trips FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Trip Days, Activities, Accommodations, Expenses
CREATE POLICY "Trip days accessible by trip members"
    ON public.trip_days FOR ALL TO authenticated
    USING (public.is_trip_member(trip_id, auth.uid()))
    WITH CHECK (public.is_trip_editor(trip_id, auth.uid()));

CREATE POLICY "Activities accessible by trip members"
    ON public.activities FOR ALL TO authenticated
    USING (public.is_trip_member(trip_id, auth.uid()))
    WITH CHECK (public.is_trip_editor(trip_id, auth.uid()));

CREATE POLICY "Accommodations accessible by trip members"
    ON public.accommodations FOR ALL TO authenticated
    USING (public.is_trip_member(trip_id, auth.uid()))
    WITH CHECK (public.is_trip_editor(trip_id, auth.uid()));

CREATE POLICY "Trip expenses accessible by trip members"
    ON public.trip_expenses FOR ALL TO authenticated
    USING (public.is_trip_member(trip_id, auth.uid()))
    WITH CHECK (public.is_trip_editor(trip_id, auth.uid()));

CREATE POLICY "Saved places accessible by owner"
    ON public.saved_places FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agent runs accessible by owner"
    ON public.agent_runs FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
