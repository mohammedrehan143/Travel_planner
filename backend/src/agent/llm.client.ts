import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { AGENT_TOOLS } from './tools/definitions.js';

let openaiClient: OpenAI | null = null;
let openaiClientConfig = '';
let googleGenAIClient: GoogleGenAI | null = null;

export type SupportedAIProvider = 'gemini' | 'openai' | 'none';

/**
 * Determine active AI provider based on environment variables
 */
export function getActiveProvider(): { provider: SupportedAIProvider; model: string } {
  if (env.AI_PROVIDER === 'gemini' || (env.AI_PROVIDER === 'auto' && env.GEMINI_API_KEY)) {
    if (env.GEMINI_API_KEY) {
      return { provider: 'gemini', model: env.GEMINI_MODEL };
    }
  }

  if (env.AI_PROVIDER === 'openai' || (env.AI_PROVIDER === 'auto' && env.OPENAI_API_KEY)) {
    if (env.OPENAI_API_KEY) {
      return { provider: 'openai', model: env.OPENAI_MODEL };
    }
  }

  if (env.GEMINI_API_KEY) {
    return { provider: 'gemini', model: env.GEMINI_MODEL };
  }

  return { provider: 'none', model: 'deterministic-heuristic' };
}

/**
 * Returns true if an AI provider key (Gemini or OpenAI) is available
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
 * Get OpenAI-compatible client instance (works for both Gemini and OpenAI)
 * Google Gemini exposes an official OpenAI-compatible endpoint at:
 * https://generativelanguage.googleapis.com/v1beta/openai/
 */
export function getLLMClient(): { client: OpenAI; model: string; provider: SupportedAIProvider } | null {
  const { provider, model } = getActiveProvider();

  if (provider === 'none') {
    return null;
  }

  const apiKey = provider === 'gemini' ? env.GEMINI_API_KEY : env.OPENAI_API_KEY;
  const baseURL = provider === 'gemini'
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/'
    : env.OPENAI_BASE_URL;
  const clientConfig = `${provider}:${apiKey}:${baseURL || ''}`;

  if (!openaiClient || openaiClientConfig !== clientConfig) {
    openaiClient = new OpenAI({ apiKey, baseURL: baseURL || undefined });
    openaiClientConfig = clientConfig;
  }

  return { client: openaiClient, model, provider };
}

/** Generate a conversational answer using native GoogleGenAI, OpenAI, or intelligent concierge fallback. */
export async function generateChatReply(prompt: string, context: Record<string, unknown>): Promise<string | null> {
  const { provider, model } = getActiveProvider();

  // 1. Prefer native GoogleGenAI SDK directly when Gemini is active
  if (provider === 'gemini') {
    const ai = getGoogleGenAIClient();
    if (ai) {
      try {
        const fullPrompt = `You are TripPilot AI, an elite, knowledgeable local travel concierge and trip architect.
Context of the traveler's trip:
${JSON.stringify(context, null, 2)}

Traveler's message:
"${prompt}"

Instructions:
- Provide a concise, highly practical, and helpful answer (2 to 4 sentences or bullet points).
- If asking about food/dining, highlight authentic regional specialities and respect Veg / Non-Veg preferences if mentioned.
- If asking for places or hangout spots, suggest real-world spots with their authentic specialities.
- Never say you booked or modified the database; offer recommendations and tips clearly.`;

        const response = await ai.models.generateContent({
          model: model || 'gemini-2.5-flash',
          contents: fullPrompt
        });

        const text = response.text?.trim();
        if (text) return text;
      } catch (err: any) {
        console.warn('Native GoogleGenAI chat reply rate-limited or failed, engaging intelligent concierge fallback:', err?.message || err);
      }
    }
  }

  // 2. Try OpenAI if configured
  if (provider === 'openai') {
    try {
      const config = getLLMClient();
      if (config) {
        const response = await config.client.chat.completions.create({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'You are TripPilot AI, a concise and practical travel planning assistant. Answer using the supplied trip context.'
            },
            {
              role: 'user',
              content: `Trip context:\n${JSON.stringify(context)}\n\nTraveler request: ${prompt}`
            }
          ],
          temperature: 0.4
        });
        const reply = response.choices[0]?.message?.content?.trim();
        if (reply) return reply;
      }
    } catch (err: any) {
      console.warn('OpenAI chat reply error:', err?.message || err);
    }
  }

  // 3. Intelligent Local Concierge Fallback (ensures user always receives an authentic helpful answer)
  return generateHeuristicTravelReply(prompt, context);
}

