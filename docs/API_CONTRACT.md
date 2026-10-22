# TripPilot AI - API & Agent Contract (Person 1 & Person 2)

This document serves as the agreed integration contract between **Person 2** (Backend & Agentic AI Lead) and **Person 1** (Frontend Lead).

---

## 1. Authentication & Security

- **Base URL**: `http://localhost:5000` (or `VITE_API_URL`)
- **Headers**:
  ```http
  Authorization: Bearer <supabase_jwt_access_token>
  Content-Type: application/json
  ```
- **Local Dev / Prototyping Bypass**:
  If developing frontend components before configuring live Supabase Auth, you can pass:
  ```http
  x-user-id: 00000000-0000-0000-0000-000000000001
  ```
  The backend will automatically authenticate you as the default test user (`Alice Wanderlust`).

---

## 2. API Endpoints

### 2.1 Trip Planning (Agentic AI)

#### `POST /api/trips/plan`
Starts the 10-step agentic travel planning orchestrator.

**Request Body**:
```json
{
  "origin": "San Francisco, CA",
  "destination": "Tokyo, Japan",
  "startDate": "2026-11-01",
  "endDate": "2026-11-05",
  "travelerCount": 2,
  "budget": 3500,
  "currency": "USD",
  "travelStyle": "balanced",
  "interests": ["culinary", "cultural", "photography"],
  "transportPreference": "transit",
  "accommodationPreference": "hotel",
  "notes": "Prefer scenic walking routes and ramen spots.",
  "asyncExecution": false
}
```

> **Async Execution Note**:
> - If `asyncExecution: false` (default for quick plans), returns `200 OK` with the complete generated `itinerary` and `validation`.
> - If `asyncExecution: true` (recommended for multi-step loading wizard), returns `202 Accepted` with `runId`. You can poll `GET /api/agent-runs/:runId` for real-time progress percentages and step logs!

**Response (200 OK - Synchronous)**:
```json
{
  "status": "completed",
  "runId": "88888888-8888-8888-8888-888888888001",
  "itinerary": {
    "title": "Tokyo Balanced Discovery",
    "description": "A thoughtfully balanced 5-day travel itinerary...",
    "destination": "Tokyo, Japan",
    "origin": "San Francisco, CA",
    "startDate": "2026-11-01",
    "endDate": "2026-11-05",
    "durationDays": 5,
    "travelerCount": 2,
    "travelStyle": "balanced",
    "interests": ["culinary", "cultural", "photography"],
    "totalBudget": 3500,
    "currency": "USD",
    "destinationCoordinates": { "lat": 35.6762, "lng": 139.6503 },
    "days": [
      {
        "dayNumber": 1,
        "date": "2026-11-01",
        "theme": "Historic Heritage & Old Town Wonders",
        "summary": "Day 1 focuses on historic heritage in Tokyo. Expected weather: Sunny (18°C).",
        "weatherSummary": {
          "date": "2026-11-01",
          "temperatureMaxC": 18,
          "temperatureMinC": 12,
          "condition": "Sunny",
          "icon": "sunny",
          "precipitationProbability": 5
        },
        "activities": [
          {
            "title": "Senso-ji Temple & Nakamise-dori",
            "description": "Tokyo's oldest and most significant Buddhist temple...",
            "category": "cultural",
            "startTime": "09:30",
            "endTime": "11:30",
            "durationMinutes": 120,
            "locationName": "Senso-ji Temple",
            "locationAddress": "2 Chome-3-1 Asakusa, Taito City, Tokyo",
            "latitude": 35.714765,
            "longitude": 139.796655,
            "estimatedCost": 0,
            "currency": "USD",
            "bookingRequired": false,
            "bookingStatus": "not_booked",
            "orderIndex": 1
          }
        ],
        "dayEstimatedCost": 62
      }
    ],
    "accommodationSuggestions": [
      {
        "name": "Tokyo Central Premier Hotel",
        "type": "hotel",
        "address": "12 Grand Boulevard, Central District, Tokyo",
        "estimatedNightlyRate": 140,
        "totalPrice": 560,
        "rating": 4.6,
        "latitude": 35.6792,
        "longitude": 139.6523
      }
    ],
    "budgetBreakdown": {
      "currency": "USD",
      "totalBudget": 3500,
      "estimatedTotalCost": 2240,
      "surplusOrDeficit": 1260,
      "isWithinBudget": true,
      "categories": {
        "accommodation": 560,
        "transport": 150,
        "activities": 400,
        "food": 500,
        "buffer": 160
      },
      "costPerTraveler": 1120,
      "recommendations": [
        "Budget surplus of $1260. Comfortable margin for premium dining."
      ]
    },
    "packingList": [
      "Comfortable walking shoes",
      "Universal power adapter and power bank",
      "Lightweight weather-proof jacket"
    ],
    "localTips": [
      "Pre-book high-demand museums at least 3-5 days in advance."
    ]
  },
  "validation": {
    "isValid": true,
    "errorCount": 0,
    "warningCount": 0,
    "issues": [],
    "metrics": {
      "totalActivities": 15,
      "averageActivitiesPerDay": 3.0,
      "totalTravelTimeMinutes": 180,
      "budgetUtilizationPercent": 64.0
    }
  }
}
```

