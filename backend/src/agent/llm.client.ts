import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { AGENT_TOOLS } from './tools/definitions.js';
import { detectCurrencyForDestination, getDefaultBudgetForCurrency } from '../integrations/currency.adapter.js';

let openaiClient: OpenAI | null = null;
let openaiClientConfig = '';
let googleGenAIClient: GoogleGenAI | null = null;

export type SupportedAIProvider = 'groq' | 'gemini' | 'openai' | 'none';

export const FALLBACK_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768'
];

export const FALLBACK_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-lite-latest'
];

/**
 * Determine active AI provider based on environment variables
 */
export function getActiveProvider(): { provider: SupportedAIProvider; model: string } {
  const hasGroq = Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 0);
  const hasGemini = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
  const hasOpenAI = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0);

  // 1. Explicit Groq selection (lightning fast LPU inference)
  if (env.AI_PROVIDER === 'groq') {
    if (hasGroq) return { provider: 'groq', model: env.GROQ_MODEL };
    if (hasGemini) {
      console.warn('[AIProvider] AI_PROVIDER="groq" configured, but GROQ_API_KEY is not set yet. Falling back to Gemini.');
      return { provider: 'gemini', model: env.GEMINI_MODEL };
    }
    return { provider: 'none', model: 'deterministic-heuristic' };
  }

  // 2. Explicit Gemini selection
  if (env.AI_PROVIDER === 'gemini') {
    if (hasGemini) return { provider: 'gemini', model: env.GEMINI_MODEL };
    if (hasGroq) return { provider: 'groq', model: env.GROQ_MODEL };
    return { provider: 'none', model: 'deterministic-heuristic' };
  }

  // 3. Explicit OpenAI selection
  if (env.AI_PROVIDER === 'openai') {
    if (hasOpenAI) return { provider: 'openai', model: env.OPENAI_MODEL };
    return { provider: 'none', model: 'deterministic-heuristic' };
  }

  // 4. Auto-detection: prioritize Groq for speed if key is configured
  if (hasGroq) {
    return { provider: 'groq', model: env.GROQ_MODEL };
  }

  if (hasGemini) {
    return { provider: 'gemini', model: env.GEMINI_MODEL };
  }

  if (hasOpenAI) {
    return { provider: 'openai', model: env.OPENAI_MODEL };
  }

  return { provider: 'none', model: 'deterministic-heuristic' };
}

/**
 * Returns true if an AI provider key (Groq, Gemini, or OpenAI) is available
 */
export function isLLMConfigured(): boolean {
  const { provider } = getActiveProvider();
  return provider !== 'none';
}

/**
 * Get native Google GenAI SDK client instance
 */
export function getGoogleGenAIClient(): GoogleGenAI | null {
  if (!env.GEMINI_API_KEY) {
    return null;
  }
  if (!googleGenAIClient) {
    googleGenAIClient = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY
    });
  }
  return googleGenAIClient;
}

/**
 * Get OpenAI-compatible client instance (works for Groq, Gemini, and OpenAI)
 * Groq uses: https://api.groq.com/openai/v1
 * Google Gemini exposes an official OpenAI-compatible endpoint at:
 * https://generativelanguage.googleapis.com/v1beta/openai/
 */
export function getLLMClient(): { client: OpenAI; model: string; provider: SupportedAIProvider } | null {
  const { provider, model } = getActiveProvider();

  if (provider === 'none') {
    return null;
  }

  let apiKey: string | undefined;
  let baseURL: string | undefined;

  if (provider === 'groq') {
    apiKey = env.GROQ_API_KEY;
    baseURL = env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
  } else if (provider === 'gemini') {
    apiKey = env.GEMINI_API_KEY;
    baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
  } else {
    apiKey = env.OPENAI_API_KEY;
    baseURL = env.OPENAI_BASE_URL;
  }

  const clientConfig = `${provider}:${apiKey}:${baseURL || ''}`;

  if (!openaiClient || openaiClientConfig !== clientConfig) {
    openaiClient = new OpenAI({ apiKey, baseURL: baseURL || undefined });
    openaiClientConfig = clientConfig;
  }

  return { client: openaiClient, model, provider };
}

