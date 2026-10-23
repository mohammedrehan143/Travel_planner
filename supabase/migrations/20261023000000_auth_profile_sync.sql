-- =====================================================================
-- TripPilot AI - Supabase Auth/Profile Synchronization
--
-- Supabase Auth owns credentials in auth.users. This migration mirrors
-- non-secret account metadata into public.profiles and records the latest
-- successful sign-in time. Passwords, password hashes, access tokens, and
-- refresh tokens must never be copied into public tables.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Profile metadata used by the application
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS mobile_number TEXT,
    ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS terms_version TEXT,
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- ---------------------------------------------------------------------
-- 2. Keep one safe profile row for every Supabase Auth user
-- ---------------------------------------------------------------------
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

    -- profiles.email is required by the existing schema. Phone-only users get
    -- a non-contact placeholder; the real phone remains in phone/mobile_number.
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
        ELSE FALSE
    END;

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
        NULLIF(metadata->>'terms_version', ''),
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
        terms_accepted = CASE
            WHEN metadata ? 'terms_accepted' THEN EXCLUDED.terms_accepted
            ELSE public.profiles.terms_accepted
        END,
        terms_accepted_at = COALESCE(EXCLUDED.terms_accepted_at, public.profiles.terms_accepted_at),
        terms_version = COALESCE(EXCLUDED.terms_version, public.profiles.terms_version),
        phone_verified = CASE
            WHEN auth_phone IS NOT NULL THEN EXCLUDED.phone_verified
            ELSE public.profiles.phone_verified
        END,
        last_login_at = COALESCE(EXCLUDED.last_login_at, public.profiles.last_login_at),
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_profile();

-- Supabase updates auth.users.last_sign_in_at after a successful login. This
-- keeps the latest login timestamp available to backend/admin queries without
-- exposing auth.users or any credential material to the browser.
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE OF email, phone, raw_user_meta_data, last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_profile();

-- Backfill profiles for users created before this migration was installed.
INSERT INTO public.profiles (id, email, phone, mobile_number, full_name, preferred_currency, created_at, updated_at)
SELECT
    u.id,
    COALESCE(NULLIF(u.email, ''), NULLIF(u.phone, '') || '@phone-auth.local', 'user-' || u.id::TEXT || '@auth.local'),
    NULLIF(u.phone, ''),
    NULLIF(u.phone, ''),
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''), 'Traveler'),
    COALESCE(NULLIF(u.raw_user_meta_data->>'preferred_currency', ''), 'INR'),
    COALESCE(u.created_at, now()),
    now()
FROM auth.users AS u
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    mobile_number = COALESCE(EXCLUDED.mobile_number, public.profiles.mobile_number),
    updated_at = now();

-- ---------------------------------------------------------------------
-- 3. Keep profiles private to the owning user
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
