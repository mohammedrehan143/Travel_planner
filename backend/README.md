# TripPilot AI - Backend & Agentic Service

> **Role**: Person 2 - Backend and Agentic AI Lead  
> **Service**: Node.js + TypeScript + Express + Supabase + Tool-Calling AI Agent  

---

## 🌟 Highlights

- **Supabase Database**: Full PostgreSQL schema for 9 tables (`profiles`, `trips`, `trip_days`, `activities`, `accommodations`, `trip_expenses`, `trip_collaborators`, `agent_runs`, `saved_places`), with foreign keys, checks, indexes, update triggers, and Row Level Security (RLS) policies.
- **Real Tool-Using AI Agent**: 10-step autonomous planning workflow executing 10 tools (`search_places`, `get_place_details`, `get_weather_forecast`, `calculate_route`, `check_opening_hours`, `estimate_trip_budget`, `generate_itinerary`, `validate_itinerary`, `update_trip`, `save_trip`).
- **Persistent Agent Runs**: Tracks progress percentage and real-time execution logs in the `agent_runs` table so the frontend can display live progress.
- **Validation Engine**: Automated operational checks for venue opening hours, time overlaps, transit buffer feasibility, daily pacing, and budget limits.
- **External Adapters**: High-fidelity integrations for Places (Google/OSM), Weather (Open-Meteo live global forecast), Routes (OSRM & Haversine), Currency (Frankfurter live ECB rates), and Lodging.
- **Production Hardened**: Zod schema validation, Helmet security headers, CORS origin protection, rate limiting, and RFC-7807 error formatting.
- **End-to-End Tested**: 33 automated Vitest tests covering all tools, adapters, validation logic, planning orchestrator, and REST endpoints.

---

## 🚀 Quickstart

### 1. Prerequisites
- Node.js >= 18 (Tested on v24.14.0)
- npm >= 9

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `PORT=5000`
- `SUPABASE_URL`: Your Supabase project URL (defaults to `http://localhost:54321` in dev)
- `SUPABASE_ANON_KEY`: Frontend / public key
- `SUPABASE_SERVICE_ROLE_KEY`: Backend secret key (never exposed to frontend)
- `OPENAI_API_KEY`: Optional; if omitted, the deterministic fallback agent executes all tools and generates realistic itineraries.
- `OPENAI_MODEL`: Defaults to `gpt-4o` (or configurable for Gemini OpenAI endpoint)

### 4. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

### 5. Run Automated Tests
```bash
npm test
```

### 6. Build for Production
```bash
npm run build
npm start
```

---

## 🗄️ Database Setup (Supabase)

Migrations and seed data are located in `supabase/`:
- `supabase/migrations/20261022000000_init_schema.sql`: Core schema, constraints, indexes, triggers, and RLS policies.
- `supabase/seed.sql`: Rich development seed data for Tokyo and Paris trips, days, activities, expenses, accommodations, and completed agent runs.

### Apply via Supabase CLI:
```bash
# From project root:
supabase db reset
```

---

## 📑 API Contract for Person 1 (Frontend)

Refer to [`docs/API_CONTRACT.md`](file:///D:/skills_lab/Travel_planner/docs/API_CONTRACT.md) for full endpoint specifications, request/response JSON schemas, and test user headers.

---

## 🧪 Test Coverage Summary

- `tests/tools.test.ts`: Verifies all 10 callable tools execute properly.
- `tests/validator.test.ts`: Tests schedule overlap detection, opening hour checks, budget overrun alerts, and pacing warnings.
- `tests/adapters.test.ts`: Tests external APIs (Open-Meteo weather, OSRM routes, Frankfurter currency, Places).
- `tests/orchestrator.test.ts`: Tests the 10-step autonomous planning workflow, persistent step logs, natural-language modifications, and single-day regeneration.
- `tests/api.test.ts`: Comprehensive Supertest validation of all REST endpoints, query parameters, and Zod 400 error handling.