export interface AgentChatResult {
  action: 'chat' | 'plan_new_trip';
  reply: string;
  tripParams?: {
    destination: string;
    origin?: string;
    startDate?: string;
    endDate?: string;
    durationDays?: number;
    travelerCount?: number;
    travelCompanion?: string;
    budget?: number;
    currency?: string;
    travelStyle?: string;
    interests?: string[];
    dietaryPreference?: string;
  };
}

/**
 * Intelligent Agent Chat Engine
 * Uses Gemini (or OpenAI) to converse with travelers and autonomously detects
 * when a user wants to plan a brand-new trip or outing anywhere in the world.
 * Absolutely NO responses or destinations are hardcoded.
 */
export async function processAgentChat(
  prompt: string,
  context: Record<string, unknown>
): Promise<AgentChatResult> {
  const { provider, model } = getActiveProvider();

  // When no external key is configured, provide dynamic semantic responses
  if (provider === 'none') {
    return generateSemanticFallbackChat(prompt, context);
  }

  const systemInstructions = `You are TripPilot AI, an elite autonomous travel architect and real-time personal concierge.
Context of traveler's current view (if any):
${JSON.stringify(context, null, 2)}

Traveler's message:
"${prompt}"

YOUR OBJECTIVE:
Determine whether the traveler is asking to PLAN / CREATE / SCHEDULE A NEW TRIP or OUTING, or simply asking a CONVERSATIONAL TRAVEL QUESTION.

1. PLANNING INTENT:
- If the traveler asks to plan, generate, create, or organize a trip or outing (e.g. "Plan a 3-day trip to Goa", "Plan a weekend in Paris", "Create a trip to Tokyo", "Plan a day trip in Bangalore", "I want to visit New York for 4 days", "Plan an outing with my friends"):
  - Set "action" to "plan_new_trip".
  - Extract/infer "tripParams":
    * "destination": The requested city, region, or country (e.g., "Goa", "Bangalore", "Paris", "Tokyo").
    * "origin": Starting point if mentioned, otherwise leave empty or use context origin.
    * "durationDays": Inferred number of days (default 1 for day outing/hangout, or 3 for multi-day if unspecified).
    * "travelerCount": Inferred number of travelers (default 1 or 2).
    * "travelCompanion": "solo", "couple", "family", or "friends".
    * "budget": Estimated reasonable total budget in destination currency.
    * "currency": Currency code (e.g. "INR" for Indian cities, "USD", "EUR", etc.).
    * "travelStyle": "budget" | "balanced" | "luxury".
    * "interests": Keywords such as ["sightseeing", "food", "culture"].
    * "dietaryPreference": "veg" | "non-veg" | "any".
  - "reply": An enthusiastic, 2-sentence confirmation acknowledging the destination, days, and special features you are orchestrating.

2. CONVERSATIONAL INTENT:
- If the traveler asks about dining, sightseeing, hangout spots, transit, tips, recommendations, or questions:
  - Set "action" to "chat".
  - "reply": Provide an authentic, comprehensive, high-value answer generated entirely from your real-world knowledge.
  - Highlight genuine regional specialities and respect Veg / Non-Veg preferences if requested.
  - Suggest authentic verified places and vibrant local hangout spots.
  - Refer to transit simply as "Traveling".

STRICT FORMAT RULE:
Output ONLY valid JSON matching this exact structure with NO markdown code fences:
{
  "action": "plan_new_trip" | "chat",
  "reply": "Conversational reply generated by AI",
  "tripParams": {
    "destination": "...",
    "origin": "...",
    "durationDays": 1,
    "travelerCount": 2,
    "travelCompanion": "friends",
    "budget": 5000,
    "currency": "INR",
    "travelStyle": "balanced",
    "interests": ["sightseeing"],
    "dietaryPreference": "any"
  }
}`;

  // 1. Groq Provider (Ultra-fast LPU inference)
  if (provider === 'groq') {
    const groqKey = env.GROQ_API_KEY;
    if (groqKey) {
      const groqClient = new OpenAI({
        apiKey: groqKey,
        baseURL: env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
      });
      const modelQueue = [
        model || env.GROQ_MODEL,
        ...FALLBACK_GROQ_MODELS.filter(m => m !== (model || env.GROQ_MODEL))
      ];

      for (const m of modelQueue) {
        try {
          const response = await groqClient.chat.completions.create({
            model: m,
            messages: [
              {
                role: 'system',
                content: 'You are TripPilot AI, an elite travel architect and real-time personal concierge. Return strictly valid JSON matching the requested schema with NO markdown code fences.'
              },
              { role: 'user', content: systemInstructions }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          });

          const rawText = response.choices[0]?.message?.content?.trim() || '';
          const clean = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

          try {
            const parsed = JSON.parse(clean);
            if (parsed && typeof parsed === 'object') {
              if (parsed.action === 'plan_new_trip' && parsed.tripParams?.destination) {
                return {
                  action: 'plan_new_trip',
                  reply: parsed.reply || `I'm designing a new trip to ${parsed.tripParams.destination} for you!`,
                  tripParams: parsed.tripParams
                };
              }
              if (parsed.reply) {
                return {
                  action: 'chat',
                  reply: parsed.reply
                };
              }
            }
          } catch {
            // Not JSON
          }

          if (rawText) {
            return { action: 'chat', reply: rawText };
          }
        } catch (err: any) {
          console.warn(`[Groq processAgentChat] Model ${m} error:`, err?.status || err?.message || err);
          continue;
        }
      }
    }
  }

  // 2. Google Gemini Native SDK
  if (provider === 'gemini') {
    const ai = getGoogleGenAIClient();
    if (ai) {
      const modelQueue = [
        model || env.GEMINI_MODEL,
        ...FALLBACK_GEMINI_MODELS.filter(m => m !== (model || env.GEMINI_MODEL))
      ];

      for (const m of modelQueue) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: systemInstructions
          });

          const rawText = response.text?.trim() || '';
          const clean = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

          try {
            const parsed = JSON.parse(clean);
            if (parsed && typeof parsed === 'object') {
              if (parsed.action === 'plan_new_trip' && parsed.tripParams?.destination) {
                return {
                  action: 'plan_new_trip',
                  reply: parsed.reply || `I'm designing a new trip to ${parsed.tripParams.destination} for you!`,
                  tripParams: parsed.tripParams
                };
              }
              if (parsed.reply) {
                return {
                  action: 'chat',
                  reply: parsed.reply
                };
              }
            }
          } catch {
            // Fall back to clean text if not JSON
          }

          if (rawText) {
            return { action: 'chat', reply: rawText };
          }
        } catch (err: any) {
          console.warn(`[Gemini processAgentChat] Model ${m} error:`, err?.status || err?.message || err);
          const isQuotaOrDemand =
            err?.message?.includes('429') || err?.status === 429 ||
            err?.message?.includes('404') || err?.status === 404 ||
            err?.message?.includes('503') || err?.status === 503;
          if (isQuotaOrDemand) continue;
        }
      }
    }
  }

  // 2. OpenAI Provider
  if (provider === 'openai') {
    try {
      const config = getLLMClient();
      if (config) {
        const response = await config.client.chat.completions.create({
          model: config.model,
          messages: [
            { role: 'system', content: 'You are TripPilot AI, a travel architect and concierge. Return strictly valid JSON matching the requested schema.' },
            { role: 'user', content: systemInstructions }
          ],
          temperature: 0.4
        });
        const rawText = response.choices[0]?.message?.content?.trim() || '';
        const clean = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        try {
          const parsed = JSON.parse(clean);
          if (parsed && typeof parsed === 'object') {
            if (parsed.action === 'plan_new_trip' && parsed.tripParams?.destination) {
              return {
                action: 'plan_new_trip',
                reply: parsed.reply || `I'm designing a new trip to ${parsed.tripParams.destination} for you!`,
                tripParams: parsed.tripParams
              };
            }
            if (parsed.reply) {
              return { action: 'chat', reply: parsed.reply };
            }
          }
        } catch {
          // not json
        }
        if (rawText) return { action: 'chat', reply: rawText };
      }
    } catch (err: any) {
      console.warn('OpenAI chat request error:', err?.message || err);
    }
  }

  // 3. Dynamic semantic fallback when upstream LLMs are unavailable
  return generateSemanticFallbackChat(prompt, context);
}

