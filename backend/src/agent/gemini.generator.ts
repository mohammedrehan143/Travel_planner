import { PlannedDay, PlannedActivity } from '../types/trip.types.js';
import { generateWithGemini, isLLMConfigured } from './llm.client.js';

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
  coords: { lat: number; lng: number };
}

export async function generateItineraryWithGemini(
  params: GeminiTripParams
): Promise<{ days: PlannedDay[]; theme: string; summary: string } | null> {
  // In test environment, skip external LLM quota consumption to prevent rate limits
  if (process.env.NODE_ENV === 'test' || !isLLMConfigured()) {
    return null;
  }

  const isOneDay = params.durationDays === 1;
  const companion = params.travelCompanion || (params.travelerCount === 1 ? 'Solo' : 'Friends/Family');

  const prompt = `You are TripPilot AI, an elite local tour guide and autonomous travel planner.
Generate a structured, authentic day-by-day travel itinerary strictly for:

DESTINATION: ${params.destination}
DURATION: ${params.durationDays} Day(s) (Start: ${params.startDate}, End: ${params.endDate})
TRAVEL COMPANION: ${companion} (${params.travelerCount} person(s))
TRAVEL STYLE: ${params.travelStyle}
BUDGET LIMIT: ${params.totalBudget} ${params.currency}
INTERESTS: ${params.interests.join(', ') || 'Sightseeing, Culture, Local Cuisine'}

STRICT ACCURACY RULES:
1. DESTINATION INTEGRITY: Every single place, landmark, park, and restaurant MUST be a real-world location strictly within ${params.destination}. Under no circumstances output places from other countries or cities (e.g., if destination is Saudi Arabia, do NOT output places from Korea or Japan; if destination is Bangalore, output places exclusively in Bangalore).
2. ${isOneDay ? 'SINGLE-DAY OUTING: This is a 1-day outing. Cover 3-5 top iconic places that a traveler can realistically visit in a single day with optimal transit and minimum expenditure (e.g. within the budget).' : 'PACING: Provide 3-4 realistic activities per day grouped logically by neighborhood.'}
3. BUDGET CONSCIOUS: Ensure all activity costs are estimated in ${params.currency} and the sum fits comfortably within the budget limit (${params.totalBudget} ${params.currency}).
4. OUTPUT FORMAT: Output ONLY valid JSON matching this exact structure without markdown backticks:
{
  "theme": "${params.destination} Discovery Experience",
  "summary": "Concise 2-sentence overview",
  "days": [
    {
      "dayNumber": 1,
      "date": "${params.startDate}",
      "theme": "Neighborhood or Day Theme",
      "summary": "Day overview",
      "activities": [
        {
          "title": "Exact Real Place Name in ${params.destination}",
          "description": "2-sentence vivid description of what to see and do here.",
          "category": "sightseeing",
          "startTime": "09:30",
          "endTime": "11:30",
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
      setTimeout(() => reject(new Error('Gemini generation timed out after 6s')), 6000)
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
        // Small radial displacement around destination center if exact coords not provided
        const angle = (actIdx * 60) * (Math.PI / 180);
        const radius = 0.008 + actIdx * 0.004;

        return {
          title: a.title || `${params.destination} Landmark ${actIdx + 1}`,
          description: a.description || `Explore ${params.destination}.`,
          category: (['sightseeing', 'dining', 'cultural', 'outdoor', 'entertainment', 'relaxation'].includes(a.category)
            ? a.category
            : 'sightseeing') as any,
          startTime: a.startTime || `${9 + actIdx * 3}:00`,
          endTime: a.endTime || `${11 + actIdx * 3}:00`,
          durationMinutes: a.durationMinutes || 120,
          locationName: a.locationName || a.title || `${params.destination} Attraction`,
          locationAddress: a.locationAddress || `Central District, ${params.destination}`,
          latitude: centerLat + radius * Math.cos(angle),
          longitude: centerLng + radius * Math.sin(angle),
          estimatedCost: typeof a.estimatedCost === 'number' ? a.estimatedCost : 0,
          currency: params.currency,
          bookingRequired: Boolean(a.bookingRequired),
          bookingStatus: 'not_booked',
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
        theme: d.theme || `Day ${dayIdx + 1}: ${params.destination} Highlights`,
        summary: d.summary || `Curated itinerary covering top sights in ${params.destination}.`,
        activities: acts
      };
    });

    return {
      days: formattedDays,
      theme: parsed.theme || `${params.destination} Agentic Blueprint`,
      summary: parsed.summary || `Autonomous itinerary planned with Google Gemini for ${params.destination}.`
    };
  } catch (err) {
    console.warn('Gemini itinerary generation fallback to heuristic adapter:', err);
    return null;
  }
}