/**
 * Intelligent local travel concierge fallback that crafts destination-specific answers
 * when upstream external AI rate limits (e.g. Free Tier 429) are temporarily hit.
 */
function generateHeuristicTravelReply(prompt: string, context: Record<string, unknown>): string {
  const q = prompt.toLowerCase();
  const dest = String(context.destination || context.title || 'your destination').toLowerCase();
  const isBlr = dest.includes('bangalore') || dest.includes('bengaluru');
  const isSaudi = dest.includes('saudi') || dest.includes('riyadh');

  // Food / Dining queries
  if (q.includes('food') || q.includes('eat') || q.includes('dinner') || q.includes('lunch') || q.includes('breakfast') || q.includes('veg') || q.includes('restaurant')) {
    if (isBlr) {
      if (q.includes('veg') && !q.includes('non')) {
        return `For authentic vegetarian food in Bangalore, head to **Vidyarthi Bhavan** in Gandhi Bazaar for their signature crispy Ghee Masala Dosa and filter kaapi, or explore **VV Puram Food Street (Thindi Beedi)** in the evening for hot paddus, Congress buns, and Davangere benne dosas!`;
      }
      return `Bangalore culinary highlights: For legendary Andhra-style biryani try **Meghana Foods** in Koramangala or Indiranagar. For traditional woodfire mutton donne biryani, visit **Shivaji Military Hotel** in Jayanagar (since 1924). For pure veg, don't miss **Vidyarthi Bhavan**!`;
    }
    if (isSaudi) {
      return `In Riyadh, visit **Najd Village** for traditional Saudi dining in a heritage courtyard (aromatic lamb kabsa, jareesh, and cardamom saffron tea). For modern international dining, explore the open-air pavilions at **The Groves** or **Bujairi Terrace** in Diriyah!`;
    }
    return `Great dining recommendations: Savor verified local neighbourhood eateries in the city center. Ask for regional specialties and explore the vibrant evening food quarters for the freshest local delicacies!`;
  }

  // Hangout spots / Evening queries
  if (q.includes('hangout') || q.includes('evening') || q.includes('night') || q.includes('cafe') || q.includes('bar') || q.includes('chill')) {
    if (isBlr) {
      return `Top Bangalore hangout spots:\n• **Church Street & Blossoms Book House**: 3 floors of vintage books, indie coffee roasters, and lively evening street culture.\n• **Indiranagar 12th Main**: Bustling craft microbreweries, rooftop cafes, and boutique shopping.\n• **Koramangala 5th Block**: Youth-favorite gathering hub with artisan dessert spots!`;
    }
    if (isSaudi) {
      return `Top Riyadh hangout hubs:\n• **Boulevard Riyadh City**: Modern promenade featuring illuminated dancing fountains, open-air cafes, and boutique shops.\n• **Souq Al Zal**: Riyadh's oldest traditional marketplace with authentic oud perfumes and handicrafts.\n• **Bujairi Terrace**: Scenic outdoor dining overlooking the historic mud-brick UNESCO site!`;
    }
    return `For evening relaxation, stroll down the central promenade or visit the local pedestrian market square. Enjoy local specialty cafes and panoramic twilight views of the skyline!`;
  }

  // Transit / Traveling queries
  if (q.includes('transit') || q.includes('travel') || q.includes('reach') || q.includes('cab') || q.includes('metro') || q.includes('route')) {
    return `For traveling around ${context.destination || 'the city'}, use app-based cabs or public transit during non-peak hours (10:00–16:00) to avoid rush hour. Keep local navigation maps downloaded offline for smooth transfers!`;
  }

  // General travel assistance
  return `I'm with you on your trip to ${context.destination || 'your destination'}! You can ask me for specific spot specialities, veg or non-veg dining recommendations, famous hangout spots, or transit guidance for any day of your itinerary.`;
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
    throw new Error('No AI provider configured. Please set GEMINI_API_KEY (recommended) or OPENAI_API_KEY in your .env file.');
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
 * Direct generation with Gemini using GoogleGenAI SDK
 */
export async function generateWithGemini(prompt: string, modelName = env.GEMINI_MODEL): Promise<string> {
  const ai = getGoogleGenAIClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt
  });

  return response.text || '';
}
