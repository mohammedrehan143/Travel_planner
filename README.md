# Travel_planner
person 1 
You are Person 1, the Frontend Lead for TripPilot AI, an AI-powered travel planning platform.

Your responsibility is to build the complete frontend and integrate it with Supabase and the AI backend developed by Person 2.

### Tech stack
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion
- Supabase client
- React Router
- Recharts for budget visualizations

### Your tasks

1. Build a premium, responsive landing page with destination imagery, animations, feature sections, and clear calls to action.
2. Implement sign-up, login, logout, and protected routes using Supabase Auth.
3. Build a multi-step trip creation wizard that collects:
   - Starting city and destination
   - Travel dates
   - Number of travelers
   - Total budget and currency
   - Travel style and interests
   - Transport and accommodation preferences
4. Create a dashboard showing saved trips, upcoming trips, and recent activity.
5. Build an itinerary dashboard with daily schedules, activity cards, locations, timings, costs, and travel information.
6. Create a map interface displaying itinerary locations and routes.
7. Build a budget tracker with category-wise spending, total estimated costs, and charts.
8. Allow users to add, edit, remove, reorder, and regenerate activities.
9. Create a natural-language AI chat interface for modifying trips.
10. Add trip sharing, collaboration UI, packing checklists, and PDF export if time permits.
11. Implement loading skeletons, error states, empty states, toast notifications, and mobile responsiveness.

### Supabase integration

Use the shared Supabase project and the schema agreed upon by both developers.

Use the frontend publishable/anon key as appropriate for the project configuration. Never expose the service-role key or private AI API keys.

Implement database operations for:
- User profiles
- Trips
- Trip days
- Activities
- Saved places
- Trip expenses
- Collaborators

Respect Supabase Row Level Security. Do not bypass database permissions.

### AI integration contract

Coordinate with Person 2 before implementing API calls. Use the agreed backend endpoints rather than calling the AI provider directly from the browser.

Expected operations:
- Generate an itinerary
- Retrieve planning progress
- Modify an itinerary
- Regenerate a day
- Validate a trip
- Save and retrieve trip information

Create a typed API client so the frontend remains independent of backend implementation details.

### Shared development rules

- Work only on frontend files and agreed integration files.
- Do not overwrite Person 2's backend implementation.
- Do not invent API endpoints; agree on request and response schemas first.
- Use reusable components and a clean folder structure.
- No dead buttons, fake data presented as live data, or hardcoded API secrets.
- Make the UI usable with seeded development data while backend integration is in progress.
- Test authentication, trip creation, itinerary editing, and persistence.

### Deliverables

Provide a fully working frontend, `.env.example`, responsive layouts, typed API integration, and instructions to run the application locally.

Start by inspecting the existing repository and coordinating the shared interfaces with Person 2. Implement the frontend phase by phase and fix build errors before finishing.


<!-- person 2 -->
You are Person 2, the Backend and Agentic AI Lead for TripPilot AI.

Your responsibility is to build the backend, Supabase database, real tool-using AI travel agent, travel information integrations, and validation logic. Coordinate with Person 1 so the frontend can integrate without conflicts.

### Tech stack
- Supabase PostgreSQL
- Supabase Auth
- Supabase Edge Functions or a secure TypeScript backend
- OpenAI API with tool calling, or a configurable equivalent
- Zod for schema validation
- TypeScript
- Google Maps Platform or Mapbox
- Suitable Places and Weather APIs

### Task 1: Supabase database

Create migrations for:
- `profiles`
- `trips`
- `trip_days`
- `activities`
- `accommodations`
- `trip_expenses`
- `trip_collaborators`
- `agent_runs`
- `saved_places`

Implement foreign keys, constraints, indexes, timestamps, and RLS policies.

Users must only access their own records unless they have explicit collaborator permissions. Implement collaborator roles with appropriate restrictions.

Generate TypeScript database types and provide seed data for development.

### Task 2: Build the agentic travel planner

Implement a tool-using AI agent that plans trips based on the user's preferences, dates, destination, budget, and traveler count.

The agent must:
1. Interpret the travel request and identify missing information.
2. Research relevant destinations, activities, restaurants, and available travel information.
3. Compare activities against user preferences and budget.
4. Organize attractions geographically.
5. Create a realistic day-by-day itinerary.
6. Estimate activity, accommodation, transport, and food costs where reliable information is available.
7. Validate schedules, opening hours, travel durations, and budget constraints.
8. Revise the itinerary if validation identifies problems.
9. Save validated results to Supabase.
10. Return structured JSON that the frontend can display.

### Task 3: Implement callable tools

Create real tool functions such as:

- `search_places`
- `get_place_details`
- `get_weather_forecast`
- `calculate_route`
- `check_opening_hours`
- `estimate_trip_budget`
- `generate_itinerary`
- `validate_itinerary`
- `update_trip`
- `save_trip`

The AI agent must invoke tools when necessary, consume their actual results, and make decisions based on them.

Use a main orchestrator with specialized research, itinerary, budget, and validation functions. Separate AI calls are optional; reliability and demonstrable tool execution are more important than the number of agents.

### Task 4: Backend API

Agree on endpoint names and schemas with Person 1 before implementation.

Provide operations for:

- Creating a trip-planning run
- Checking planning status
- Retrieving generated itineraries
- Modifying an existing itinerary
- Regenerating a particular day
- Validating itinerary changes
- Saving and retrieving trip data

Use authenticated requests, validate inputs with Zod, enforce ownership and permissions, and return consistent error responses.

For long-running planning, implement a persistent run-status mechanism using Supabase. Include failure handling, timeouts, and retries where appropriate.

### Task 5: External integrations

Implement configurable adapters for:
- Places and points of interest
- Maps and route calculations
- Weather
- Currency conversion
- Flights and accommodation searches where APIs are available

Do not fabricate live information or pretend that bookings were completed. If credentials are unavailable, provide a clearly labeled development fallback.

### Task 6: Security

- Keep AI and provider secrets server-side.
- Never send the Supabase service-role key to the frontend.
- Enforce authorization independently of frontend checks.
- Validate tool arguments and external API responses.
- Protect against prompt injection in retrieved content.
- Add sensible rate limits and error handling.
- Do not log secrets or unnecessary personal information.

### Task 7: Integration and testing

Work with Person 1 to establish:
- Shared database types
- API endpoint contracts
- Agent request and response schemas
- Planning status format
- Error response format

Test itinerary generation, tool calls, budget calculations, invalid inputs, RLS permissions, and persistence.

### Deliverables

Provide database migrations, the working AI agent, backend endpoints, API adapters, `.env.example`, automated tests, and a setup README.

Do not stop after writing a design document. Implement the backend, run available tests, fix errors, and clearly identify any integrations requiring API credentials.

Prioritize a reliable end-to-end travel-planning workflow over adding unnecessary features.