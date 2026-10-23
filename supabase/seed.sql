-- =====================================================================
-- TripPilot AI Seed Data
-- Realistic development seed data for testing and frontend prototyping
-- =====================================================================

-- 1. SEED PROFILES
-- NOTE: In production Supabase, profiles link to auth.users. 
-- For local/dev testing, mock UUIDs are used.
INSERT INTO public.profiles (id, email, full_name, avatar_url, preferred_currency)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'demo-owner@example.invalid', NULL, NULL, 'USD'),
    ('00000000-0000-0000-0000-000000000002', 'demo-collaborator@example.invalid', NULL, NULL, 'USD')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 2. SEED TRIPS
INSERT INTO public.trips (
    id, user_id, title, description, origin, destination,
    start_date, end_date, duration_days, traveler_count, travel_style,
    interests, total_budget, currency, status, cover_image_url,
    destination_lat, destination_lng
)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Tokyo Cultural & Culinary Odyssey',
    'A 5-day journey through the historic shrines, neon-lit alleys, vibrant pop culture, and Michelin-starred dining of Tokyo.',
    'San Francisco, CA',
    'Tokyo, Japan',
    '2026-11-01',
    '2026-11-05',
    5,
    2,
    'balanced',
    ARRAY['culinary', 'cultural', 'photography', 'shopping'],
    3500.00,
    'USD',
    'planning',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
    35.6762,
    139.6503
),
(
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Parisian Art, Cafes & Architecture',
    'Immerse in the historic arrondissements, world-class art collections, and artisanal bakeries of Paris.',
    'New York, NY',
    'Paris, France',
    '2026-12-10',
    '2026-12-14',
    5,
    1,
    'cultural',
    ARRAY['art', 'history', 'culinary', 'architecture'],
    2800.00,
    'EUR',
    'confirmed',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    48.8566,
    2.3522
)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED TRIP COLLABORATORS
INSERT INTO public.trip_collaborators (id, trip_id, user_id, role, invited_email)
VALUES 
(
    '99999999-9999-9999-9999-999999999991',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000002',
    'editor',
    'demo-collaborator@example.invalid'
)
ON CONFLICT (trip_id, user_id) DO NOTHING;

-- 4. SEED TRIP DAYS (Tokyo)
INSERT INTO public.trip_days (id, trip_id, day_number, date, theme, summary, weather_summary)
VALUES 
(
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    1,
    '2026-11-01',
    'Historic Asakusa & Evening Neon of Akihabara',
    'Start in old-town Tokyo at Senso-ji Temple, stroll traditional craft streets, and finish exploring retro tech and pop culture in Akihabara.',
    '{"temp_c": 18, "condition": "Sunny", "icon": "sunny", "precipitation_prob": 5}'::jsonb
),
(
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111111',
    2,
    '2026-11-02',
    'Meiji Shrine Tranquility & Shibuya Crossing Energy',
    'Walk through the forested serene paths of Meiji Jingu, explore Harajuku fashion, and experience the iconic Shibuya scramble at sunset.',
    '{"temp_c": 17, "condition": "Partly Cloudy", "icon": "partly-cloudy", "precipitation_prob": 15}'::jsonb
),
(
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111111',
    3,
    '2026-11-03',
    'Toyosu Market Fresh Seafood & Ginza Elegance',
    'Morning tasting at Toyosu market, digital art wonder at teamLab Planets, and high-end architecture and tea houses in Ginza.',
    '{"temp_c": 19, "condition": "Clear", "icon": "clear", "precipitation_prob": 0}'::jsonb
)
ON CONFLICT (trip_id, day_number) DO NOTHING;

-- 5. SEED ACTIVITIES (Tokyo Day 1)
INSERT INTO public.activities (
    id, trip_id, trip_day_id, title, description, category,
    start_time, end_time, duration_minutes, location_name, location_address,
    latitude, longitude, estimated_cost, currency, booking_required,
    booking_url, booking_status, notes, order_index
)
VALUES
(
    '44444444-4444-4444-4444-444444444001',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333301',
    'Senso-ji Temple & Nakamise-dori Stroll',
    'Tokyo oldest Buddhist temple, entered through the iconic Kaminarimon Thunder Gate with traditional snack tasting along the market street.',
    'cultural',
    '09:00:00', '11:00:00', 120,
    'Senso-ji Temple', '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032',
    35.714765, 139.796655, 0.00, 'USD', false, NULL, 'not_booked',
    'Arrive early to avoid crowds. Try the ningyo-yaki doll cakes.', 1
),
(
    '44444444-4444-4444-4444-444444444002',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333301',
    'Tempura Daikokuya Lunch',
    'Historic dining spot founded in 1887 serving legendary tendon tempura bowls with savory sesame oil aroma.',
    'dining',
    '11:30:00', '12:45:00', 75,
    'Daikokuya Tempura', '1 Chome-38-10 Asakusa, Taito City, Tokyo 111-0032',
    35.712500, 139.795000, 25.00, 'USD', false, NULL, 'not_booked',
    'Cash or IC card preferred. Queue usually moves fast.', 2
),
(
    '44444444-4444-4444-4444-444444444003',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333301',
    'Tokyo Skytree Observation Deck',
    'Marvel at the 360-degree panoramic view of the greater Tokyo metropolis and Mount Fuji in the distance.',
    'sightseeing',
    '13:30:00', '15:30:00', 120,
    'Tokyo Skytree', '1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045',
    35.710063, 139.810700, 22.00, 'USD', true, 'https://www.tokyo-skytree.jp/en/', 'booked',
    'Fast-track ticket pre-booked for the Tembo Galleria level.', 3
),
(
    '44444444-4444-4444-4444-444444444004',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333301',
    'Akihabara Electric Town & Retro Arcades',
    'Dive into multi-floor arcades at Super Potato, gachapon halls, and neon-drenched electronics stores.',
    'entertainment',
    '16:30:00', '19:00:00', 150,
    'Akihabara Electric Town', 'Sotokanda, Chiyoda City, Tokyo 101-0021',
    35.698383, 139.771972, 15.00, 'USD', false, NULL, 'not_booked',
    'Great photo opportunities at dusk when neon lights illuminate.', 4
),
(
    '44444444-4444-4444-4444-444444444005',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333301',
    'Artisanal Tonkatsu Dinner at Marugo',
    'Renowned specialty tonkatsu pork cutlet served with finely shredded cabbage, rice, and miso soup.',
    'dining',
    '19:30:00', '21:00:00', 90,
    'Tonkatsu Marugo', '1 Chome-8-14 Sotokanda, Chiyoda City, Tokyo 101-0021',
    35.699722, 139.770833, 30.00, 'USD', false, NULL, 'not_booked',
    'Bib Gourmand recognized. Line up 15 mins before open.', 5
)
ON CONFLICT (id) DO NOTHING;