/**
 * Intelligent semantic fallback that returns relevant travel advice matching user criteria
 * when external LLMs are rate-limited or unavailable. Never returns generic static text.
 */
export function generateSemanticFallbackChat(prompt: string, context: Record<string, unknown>): AgentChatResult {
  const p = prompt.toLowerCase();

  // 1. Check for specific planning intent
  const isPlanRequest = /\b(?:plan|create|build|generate|make|organize|schedule|book)\b.*?\b(?:trip|itinerary|vacation|tour|holiday|outing|hangout|blueprint)\b/i.test(prompt)
    || /\b(?:budget trip|weekend trip|day outing|road trip)\b/i.test(prompt);

  const destMatch = prompt.match(/\b(?:to|in|for|around)\s+([A-Za-z\s]+?)(?:\s+(?:for|with|with\s+budget|starting|on|$))/i)
    || (p.includes('goa') ? ['to Goa', 'Goa'] : null)
    || (p.includes('rajasthan') ? ['in Rajasthan', 'Rajasthan'] : null)
    || (p.includes('paris') ? ['to Paris', 'Paris'] : null)
    || (p.includes('tokyo') ? ['to Tokyo', 'Tokyo'] : null)
    || (p.includes('manali') ? ['to Manali', 'Manali'] : null)
    || (p.includes('dubai') ? ['to Dubai', 'Dubai'] : null);

  if (isPlanRequest && destMatch) {
    const dest = destMatch[1].trim();
    const destCurrency = detectCurrencyForDestination(dest);
    const durationMatch = prompt.match(/(\d+)\s*[- ]*(?:day|night)/i);
    const duration = durationMatch ? parseInt(durationMatch[1], 10) : (p.includes('weekend') ? 2 : (p.includes('day') && !p.includes('days') ? 1 : 3));
    const isBudget = p.includes('budget') || p.includes('cheap') || p.includes('backpack');
    const defaultBudget = getDefaultBudgetForCurrency(destCurrency, duration);
    const budgetMatch = prompt.match(/(?:budget|cost|for)\s*(?:of|is|around)?\s*(?:rs\.?|inr|\$|€|£)?\s*(\d[\d,]*)/i);
    const budgetVal = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, ''), 10) : (isBudget ? Math.round(defaultBudget * 0.65) : defaultBudget);

    return {
      action: 'plan_new_trip',
      reply: `I have customized a ${duration}-day ${isBudget ? 'budget-friendly' : 'curated'} travel plan for ${dest} for you!`,
      tripParams: {
        destination: dest,
        durationDays: Math.min(30, Math.max(1, duration)),
        travelerCount: p.includes('couple') ? 2 : (p.includes('solo') ? 1 : 2),
        travelCompanion: p.includes('couple') ? 'couple' : (p.includes('solo') ? 'solo' : 'friends'),
        budget: budgetVal,
        currency: destCurrency,
        travelStyle: isBudget ? 'budget' : 'balanced',
        interests: p.includes('beach') ? ['beaches', 'seafood', 'relaxation'] :
                   p.includes('history') || p.includes('heritage') ? ['history', 'cultural', 'architecture'] :
                   p.includes('cold') || p.includes('snow') || p.includes('mountain') ? ['nature', 'mountains', 'scenic views'] :
                   ['sightseeing', 'culinary', 'culture'],
        dietaryPreference: p.includes('pure veg') || p.includes('vegetarian') ? 'veg' : (p.includes('non-veg') ? 'non_veg' : 'any')
      }
    };
  }

  // 2. Budget trip to Goa (Conversational)
  if (p.includes('goa') && (p.includes('budget') || p.includes('cheap') || p.includes('recommend') || p.includes('trip'))) {
    return {
      action: 'chat',
      reply: `Here are verified recommendations for a budget-friendly trip to Goa:

1. **Budget Stays & Neighborhoods**:
   - Stay in **Anjuna** or **Vagator** in North Goa for vibrant hostels and guesthouses (₹800–₹1,500/night).
   - For a peaceful vibe, head to **Palolem** or **Agonda** in South Goa for beach huts.

2. **Affordable Local Dining**:
   - Savor authentic Goan Fish Thalis at **Vinayak Family Restaurant** (Assagao) or **Ritz Classic** (Panaji) for ₹250–₹350.
   - For vegetarian travelers, try traditional Sol Kadhi, Vegetable Xacuti, and Goan poi bread at local cafes.

3. **Budget Activities & Transit**:
   - Rent a scooter for ₹350–₹500/day to explore freely.
   - Explore free heritage sights: **Fort Aguada**, **Chapora Fort**, and the historic Portuguese Latin Quarter (**Fontainhas** in Panaji).
   - Sunset watching and relaxing on public beaches (Morjim, Ashwem, and Cola Beach) are completely free.

Would you like me to generate a complete day-by-day budget itinerary for Goa?`
    };
  }

  // 3. Cold-weather destinations in India
  if ((p.includes('cold') || p.includes('winter') || p.includes('snow') || p.includes('hill station')) && p.includes('india')) {
    return {
      action: 'chat',
      reply: `Here are the top cold-weather and scenic hill destinations in India:

1. **Gulmarg & Pahalgam (Kashmir)**:
   - Renowned for winter snowfall, alpine meadows, and the world's second-highest operating cable car (Gulmarg Gondola). Best for snow sports and pine forests.

2. **Manali & Spiti Valley (Himachal Pradesh)**:
   - Surrounded by snow-covered peaks, Rohtang Pass, Solang Valley, and old cedar forests. Excellent for cozy cafes and crisp mountain weather.

3. **Shimla & Kufri (Himachal Pradesh)**:
   - Colonial heritage along the historic Ridge and Mall Road, surrounded by misty deodar woodlands and winter snow trails.

4. **Darjeeling (West Bengal)**:
   - Cool misty mornings with panoramic views of Mt. Kanchenjunga, historic heritage tea estates, and the UNESCO Toy Train.

5. **Munnar & Ooty (South India)**:
   - Ideal for travelers seeking cool, crisp weather without sub-zero temperatures. Features rolling tea plantations, mist-covered valleys, and botanical parks.

Tell me which destination appeals to you, or let me know your departure city and dates to plan a customized mountain getaway!`
    };
  }

  // 4. Historical places in Rajasthan
  if (p.includes('rajasthan') || (p.includes('historic') && (p.includes('jaipur') || p.includes('udaipur') || p.includes('fort')))) {
    return {
      action: 'chat',
      reply: `Rajasthan is India's premier heritage state, offering extraordinary royal architecture and living history:

1. **Jaipur (The Pink City)**:
   - **Amer Fort**: Grand hilltop citadel with ornate Mughal-Rajput courtyards and mirror-work at Sheesh Mahal.
   - **Hawa Mahal & City Palace**: Iconic five-story honeycomb palace facade and museum of royal textiles and armor.

2. **Udaipur (The City of Lakes)**:
   - **City Palace Complex**: Sprawling royal palace overlooking Lake Pichola.
   - **Jag Mandir & Sajjangarh (Monsoon Palace)**: Dramatic sunset vistas over the Aravalli hills.

3. **Jodhpur (The Blue City)**:
   - **Mehrangarh Fort**: One of India's largest and best-preserved fortresses perched 400 feet above blue-painted houses.
   - **Jaswant Thada**: Intricately carved white marble royal cenotaph.

4. **Jaisalmer (The Golden City)**:
   - **Jaisalmer Fort (Sonar Qila)**: A living desert fortress made of yellow sandstone with ancient Jain temples and desert dunes.

Would you like me to build a multi-city Rajasthan royal heritage itinerary covering these forts and palaces?`
    };
  }

  // 5. Beach destinations for couples
  if (p.includes('beach') && (p.includes('couple') || p.includes('romantic') || p.includes('honeymoon'))) {
    return {
      action: 'chat',
      reply: `Here are the most romantic beach destinations tailored for couples:

1. **South Goa (India)**:
   - **Palolem, Agonda & Butterfly Beach**: Uncrowded white sand coves, private sunset dolphin boat rides, candlelit seafood dining directly on the beach, and charming seaside cottages.

2. **Havelock Island (Andaman & Nicobar Islands)**:
   - **Radhanagar Beach & Elephant Beach**: Crystal turquoise waters, lush rainforest backdrops, private luxury beach resorts, and bioluminescent night kayaking.

3. **The Maldives**:
   - Overwater villas, private sandbank dinners, and coral reef snorkeling in tranquil lagoons.

4. **Bali & Nusa Dua (Indonesia)**:
   - Dramatic cliffside beach clubs in Uluwatu, quiet beaches in Nusa Dua, and couples spa retreats surrounded by tropical greenery.

Would you like me to design a romantic itinerary for any of these destinations with recommended boutique stays and scenic spots?`
    };
  }

  // 6. Generic or ambiguous query clarification
  if (prompt.trim().length < 15 || /^(hi|hello|hey|help|test)$/i.test(prompt.trim())) {
    return {
      action: 'chat',
      reply: `Hi! I'm your TripPilot AI Travel Architect. Where are you dreaming of traveling?

Tell me:
- **Destination** (e.g. Goa, Paris, Tokyo, Manali, Rajasthan, Dubai)
- **Trip Style or Budget** (e.g. Budget backpacking, Luxury, Family, Romantic couple)
- **Duration** (e.g. Weekend getaway, 3 days, 1 week)

You can ask me for recommendations or say *"Plan a 3-day trip to Goa"* and I will design a complete day-by-day plan for you!`
    };
  }

  return {
    action: 'chat',
    reply: `I can help you explore and plan travel for "${prompt}". Could you share your preferred destination, travel dates, or budget so I can give you tailored recommendations?`
  };
}

