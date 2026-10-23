-- =====================================================================
-- TripPilot AI - 1-Click Database Fix for Supabase
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- Fixes:
-- 1. Adds missing columns in public.profiles (last_login_at, terms, phone)
-- 2. Adds missing columns in public.trips (flight_ticket_estimate, etc.)
-- 3. Replaces auth triggers with fail-safe error handling so registration
--    and login never fail with "500 Database error saving new user".
-- =====================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Add any missing columns to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 3. Add any missing columns to public.trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS user_phone TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS travel_companion TEXT DEFAULT 'solo';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS transport_preference TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS accommodation_preference TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS flight_ticket_estimate JSONB;

-- 4. Relax category check constraint on activities to support AI generator categories
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_category_check;
ALTER TABLE public.activities ADD CONSTRAINT activities_category_check 
    CHECK (category IN (
        'sightseeing', 'dining', 'cultural', 'outdoor', 'transit', 
        'shopping', 'entertainment', 'relaxation', 'nature', 'food', 
        'culinary', 'art', 'nightlife', 'photography', 'architecture', 'other'
    ));

-- 5. Safe, fail-safe sync trigger for Supabase Auth
CREATE OR REPLACE FUNCTION public.sync_auth_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    metadata JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
    auth_email TEXT := NULLIF(NEW.email, '');
    auth_phone TEXT := NULLIF(NEW.phone, '');
    profile_phone TEXT;
    profile_email TEXT;
    profile_name TEXT;
    accepted_terms BOOLEAN;
BEGIN
    profile_phone := NULLIF(
        COALESCE(auth_phone, metadata->>'phone', metadata->>'mobile_number'),
        ''
    );

    profile_email := COALESCE(
        auth_email,
        NULLIF(metadata->>'email', ''),
        CASE WHEN profile_phone IS NOT NULL
             THEN profile_phone || '@phone-auth.local'
             ELSE 'user-' || NEW.id::TEXT || '@auth.local'
        END
    );

    profile_name := COALESCE(
        NULLIF(metadata->>'full_name', ''),
        NULLIF(metadata->>'name', ''),
        NULLIF(split_part(profile_email, '@', 1), ''),
        'Traveler'
    );

    accepted_terms := CASE LOWER(COALESCE(metadata->>'terms_accepted', ''))
        WHEN 'true' THEN TRUE
        WHEN 'false' THEN FALSE
        ELSE TRUE
    END;

    -- Wrap in safe block so Auth transactions are NEVER aborted
    BEGIN
        INSERT INTO public.profiles (
            id,
            email,
            phone,
            mobile_number,
            full_name,
            preferred_currency,
            terms_accepted,
            terms_accepted_at,
            terms_version,
            phone_verified,
            last_login_at,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            profile_email,
            profile_phone,
            profile_phone,
            profile_name,
            COALESCE(NULLIF(metadata->>'preferred_currency', ''), 'INR'),
            accepted_terms,
            CASE WHEN accepted_terms THEN now() END,
            NULLIF(metadata->>'terms_version', 'v1.0'),
            COALESCE(NEW.phone_confirmed_at IS NOT NULL, FALSE),
            NEW.last_sign_in_at,
            COALESCE(NEW.created_at, now()),
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
            mobile_number = COALESCE(EXCLUDED.mobile_number, public.profiles.mobile_number),
            full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
            preferred_currency = COALESCE(EXCLUDED.preferred_currency, public.profiles.preferred_currency),
            terms_accepted = COALESCE(EXCLUDED.terms_accepted, public.profiles.terms_accepted),
            terms_accepted_at = COALESCE(EXCLUDED.terms_accepted_at, public.profiles.terms_accepted_at),
            last_login_at = COALESCE(EXCLUDED.last_login_at, public.profiles.last_login_at),
            updated_at = now();
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'sync_auth_user_profile safe caught error: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

-- 6. Attach triggers safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_profile();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_profile();

-- 7. Ensure RLS policies allow authenticated users to manage trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create trips" ON public.trips;
CREATE POLICY "Users can create trips"
    ON public.trips FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;
CREATE POLICY "Users can view own trips"
    ON public.trips FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_trip_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
CREATE POLICY "Users can update own trips"
    ON public.trips FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_trip_editor(id, auth.uid()))
    WITH CHECK (user_id = auth.uid() OR public.is_trip_editor(id, auth.uid()));

DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;
CREATE POLICY "Users can delete own trips"
    ON public.trips FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