-- 6. SEED ACCOMMODATIONS
INSERT INTO public.accommodations (
    id, trip_id, name, type, address, check_in_date, check_out_date,
    total_price, currency, latitude, longitude, booking_reference,
    booking_status, rating
)
VALUES 
(
    '55555555-5555-5555-5555-555555555001',
    '11111111-1111-1111-1111-111111111111',
    'Hotel Gracery Shinjuku',
    'hotel',
    '1-19-1 Kabukicho, Shinjuku City, Tokyo 160-8466',
    '2026-11-01',
    '2026-11-05',
    780.00,
    'USD',
    35.695300,
    139.702200,
    'HG-TYO-882910',
    'confirmed',
    4.5
)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED EXPENSES
INSERT INTO public.trip_expenses (id, trip_id, category, amount, currency, description, date, paid_by)
VALUES 
(
    '66666666-6666-6666-6666-666666666001',
    '11111111-1111-1111-1111-111111111111',
    'accommodation',
    780.00,
    'USD',
    'Hotel Gracery Shinjuku 4 nights',
    '2026-11-01',
    '00000000-0000-0000-0000-000000000001'
),
(
    '66666666-6666-6666-6666-666666666002',
    '11111111-1111-1111-1111-111111111111',
    'activities',
    44.00,
    'USD',
    'Tokyo Skytree tickets for 2',
    '2026-11-01',
    '00000000-0000-0000-0000-000000000001'
),
(
    '66666666-6666-6666-6666-666666666003',
    '11111111-1111-1111-1111-111111111111',
    'food',
    55.00,
    'USD',
    'Lunch and snacks in Asakusa',
    '2026-11-01',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- 8. SEED SAVED PLACES
INSERT INTO public.saved_places (id, user_id, trip_id, name, category, address, latitude, longitude, rating, notes)
VALUES 
(
    '77777777-7777-7777-7777-777777777001',
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Fushimi Inari Taisha (Kyoto excursion option)',
    'cultural',
    '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto 612-0882',
    34.967140,
    135.772671,
    4.8,
    'Save for possible Shinkansen day trip if time permits.'
)
ON CONFLICT (id) DO NOTHING;

-- 9. SEED AGENT RUN
INSERT INTO public.agent_runs (
    id, trip_id, user_id, status, current_step, progress_percent,
    input_params, logs, result, error_message, started_at, completed_at
)
VALUES 
(
    '88888888-8888-8888-8888-888888888001',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'completed',
    'completed',
    100,
    '{"origin": "San Francisco, CA", "destination": "Tokyo, Japan", "duration_days": 5, "travel_style": "balanced", "budget": 3500}'::jsonb,
    ARRAY[
        '{"timestamp": "2026-10-22T08:00:00Z", "step": "interpret", "message": "Interpreted request for 5-day Tokyo trip with $3500 budget."}'::jsonb,
        '{"timestamp": "2026-10-22T08:00:02Z", "step": "research", "message": "Queried top attractions, weather patterns, and transport hubs."}'::jsonb,
        '{"timestamp": "2026-10-22T08:00:05Z", "step": "cluster", "message": "Geographically clustered Asakusa/Akihabara (East) and Shibuya/Shinjuku (West)."}'::jsonb,
        '{"timestamp": "2026-10-22T08:00:07Z", "step": "budget", "message": "Estimated accommodation at $195/night, food at $60/person/day, total under $3500."}'::jsonb,
        '{"timestamp": "2026-10-22T08:00:09Z", "step": "validate", "message": "Validated opening hours, walking routes, and resting buffers. Zero conflicts."}'::jsonb,
        '{"timestamp": "2026-10-22T08:00:10Z", "step": "persist", "message": "Saved 5 days, 18 activities, and budget estimates to database."}'::jsonb
    ],
    '{"status": "success", "days_planned": 5, "total_activities": 18, "estimated_total_cost": 2980.00}'::jsonb,
    NULL,
    now() - interval '10 minutes',
    now() - interval '9 minutes'
)
ON CONFLICT (id) DO NOTHING;