---

### 2.2 Agent Run Tracking

#### `GET /api/agent-runs/:id`
Polls real-time state for progress bars, loading spinners, and agent thought logs.

**Response (200 OK)**:
```json
{
  "runId": "88888888-8888-8888-8888-888888888001",
  "status": "running", // "pending" | "running" | "completed" | "failed"
  "currentStep": "research",
  "progressPercent": 40,
  "logs": [
    {
      "timestamp": "2026-10-22T08:00:00Z",
      "step": "interpret",
      "message": "Interpreting request for Tokyo from 2026-11-01 to 2026-11-05."
    },
    {
      "timestamp": "2026-10-22T08:00:02Z",
      "step": "research",
      "message": "Researching points of interest and live weather forecast for Tokyo."
    }
  ],
  "result": null,
  "errorMessage": null
}
```

---

### 2.3 Natural Language Itinerary Modifications

#### `POST /api/trips/:id/modify`
Allows users to send free-text requests in the AI chat tab (e.g., "Add a ramen tour on Day 2 evening" or "Make Day 3 more relaxed").

**Request Body**:
```json
{
  "instructions": "Add an authentic ramen tour on Day 1 evening",
  "targetDay": 1
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "changeSummary": "Added evening dining activity to Day 1.",
  "itinerary": { /* Updated Itinerary */ },
  "validation": { "isValid": true, "errorCount": 0, "issues": [] }
}
```

---

### 2.4 Day Regeneration

#### `POST /api/trips/:id/days/:dayNumber/regenerate`
Regenerates an individual day schedule with alternative activities or custom pacing.

**Request Body**:
```json
{
  "customPacing": "relaxed", // "relaxed" | "packed" | "adventure" | "cultural"
  "specificInterests": ["traditional gardens", "tea houses"]
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "dayNumber": 1,
  "regeneratedDay": {
    "dayNumber": 1,
    "theme": "Relaxed Explorer Edition",
    "summary": "Refreshed schedule featuring alternative landmarks and curated stops.",
    "activities": [ ... ]
  },
  "validation": { "isValid": true, "errorCount": 0 }
}
```

---

### 2.5 Validation

#### `POST /api/trips/:id/validate`
Validates the current trip against opening hours, time overlaps, pacing, travel duration buffers, and budget limits.

**Response (200 OK)**:
```json
{
  "tripId": "11111111-1111-1111-1111-111111111111",
  "validation": {
    "isValid": true,
    "errorCount": 0,
    "warningCount": 0,
    "issues": [],
    "metrics": {
      "totalActivities": 4,
      "averageActivitiesPerDay": 2.0,
      "totalTravelTimeMinutes": 35,
      "budgetUtilizationPercent": 25.5
    }
  }
}
```

---

### 2.6 Trip Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trips` | Returns all trips owned by or shared with the authenticated user |
| `GET` | `/api/trips/:id` | Returns complete trip details (days, activities, accommodations, expenses, collaborators) |
| `PATCH` | `/api/trips/:id` | Update trip title, description, budget, status, or cover image |
| `DELETE`| `/api/trips/:id` | Deletes a trip (Owner only) |
| `POST` | `/api/trips/:id/collaborators` | Invite a collaborator (`{ "email": "bob@test.com", "role": "editor" }`) |

---

### 2.7 Live Integrations (Proxy Endpoints)

- `GET /api/integrations/places/search?destination=Tokyo&query=temple&category=cultural`
- `GET /api/integrations/weather?destination=Tokyo&startDate=2026-11-01&endDate=2026-11-05`
- `POST /api/integrations/routes/calculate` (`{ "origin": "Asakusa", "destination": "Akihabara", "transportMode": "transit" }`)
- `GET /api/integrations/currency/convert?from=USD&to=JPY&amount=100`

---

## 3. Database Schema & Supabase Client Types

The generated TypeScript database definitions are available in:
[`backend/src/types/database.types.ts`](file:///D:/skills_lab/Travel_planner/backend/src/types/database.types.ts)

Frontend can import this file directly or copy to `frontend/src/types/database.types.ts`.
