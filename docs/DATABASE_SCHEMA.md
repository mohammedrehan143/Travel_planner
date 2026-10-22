# TripPilot AI - Database Schema & Architecture Specification

> **Database Engine**: PostgreSQL 15+ (Supabase)  
> **Schema Migration**: [`supabase/migrations/20261022000000_init_schema.sql`](file:///D:/skills_lab/Travel_planner/supabase/migrations/20261022000000_init_schema.sql)  
> **Seed Data**: [`supabase/seed.sql`](file:///D:/skills_lab/Travel_planner/supabase/seed.sql)  
> **TypeScript Definitions**: [`backend/src/types/database.types.ts`](file:///D:/skills_lab/Travel_planner/backend/src/types/database.types.ts)  

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    auth_users ||--|| profiles : "has profile"
    auth_users ||--o{ trips : "owns"
    auth_users ||--o{ trip_collaborators : "collaborates"
    auth_users ||--o{ saved_places : "saves"
    auth_users ||--o{ agent_runs : "triggers"
    
    trips ||--o{ trip_collaborators : "has collaborators"
    trips ||--o{ trip_days : "contains days"
    trips ||--o{ activities : "contains activities"
    trips ||--o{ accommodations : "has lodging"
    trips ||--o{ trip_expenses : "incurs expenses"
    trips ||--o{ agent_runs : "generates run"
    trips ||--o{ saved_places : "bookmarks"

    trip_days ||--o{ activities : "schedules"

    profiles {
        uuid id PK
        text email
        text full_name
        text avatar_url
        text preferred_currency
        timestamptz created_at
        timestamptz updated_at
    }

    trips {
        uuid id PK
        uuid user_id FK
        text title
        text description
        text origin
        text destination
        date start_date
        date end_date
        integer duration_days
        integer traveler_count
        text travel_style
        text[] interests
        numeric total_budget
        text currency
        text status
        text cover_image_url
        numeric destination_lat
        numeric destination_lng
        timestamptz created_at
        timestamptz updated_at
    }

    trip_collaborators {
        uuid id PK
        uuid trip_id FK
        uuid user_id FK
        text role
        text invited_email
        timestamptz created_at
    }

    trip_days {
        uuid id PK
        uuid trip_id FK
        integer day_number
        date date
        text theme
        text summary
        jsonb weather_summary
        timestamptz created_at
        timestamptz updated_at
    }

    activities {
        uuid id PK
        uuid trip_id FK
        uuid trip_day_id FK
        text title
        text description
        text category
        time start_time
        time end_time
        integer duration_minutes
        text location_name
        text location_address
        numeric latitude
        numeric longitude
        numeric estimated_cost
        text currency
        boolean booking_required
        text booking_url
        text booking_status
        text notes
        integer order_index
        timestamptz created_at
        timestamptz updated_at
    }

    accommodations {
        uuid id PK
        uuid trip_id FK
        text name
        text type
        text address
        date check_in_date
        date check_out_date
        numeric total_price
        text currency
        numeric latitude
        numeric longitude
        text booking_reference
        text booking_status
        numeric rating
        timestamptz created_at
        timestamptz updated_at
    }

    trip_expenses {
        uuid id PK
        uuid trip_id FK
        text category
        numeric amount
        text currency
        text description
        date date
        uuid paid_by FK
        timestamptz created_at
    }

    saved_places {
        uuid id PK
        uuid user_id FK
        uuid trip_id FK
        text name
        text category
        text address
        numeric latitude
        numeric longitude
        numeric rating
        text notes
        text place_id
        timestamptz created_at
    }

    agent_runs {
        uuid id PK
        uuid trip_id FK
        uuid user_id FK
        text status
        text current_step
        integer progress_percent
        jsonb input_params
        jsonb[] logs
        jsonb result
        text error_message
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 2. Table Specifications & Constraints

### 2.1 `profiles`
Links 1:1 with Supabase Auth `auth.users`.
- `id` (UUID, Primary Key, Foreign Key to `auth.users(id) ON DELETE CASCADE`)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT, NULL)
- `avatar_url` (TEXT, NULL)
- `preferred_currency` (TEXT, DEFAULT `'USD'`)
- `created_at`, `updated_at` (TIMESTAMPTZ, DEFAULT `now()`)

### 2.2 `trips`
Top-level itinerary metadata and user planning preferences.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `user_id` (UUID, FK `auth.users(id) ON DELETE CASCADE`)
- `title` (TEXT, NOT NULL)
- `origin`, `destination` (TEXT, NOT NULL)
- `start_date`, `end_date` (DATE, NOT NULL, CHECK `end_date >= start_date`)
- `duration_days` (INTEGER, CHECK `duration_days > 0`)
- `traveler_count` (INTEGER, CHECK `traveler_count > 0`, DEFAULT `1`)
- `travel_style` (TEXT, CHECK `IN ('budget', 'backpacking', 'balanced', 'cultural', 'luxury', 'adventure', 'relaxed')`)
- `interests` (TEXT[], DEFAULT `'{}'`)
- `total_budget` (NUMERIC(12, 2), CHECK `total_budget >= 0`)
- `currency` (TEXT, DEFAULT `'USD'`)
- `status` (TEXT, CHECK `IN ('draft', 'planning', 'confirmed', 'completed', 'cancelled')`)
- `destination_lat`, `destination_lng` (NUMERIC(10, 7))

### 2.3 `trip_collaborators`
Manages multi-user trip sharing and role permissions.
- `role`: `'owner'`, `'editor'`, or `'viewer'`.
- Unique constraint on `(trip_id, user_id)`.

### 2.4 `trip_days`
Represents individual calendar days within a trip.
- `day_number` (INTEGER, CHECK `day_number > 0`)
- `weather_summary` (JSONB) - Holds temperature max/min, rain probability, and weather condition string.
- Unique constraint on `(trip_id, day_number)`.

### 2.5 `activities`
Scheduled activities, attractions, landmarks, and meals for each day.
- `category`: `'sightseeing'`, `'dining'`, `'cultural'`, `'outdoor'`, `'transit'`, `'shopping'`, `'entertainment'`, `'relaxation'`.
- `start_time`, `end_time` (TIME, HH:MM).
- `duration_minutes` (INTEGER, CHECK `duration_minutes > 0`).
- `estimated_cost` (NUMERIC(10, 2), CHECK `>= 0`).
- `order_index` (INTEGER, DEFAULT 0).

### 2.6 `accommodations`
Hotel, hostel, resort, or apartment lodging details.
- `type`: `'hotel'`, `'hostel'`, `'resort'`, `'apartment'`, `'villa'`, `'other'`.
- `booking_status`: `'not_booked'`, `'reserved'`, `'confirmed'`.
- Enforces `check_out_date >= check_in_date`.

### 2.7 `trip_expenses`
Real-time budget tracker items.
- `category`: `'accommodation'`, `'flights'`, `'transport'`, `'activities'`, `'food'`, `'shopping'`, `'insurance'`, `'other'`.
- `amount` (NUMERIC(10, 2), CHECK `>= 0`).

### 2.8 `agent_runs`
Stores the execution lifecycle of autonomous agent runs for real-time frontend status polling.
- `status`: `'pending'`, `'running'`, `'completed'`, `'failed'`, `'cancelled'`.
- `progress_percent`: `0` to `100`.
- `current_step`: E.g. `'interpret'`, `'research'`, `'estimate_budget'`, `'generate_itinerary'`, `'validate'`, `'save'`, `'completed'`.
- `logs`: Array of JSON step logs with timestamps, tool names, and outputs.

---

## 3. Row Level Security (RLS) Matrix

RLS is enabled on **all 9 tables**. PostgreSQL enforces access controls at the database level:

| Table | Operation | Permission Rule |
|---|---|---|
| `profiles` | SELECT | Any authenticated user |
| `profiles` | INSERT / UPDATE | Only the owning user (`auth.uid() = id`) |
| `trips` | SELECT | Owner (`user_id = auth.uid()`) OR Collaborator (`is_trip_member`) |
| `trips` | INSERT | Authenticated user (`user_id = auth.uid()`) |
| `trips` | UPDATE | Owner OR Editor (`is_trip_editor`) |
| `trips` | DELETE | Owner only (`user_id = auth.uid()`) |
| `trip_days` | SELECT / ALL | Viewers can read; Editors and Owners can modify |
| `activities` | SELECT / ALL | Viewers can read; Editors and Owners can modify |
| `accommodations` | SELECT / ALL | Viewers can read; Editors and Owners can modify |
| `trip_expenses` | SELECT / ALL | Viewers can read; Editors and Owners can modify |
| `saved_places` | ALL | User owns record (`user_id = auth.uid()`) |
| `agent_runs` | ALL | User initiated run (`user_id = auth.uid()`) |

### Security Definer Helper Functions:
To eliminate infinite recursion loops during collaborator checks, two security-definer functions operate with elevated search paths:
- `is_trip_member(trip_id UUID, user_id UUID) -> BOOLEAN`
- `is_trip_editor(trip_id UUID, user_id UUID) -> BOOLEAN`
