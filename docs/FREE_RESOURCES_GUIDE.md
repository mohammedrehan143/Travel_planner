# TripPilot AI - Free & Open-Source Resources Guide

TripPilot AI is engineered to operate **100% free of charge** for maps, geocoding, route calculations, and weather forecasts, requiring **NO paid subscriptions, NO Google Cloud credit cards, and NO Mapbox tokens**.

---

## 🗺️ Free Resources Summary Matrix

| Service | Provider | Cost | API Key Required? | Where It Is Used |
|---|---|---|:---:|---|
| **Weather Forecasts** | [Open-Meteo API](https://open-meteo.com/) | **$0 (Free for commercial & personal)** | ❌ **No key needed** | [`backend/src/integrations/weather.adapter.ts`](file:///D:/skills_lab/Travel_planner/backend/src/integrations/weather.adapter.ts) |
| **Map Tiles & Embeds**| [OpenStreetMap (OSM)](https://www.openstreetmap.org/) | **$0 (Open Database License)** | ❌ **No key needed** | [`frontend/src/components/itinerary/ItineraryMap.tsx`](file:///D:/skills_lab/Travel_planner/frontend/src/components/itinerary/ItineraryMap.tsx) |
| **Geocoding & POIs** | [OpenStreetMap Nominatim](https://nominatim.org/) | **$0 (Free & Public)** | ❌ **No key needed** | [`backend/src/integrations/places.adapter.ts`](file:///D:/skills_lab/Travel_planner/backend/src/integrations/places.adapter.ts) |
| **Route & Distance** | [OSRM Routing Machine](https://project-osrm.org/) | **$0 (Open-Source Public Demo)** | ❌ **No key needed** | [`backend/src/integrations/routes.adapter.ts`](file:///D:/skills_lab/Travel_planner/backend/src/integrations/routes.adapter.ts) |
| **Currency Rates** | [Frankfurter ECB API](https://frankfurter.dev/) | **$0 (Open-Source ECB Rates)** | ❌ **No key needed** | [`backend/src/integrations/currency.adapter.ts`](file:///D:/skills_lab/Travel_planner/backend/src/integrations/currency.adapter.ts) |

---

## 1. Free Weather Conditions: Open-Meteo

### Why Open-Meteo?
- Open-Meteo aggregates global meteorological models from NOAA (National Oceanic and Atmospheric Administration), DWD (German Weather Service), and ECMWF.
- **Zero Authentication**: No API keys, no headers, no token renewals.
- Global coverage: Works for any latitude and longitude across the world.

### Endpoint Used:
```http
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto&start_date={startDate}&end_date={endDate}
```

### Response Features:
- Daily maximum & minimum temperatures (°C / °F).
- Precipitation probability percentage (0-100%).
- WMO weather interpretation codes mapped to conditions (Clear Sky, Partly Cloudy, Drizzle, Rain, Thunderstorm, Snow).
- Wind speed (km/h).

---

## 2. Free Maps & Waypoint Navigation: OpenStreetMap (OSM)

### How It Works:
1. **Interactive Vector Canvas**:
   - The frontend renders an ultra-smooth, lightweight SVG vector map displaying sequential activity numbers (1, 2, 3...), color-coded categories, and animated transit connecting lines.
2. **OpenStreetMap Live Layer**:
   - Users can toggle the **"OSM Live"** button in [`ItineraryMap.tsx`](file:///D:/skills_lab/Travel_planner/frontend/src/components/itinerary/ItineraryMap.tsx) to render real OpenStreetMap tiles centered on their waypoints with zero API keys.
3. **OpenStreetMap Direction Links**:
   - In the active waypoint popup, travelers can click **"OpenStreetMap"** to view high-resolution satellite or street layers and walking directions.

---

## 3. Free Geocoding: OpenStreetMap Nominatim

When planning trips for arbitrary cities across the globe (e.g., Tokyo, Paris, Rome, Bali, Kyoto, Zurich):
- Resolves coordinates via:
  ```http
  GET https://nominatim.openstreetmap.org/search?format=json&q={query}&limit={limit}
  ```
- Complies with Nominatim usage policy (custom `User-Agent: TripPilotAI/1.0` header).

---

## 4. Free Road & Walking Routing: OSRM

To compute accurate walking and driving travel durations between itinerary attractions:
- Connects to:
  ```http
  GET https://router.project-osrm.org/route/v1/{car|foot}/{fromLng},{fromLat};{toLng},{toLat}?overview=false
  ```
- Backed by high-speed Great-Circle Haversine calculations if offline.

---

## 5. Verification Checklist

- [x] No `MAPS_API_KEY` required in `.env`.
- [x] No `WEATHER_API_KEY` required in `.env`.
- [x] Frontend map switches between Vector Streets, Terrain, Dark, and **OSM Live** with zero token prompts.
- [x] Automated tests run offline without network errors.
