# TripPilot AI Architecture & Agent Design

## Overview
TripPilot AI's backend is structured around a real, tool-calling Agentic AI Orchestrator that plans, validates, revises, and persists travel itineraries.

```
                      +---------------------------------------+
                      |       Frontend Client (Person 1)      |
                      +---------------------------------------+
                                          |
                                    HTTP / REST
                                          v
                      +---------------------------------------+
                      |         Express REST API Gateway      |
                      |  (Zod Validation, Rate Limits, Auth)  |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       Agentic AI Orchestrator         |
                      |       (10-Step Execution Loop)        |
                      +---------------------------------------+
                                  |               |
               +------------------+               +------------------+
               | Tool Calls                                          | Persistence
               v                                                     v
+-------------------------------+                             +----------------------+
|        Tool Registry          |                             |   Supabase Postgres  |
| 1. search_places              |                             | - profiles           |
| 2. get_place_details          |                             | - trips              |
| 3. get_weather_forecast       |                             | - trip_days          |
| 4. calculate_route            |                             | - activities         |
| 5. check_opening_hours        |                             | - accommodations     |
| 6. estimate_trip_budget       |                             | - trip_expenses      |
| 7. generate_itinerary         |                             | - trip_collaborators |
| 8. validate_itinerary         |                             | - agent_runs         |
| 9. update_trip                |                             | - saved_places       |
| 10. save_trip                 |                             +----------------------+
+-------------------------------+
       |       |        |
       v       v        v
+------------------------------------+
|        External Adapters           |
| - Places (Google / OSM Nominatim)  |
| - Weather (Open-Meteo live)        |
| - Routing (OSRM & Haversine)       |
| - Currency (Frankfurter ECB live)  |
| - Lodging & Accommodation          |
+------------------------------------+
```

## Security Model
1. **Secrets Isolation**: External API keys (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MAPS_API_KEY`) reside exclusively in server environment variables.
2. **Row Level Security (RLS)**: Enforced in PostgreSQL via security definer membership functions (`is_trip_member`, `is_trip_editor`).
3. **Prompt Injection Guardrails**: User-submitted destination notes and modification requests are sanitized to strip script delimiters and tagged within strict `<USER_INPUT>` boundaries.
4. **Validation Pipeline**: No plan is returned or persisted without passing automated operational checks (opening hours, time overlaps, realistic transit buffers).
