# TripPilot AI - Automated Testing & Verification Guide

> **Testing Framework**: [Vitest](https://vitest.dev/) (v3.2.7) + Supertest  
> **Test Directory**: [`backend/tests/`](file:///D:/skills_lab/Travel_planner/backend/tests/)  
> **Status**: **35 / 35 Tests Passing (100%)**  

---

## 1. Running the Tests

From the `backend/` directory:

```bash
# Run all tests once
npm test

# Run tests in interactive watch mode
npm run test:watch

# Run tests with coverage reporting
npm run test:coverage
```

---

## 2. Test Suites Overview

### 1. `tests/tools.test.ts` (9 tests)
Verifies each of the 10 core callable tools in isolation:
- `search_places`: Attraction and restaurant search with category filters.
- `get_place_details`: Hours, ratings, costs, and addresses.
- `get_weather_forecast`: Multi-day weather forecasts.
- `calculate_route`: Distance (km) and travel duration (minutes).
- `check_opening_hours`: Opening schedule checks.
- `estimate_trip_budget`: Category budget allocation and deficit/surplus checks.
- `generate_itinerary`: Full multi-day schedule synthesis.
- `validate_itinerary`: Operational constraint checking.
- `update_trip` & `save_trip`: In-database updates and persistence.

### 2. `tests/validator.test.ts` (4 tests)
Audits the algorithmic validation engine:
- Passes well-formed itineraries with realistic pacing.
- Catches time overlaps between consecutive activities.
- Flags warnings when estimated costs exceed user budget.
- Flags warnings when individual days are overcrowded (> 6 activities).

### 3. `tests/adapters.test.ts` (5 tests)
Validates all external integrations:
- `PlacesAdapter`: Coordinates resolution and place lookups.
- `WeatherAdapter`: Open-Meteo live API integration and seasonal fallback.
- `RoutesAdapter`: Distance, travel speed, and transit mode calculation.
- `CurrencyAdapter`: Frankfurter live ECB exchange rates and conversion precision.
- `AccommodationAdapter`: Lodging suggestions with proper `not_booked` status.

### 4. `tests/orchestrator.test.ts` (3 tests)
Tests the end-to-end autonomous agent workflow:
- Full 10-step planning cycle from request to validated itinerary and persistent run state.
- Natural-language itinerary modifications (`modifyItinerary`).
- Single-day regeneration with custom pacing (`regenerateDay`).

### 5. `tests/api.test.ts` (12 tests)
Supertest REST API gateway validation:
- `GET /health`: Health and readiness reporting.
- `POST /api/trips/plan`: Synchronous plan generation.
- `POST /api/trips/plan`: Input validation errors (e.g., `endDate` before `startDate`).
- `POST /api/trips/plan`: Asynchronous background runs (`202 Accepted` + polling).
- `GET /api/agent-runs/:id`: Real-time progress and logs retrieval.
- `GET /api/trips` & `GET /api/trips/:id`: User trips and full details.
- `POST /api/trips/:id/modify`: Natural-language modifications.
- `POST /api/trips/:id/days/:dayNumber/regenerate`: Day regeneration.
- `POST /api/trips/:id/validate`: Revalidation.
- `GET /api/integrations/places/search`, `weather`, and `routes/calculate`.

### 6. `tests/gemini.test.ts` (2 tests)
Verifies Google Gemini provider auto-detection, model selection, and graceful fallback when credentials are unconfigured.

---

## 3. Sample Passing Output

```text
 ✓ tests/validator.test.ts (4 tests)
 ✓ tests/gemini.test.ts (2 tests)
 ✓ tests/tools.test.ts (9 tests)
 ✓ tests/orchestrator.test.ts (3 tests)
 ✓ tests/adapters.test.ts (5 tests)
 ✓ tests/api.test.ts (12 tests)

Test Files  6 passed (6)
Tests       35 passed (35)
Duration    4.99s
```
