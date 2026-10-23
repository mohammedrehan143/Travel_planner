import { PlannedDay, PlannedActivity } from '../types/trip.types.js';
import { generateWithGemini, isLLMConfigured } from './llm.client.js';
import { getAccurateFlightEstimate } from './flightPricing.js';

export interface FlightEstimateResult {
  estimatedCost: number;
  currency: string;
  airlines: string;
  description: string;
}

interface GeminiTripParams {
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelerCount: number;
  travelCompanion?: string;
  travelStyle: string;
  interests: string[];
  totalBudget: number;
  currency: string;
  dietaryPreference?: string;
  coords: { lat: number; lng: number };
}

export async function generateItineraryWithGemini(
  params: GeminiTripParams
): Promise<{ days: PlannedDay[]; theme: string; summary: string; flightEstimate?: FlightEstimateResult } | null> {
  // In test environment, skip external LLM quota consumption to prevent rate limits
  if (process.env.NODE_ENV === 'test' || !isLLMConfigured()) {
    return null;
  }

  const isOneDay = params.durationDays === 1;
  const companion = params.travelCompanion || (params.travelerCount === 1 ? 'Solo' : 'Friends/Family');
  const dietary = params.dietaryPreference || 'any';

  const prompt = `You are TripPilot AI, an elite local tour guide, flight fare analyst, and autonomous travel planner.
Generate a rich, structured, authentic day-by-day travel itinerary strictly for:

DESTINATION: ${params.destination}
STARTING FROM (ORIGIN): ${params.origin}
DURATION: ${params.durationDays} Day(s) (Start: ${params.startDate}, End: ${params.endDate})
TRAVEL COMPANION: ${companion} (${params.travelerCount} person(s))
DIETARY PREFERENCE: ${dietary} (Veg, Non-Veg, or Both)
TRAVEL STYLE: ${params.travelStyle}
BUDGET LIMIT: ${params.totalBudget} ${params.currency}
INTERESTS: ${params.interests.join(', ') || 'Sightseeing, Culture, Local Cuisine, Hangout Spots'}

STRICT ACCURACY & QUALITY RULES:
1. DESTINATION INTEGRITY: Every single place, landmark, park, restaurant, and hangout spot MUST be a real-world location strictly within ${params.destination}. Under no circumstances output places from other countries or cities (e.g. if destination is Saudi Arabia, output Saudi landmarks in Riyadh/Jeddah/etc. only; if destination is Bangalore, output places exclusively in Bangalore).
2. MULTIPLE PLACES PER DAY (CRUCIAL):
   - ${isOneDay ? 'For this 1-day outing, generate AT LEAST 5 DISTINCT PLACES/ACTIVITIES covering morning landmark, lunch dining spot, afternoon cultural spot, late afternoon famous local hangout spot, and evening street food / dinner spot.' : 'Provide 4-5 high-value, realistic activities per day grouped logically by neighborhood.'}
   - NEVER output only 1 or 2 places for a day! Provide a complete, enjoyable schedule.
3. NO REPETITIVE "SUNRISE / SUNSET" CLICHES: Do NOT generate generic titles like "Sunrise at...", "Sunset walk at...", "Morning stroll". Instead, highlight the authentic SPECIALITY of the place (e.g., architectural masterpiece, signature dish, famous art, historic courtyard, bustling night bazaar, or popular youth hangout).
4. LOCAL HANGOUT SPOTS: Feature genuine local hangout spots where residents and travelers spend time (e.g. vibrant cafe streets, iconic book houses, food streets, rooftop plazas, or scenic promenades).
5. VEG / NON-VEG DIETARY COMPLIANCE:
   - For all food & dining spots, respect DIETARY PREFERENCE: ${dietary}.
   - If Vegetarian: recommend famous pure-veg icons and traditional vegetarian specialties.
   - If Non-Vegetarian: recommend famous regional meat/poultry specialties and iconic biryanis/grills.
   - Set "dietaryTag" to "veg", "non-veg", or "both" on each dining activity, and state the signature dish in "speciality".
6. FLIGHT TICKET CHARGES ESTIMATION:
   - Provide realistic, market-benchmarked round-trip airfare from "${params.origin}" to "${params.destination}" in ${params.currency} based on verified commercial airline market rates:
     * Intra-city / local outing (same city): set flight cost to 0 and note "Intra-city travel - no flight required".
     * Domestic flights (within same country): ₹5,500-₹7,500 INR (~$70-$90 USD) / US domestic ~$280-$360 USD.
     * UAE / Gulf (Dubai, Abu Dhabi, Doha): ₹22,000-₹28,000 INR (~$260-$340 USD) via Emirates, flydubai, IndiGo.
     * Saudi Arabia (Riyadh, Jeddah): ₹28,000-₹36,000 INR (~$340-$430 USD) via Saudia, Flynas, Air India.
     * Southeast Asia (Thailand, Singapore, Malaysia): ₹16,000-₹24,000 INR (~$190-$290 USD) via Singapore Airlines, Thai Airways, Scoot.
     * Bali / Indonesia: ₹32,000-₹42,000 INR (~$380-$500 USD) via Batik Air, AirAsia.
     * Western Europe / UK (London, Paris, Switzerland, Rome): ₹55,000-₹75,000 INR (~$660-$900 USD / €610-€830 EUR / £520-£710 GBP) via Air France, British Airways, SWISS, Lufthansa.
     * Japan / East Asia (Tokyo): ₹48,000-₹68,000 INR (~$580-$820 USD) via ANA, JAL, Air India.
     * North America (USA, Canada): ₹78,000-₹1,10,000 INR (~$930-$1,300 USD) via Air India, United, Emirates.
     * Australia / New Zealand: ₹62,000-₹88,000 INR (~$740-$1,050 USD) via Qantas, Singapore Airlines.
7. TRANSIT: Refer to transit simply as "Traveling" (do not use "metro").
8. OUTPUT FORMAT: Output ONLY valid JSON matching this exact structure without markdown backticks:
{
  "theme": "${params.destination} Discovery & Specialities",
  "summary": "Concise 2-sentence overview",
  "flightEstimate": {
    "estimatedCost": 0,
    "currency": "${params.currency}",
    "airlines": "Airlines or Local Transit",
    "description": "Estimated flight or intercity fare"
  },
  "days": [
    {
      "dayNumber": 1,
      "date": "${params.startDate}",
      "theme": "Day Theme & Neighborhood Highlights",
      "summary": "Day overview",
      "activities": [
        {
          "title": "Exact Real Place Name in ${params.destination}",
          "description": "2-sentence vivid description of what to see and do here.",
          "speciality": "Authentic signature specialty or dish of this spot",
          "dietaryTag": "veg",
          "category": "sightseeing",
          "startTime": "09:00",
          "endTime": "11:00",
          "durationMinutes": 120,
          "locationName": "Official Place Name",
          "locationAddress": "Street / Neighborhood, ${params.destination}",
          "estimatedCost": 0,
          "bookingRequired": false
        }
      ]
    }
  ]
}`;

  try {
    const geminiCall = generateWithGemini(prompt);
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini generation timed out after 35s')), 35000)
    );

    const rawResponse = await Promise.race([geminiCall, timeoutPromise]);
    if (!rawResponse) return null;

    // Strip optional markdown fencing if Gemini included it
    const cleanJson = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    if (!parsed || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      return null;
    }

    const { lat: centerLat, lng: centerLng } = params.coords;

    const formattedDays: PlannedDay[] = parsed.days.map((d: any, dayIdx: number) => {
      const dayDate = new Date(params.startDate);
      dayDate.setDate(dayDate.getDate() + dayIdx);
      const dateStr = d.date || dayDate.toISOString().split('T')[0];

      const acts: PlannedActivity[] = (d.activities || []).map((a: any, actIdx: number) => {
        // Radial distribution around destination center if exact coords not provided
        const angle = (actIdx * 55) * (Math.PI / 180);
        const radius = 0.006 + actIdx * 0.0035;

        const specNote = a.speciality ? `Speciality: ${a.speciality}` : '';
        const dietNote = a.dietaryTag ? `Dietary: ${a.dietaryTag}` : '';
        const notesCombined = [specNote, dietNote].filter(Boolean).join(' • ');

        return {
          title: a.title || `${params.destination} Landmark ${actIdx + 1}`,
          description: a.description || `Experience ${params.destination}.`,
          category: (['sightseeing', 'dining', 'cultural', 'outdoor', 'entertainment', 'relaxation'].includes(a.category)
            ? a.category
            : 'sightseeing') as any,
          startTime: a.startTime || `${9 + actIdx * 2}:30`,
          endTime: a.endTime || `${11 + actIdx * 2}:30`,
          durationMinutes: a.durationMinutes || 120,
          locationName: a.locationName || a.title || `${params.destination} Attraction`,
          locationAddress: a.locationAddress || `Central District, ${params.destination}`,
          latitude: centerLat + radius * Math.cos(angle),
          longitude: centerLng + radius * Math.sin(angle),
          estimatedCost: typeof a.estimatedCost === 'number' ? a.estimatedCost : 0,
          currency: params.currency,
          bookingRequired: Boolean(a.bookingRequired),
          bookingStatus: 'not_booked',
          notes: notesCombined || undefined,
          orderIndex: actIdx + 1,
          travelFromPrevious: actIdx > 0 ? {
            mode: 'transit',
            durationMinutes: 15,
            distanceKm: 1.5
          } : undefined
        };
      });

      return {
        dayNumber: d.dayNumber || dayIdx + 1,
        date: dateStr,
        theme: d.theme || `Day ${dayIdx + 1}: ${params.destination} Highlights & Specialities`,
        summary: d.summary || `Curated itinerary covering top sights and local specialities in ${params.destination}.`,
        activities: acts,
        dayEstimatedCost: acts.reduce((sum, act) => sum + (act.estimatedCost || 0), 0)
      };
    });

    const validatedFlight = getAccurateFlightEstimate(
      params.origin,
      params.destination,
      params.currency,
      parsed.flightEstimate ? {
        cost: parsed.flightEstimate.estimatedCost,
        currency: parsed.flightEstimate.currency,
        airlines: parsed.flightEstimate.airlines,
        description: parsed.flightEstimate.description
      } : undefined
    );

    const flightEstimate: FlightEstimateResult = {
      estimatedCost: validatedFlight.cost,
      currency: validatedFlight.currency,
      airlines: validatedFlight.airlines,
      description: validatedFlight.description
    };

    return {
      days: formattedDays,
      theme: parsed.theme || `${params.destination} Curated Exploration`,
      summary: parsed.summary || `Authentic ${params.durationDays}-day travel blueprint with verified local specialities.`,
      flightEstimate
    };
  } catch (err) {
    console.warn('Gemini itinerary synthesis fallback triggered:', err);
    return null;
  }
}
