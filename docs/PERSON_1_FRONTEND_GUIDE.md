# TripPilot AI - Frontend Integration Guide (Handbook for Person 1)

> **Audience**: Person 1 (Frontend Lead)  
> **Backend Service**: `http://localhost:5000`  
> **API Contract**: [`docs/API_CONTRACT.md`](file:///D:/skills_lab/Travel_planner/docs/API_CONTRACT.md)  
> **Database Types**: [`backend/src/types/database.types.ts`](file:///D:/skills_lab/Travel_planner/backend/src/types/database.types.ts)  

---

## 1. Quick Integration Overview

The backend is built, tested, and running with:
1. Supabase PostgreSQL database schemas and RLS policies.
2. A tool-using AI agent powered by Google Gemini.
3. Authenticated REST API endpoints with Zod input validation.
4. Real-time agent status tracking for your loading wizards.

---

## 2. Shared Development Rules & Dev Bypass

### Authentication:
When making API requests from React:
- **With Supabase Auth**: Pass `Authorization: Bearer <session.access_token>`.
- **During Local Prototyping (No Login Required)**:
  Pass the test user header:
  ```http
  x-user-id: 00000000-0000-0000-0000-000000000001
  ```
  The backend will automatically authenticate you as a local development user and return sample trips and itineraries.

---

## 3. Ready-to-Use Frontend API Client

Drop this typed API client directly into your frontend repository at `src/lib/api.ts`:

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Grab Supabase JWT token if logged in, or fallback to dev user
  const token = localStorage.getItem('supabase_access_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : { 'x-user-id': '00000000-0000-0000-0000-000000000001' }),
    ...(options.headers as Record<string, string>)
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data as T;
}

export const api = {
  // 1. Trip Wizard: Plan Trip
  planTrip: (payload: {
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelerCount?: number;
    budget?: number;
    currency?: string;
    travelStyle?: string;
    interests?: string[];
    asyncExecution?: boolean;
  }) => request<any>('/api/trips/plan', { method: 'POST', body: JSON.stringify(payload) }),

  // 2. Poll Agent Run Progress
  getAgentRunStatus: (runId: string) => request<any>(`/api/agent-runs/${runId}`),

  // 3. User Trips Dashboard
  getTrips: () => request<{ trips: any[] }>('/api/trips'),
  getTripDetails: (id: string) => request<{ trip: any }>(`/api/trips/${id}`),

  // 4. Natural-Language AI Chat Modification
  modifyTrip: (tripId: string, instructions: string, targetDay?: number) =>
    request<any>(`/api/trips/${tripId}/modify`, {
      method: 'POST',
      body: JSON.stringify({ instructions, targetDay })
    }),

  // 5. Regenerate Single Day
  regenerateDay: (tripId: string, dayNumber: number, customPacing?: string, specificInterests?: string[]) =>
    request<any>(`/api/trips/${tripId}/days/${dayNumber}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ customPacing, specificInterests })
    }),

  // 6. Validate Itinerary
  validateTrip: (tripId: string) => request<any>(`/api/trips/${tripId}/validate`, { method: 'POST' }),

  // 7. Live Weather & Places Proxies
  searchPlaces: (destination: string, query: string, category?: string) =>
    request<any>(`/api/integrations/places/search?destination=${encodeURIComponent(destination)}&query=${encodeURIComponent(query)}${category ? `&category=${category}` : ''}`),
  getWeather: (destination: string, startDate: string, endDate: string) =>
    request<any>(`/api/integrations/weather?destination=${encodeURIComponent(destination)}&startDate=${startDate}&endDate=${endDate}`)
};
```

---

## 4. Mapping Frontend UI Tasks to Backend Endpoints

| Person 1 Task | Recommended Endpoint | Notes |
|---|---|---|
| **Multi-Step Wizard** | `POST /api/trips/plan` | Set `asyncExecution: true` to get `runId` and display animated progress steps. |
| **Agent Progress Wizard** | `GET /api/agent-runs/:id` | Poll every 1-2 seconds until `status === 'completed'`. Returns `progressPercent` (0-100) and step logs! |
| **Dashboard** | `GET /api/trips` | Returns all trips for the user with status, dates, destination, and cover image. |
| **Itinerary Schedule View**| `GET /api/trips/:id` | Returns complete trip with `days`, `activities`, `accommodations`, and `expenses`. |
| **Map Interface** | `trip.destination_lat`, `trip.destination_lng`, activity `latitude`/`longitude` | Coordinates are verified real floats ready for Mapbox or Google Maps pins. |
| **Budget Visualizer** | `trip.total_budget`, `trip.budgetBreakdown.categories`, `trip.expenses` | Ready for Recharts pie/bar charts. |
| **AI Modification Chat** | `POST /api/trips/:id/modify` | Send `{ instructions: "Add a ramen tour on Day 2" }` - returns updated schedule! |
| **Regenerate Day Button** | `POST /api/trips/:id/days/:dayNumber/regenerate` | Send `{ customPacing: "relaxed" }` to refresh a single day. |

---

## 5. Seeded Test Data Available Immediately

To test your UI before backend generation, you can immediately fetch:
- **Trip ID 1**: `11111111-1111-1111-1111-111111111111` ("Tokyo Cultural & Culinary Odyssey")
- **Trip ID 2**: `22222222-2222-2222-2222-222222222222` ("Parisian Art & Architecture")