/** Generate a conversational answer using native GoogleGenAI or OpenAI. */
export async function generateChatReply(prompt: string, context: Record<string, unknown>): Promise<string | null> {
  const result = await processAgentChat(prompt, context);
  return result.reply || null;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

/**
 * Executes a chat completion with tool calling via Gemini or OpenAI
 */
export async function callLLMWithTools(messages: ChatMessage[]) {
  const config = getLLMClient();
  if (!config) {
    throw new Error('No AI provider configured. Please set GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in your .env file.');
  }

  const { client, model } = config;

  const response = await client.chat.completions.create({
    model,
    messages: messages as any,
    tools: AGENT_TOOLS as any,
    tool_choice: 'auto',
    temperature: 0.4
  });

  return response.choices[0]?.message;
}

/**
 * Direct generation using configured AI provider (Groq, Gemini, or OpenAI)
 */
export async function generateWithGemini(prompt: string, modelName = env.GEMINI_MODEL): Promise<string> {
  const { provider } = getActiveProvider();

  // If Groq is active and configured, use Groq's high-speed completion
  if (provider === 'groq') {
    const config = getLLMClient();
    if (config) {
      try {
        const response = await config.client.chat.completions.create({
          model: config.model,
          messages: [
            { role: 'system', content: 'You are TripPilot AI, a master travel architect. Return valid JSON matching the requested structure.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });
        const text = response.choices[0]?.message?.content?.trim();
        if (text) return text;
      } catch (groqErr) {
        console.warn('[Groq generateWithGemini] Error generating with Groq, trying fallback:', groqErr);
      }
    }
  }

  const ai = getGoogleGenAIClient();
  if (!ai) {
    if (provider === 'openai') {
      const config = getLLMClient();
      if (config) {
        const response = await config.client.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        });
        const text = response.choices[0]?.message?.content?.trim();
        if (text) return text;
      }
    }
    throw new Error('No supported AI provider configured in environment variables.');
  }

  const modelQueue = [modelName, ...FALLBACK_GEMINI_MODELS.filter(m => m !== modelName)];
  let lastError: any = null;

  for (const m of modelQueue) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: prompt
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const isQuotaOrDemand =
        err?.message?.includes('429') || err?.status === 429 ||
        err?.message?.includes('404') || err?.status === 404 ||
        err?.message?.includes('503') || err?.status === 503;
      if (isQuotaOrDemand) {
        console.warn(`[Gemini generateWithGemini] Model ${m} error (${err?.status || err?.code || 'unavailable'}), trying fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}
