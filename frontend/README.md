# TripPilot AI — Frontend (Person 1)

Production-grade, responsive AI-powered travel planning frontend for **TripPilot AI**, developed by Person 1 (Frontend Lead).

---

## 🚀 Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Plus Jakarta Sans typography
- **Icons**: Lucide React
- **Visualizations**: Recharts (Interactive category expenditure charts & progress trackers)
- **Database & Auth**: `@supabase/supabase-js` (Supabase Auth & PostgreSQL with Row Level Security)
- **Routing**: React Router v6
- **Architecture**: Context API + Typed API Client + Persistent Local Storage Fallback

---

## 🌟 Key Features Implemented

1. **Premium Responsive Landing Page (`LandingPage.tsx`)**:
   - Destination imagery and curated itinerary showcases (Tokyo, Paris, Swiss Alps, Rome).
   - Architectural highlights of the Agentic AI platform and social proof metrics.
   - Dynamic calls to action linking directly to the wizard and dashboard.

2. **Supabase Authentication & Multi-Tenant Support (`AuthPage.tsx` & `AuthContext.tsx`)**:
   - Complete email/password Sign In and Sign Up with Supabase Auth.
   - A local-only development demo with sample itineraries and no seeded personal contact details.
   - Protected routes (`ProtectedRoute`) enforcing authentication.

3. **Multi-Step AI Trip Creation Wizard (`TripWizardPage.tsx`)**:
   - Step 1: Starting City (Origin), Destination, and Travel Dates.
   - Step 2: Traveler Count selector and Budget/Currency configuration.
   - Step 3: Travel Style (Balanced, Cultural, Budget, Luxury, Adventure, Relaxed) and Multi-select Interests.
   - Step 4: Transport and Accommodation preferences with pre-execution review.
   - **Live Agent Execution Screen**: Displays simulated tool calls (`search_places`, `get_weather_forecast`, `calculate_route`, `validate_itinerary`) with animated progress and logs.

4. **Trip Management Dashboard (`DashboardPage.tsx`)**:
   - Overview of all saved, upcoming, and planning trips.
   - Filter trips by status (`all`, `planning`, `confirmed`, `draft`) and search by destination.
   - Delete, inspect, and open itineraries.

5. **Itinerary Dashboard & Day Planner (`ItineraryPage.tsx`)**:
   - Day-by-day tabbed navigation with dates and weather forecast cards.
   - High-fidelity **Activity Cards** displaying time slots, durations, category color codes, addresses, costs, booking requirements, and local tips.
   - **Reorder Activities**: Move activities earlier or later within a day schedule.
   - **Add / Edit Activity Modal**: Full form for adding custom attractions and updating timings/costs.
   - **Regenerate Day**: One-click AI regeneration of daily activities.
   - **Trip Validation Badge**: Real-time validation checks across budget limits, daily distances, and opening hours.

6. **Interactive Waypoint Route Map (`ItineraryMap.tsx`)**:
   - Responsive vector map canvas with numbered waypoint pins for daily activities.
   - Dynamic sequential route lines with animated direction indicators.
   - Map style toggles (Streets, Terrain, Dark) and zoom controls.
   - Interactive pin selection with floating card details and external Google Maps links.

7. **Budget & Expense Tracker (`BudgetTracker.tsx`)**:
   - Real-time spending charts using **Recharts** (Pie chart and Bar chart views).
   - Category-wise expense breakdown (Flights, Lodging, Activities, Food, Transport, Shopping).
   - Remaining budget calculation and overrun warnings.
   - Interactive form to log and delete new expense items.

8. **Natural-Language AI Chat Assistant (`AIChatDrawer.tsx`)**:
   - Slide-out interactive chat assistant.
   - Accepts free-form prompts (e.g. *"Add a late night ramen spot"*, *"Make tomorrow afternoon more relaxing"*).
   - Automatically injects validated activities directly into the itinerary.

9. **Collaboration & Sharing (`CollaborationModal.tsx`)**:
   - View current trip collaborators with Supabase RLS roles (`owner`, `editor`, `viewer`).
   - Copyable shareable itinerary link.
   - Email invitation form with role assignments.

10. **Packing Checklist (`PackingChecklist.tsx`)**:
    - Pre-departure checklists grouped by Essentials, Documents, Tech, Clothing, and Health.
    - Interactive completion progress bar and custom item addition.

11. **Print & PDF Export (`PDFExportView.tsx`)**:
    - Clean, high-resolution document format.
    - One-click browser print / PDF export dialog with `@media print` stylesheets.

---

## 🛠️ Running Locally

### 1. Install Dependencies
```bash
cd Travel_planner/frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_API_URL=http://localhost:4000/api
```

*(Note: If Supabase or the backend server are not configured, the application automatically runs in demo mode with full offline persistence using `localStorage` and seed data from `supabase/seed.sql`.)*

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized, chunk-split production build in `dist/`.
