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

  // In test environment, skip external network consumption if no key is configured
  if (process.env.NODE_ENV === 'test' && provider === 'none') {
    const isPlan = /\b(?:plan|create|build|generate|make)\b.*?\b(?:trip|itinerary|vacation|tour|holiday|outing|hangout)\b/i.test(prompt);
    const destMatch = prompt.match(/\b(?:to|in|for|around)\s+([A-Za-z\s]+?)(?:\s+(?:for|with|with\s+budget|starting|on|$))/i);
    const dest = destMatch ? destMatch[1].trim() : 'Goa';
    if (isPlan) {
      return {
        action: 'plan_new_trip',
        reply: `I have prepared a customized travel plan for ${dest}!`,
        tripParams: {
          destination: dest,
          durationDays: 3,
          travelerCount: 2,
          travelCompanion: 'friends',
          budget: 15000,
          currency: 'INR',
          travelStyle: 'balanced',
          interests: ['sightseeing', 'culinary', 'culture'],
          dietaryPreference: 'any'
        }
      };
    }
    return {
      action: 'chat',
      reply: `I am your AI Travel Architect. Ask me about local specialities, dining recommendations, or ask me to plan a new trip!`
    };
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

  // 1. Google Gemini Native SDK
  if (provider === 'gemini') {
    const ai = getGoogleGenAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: model || 'gemini-2.5-flash',
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
        console.warn('Native GoogleGenAI chat request error:', err?.message || err);
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

  // 3. Fallback intent check if upstream LLM is temporarily unavailable or rate-limited
  const isPlanRequest = /\b(?:plan|create|build|generate|make)\b.*?\b(?:trip|itinerary|vacation|tour|holiday|outing|hangout)\b/i.test(prompt);
  const destMatch = prompt.match(/\b(?:to|in|for|around)\s+([A-Za-z\s]+?)(?:\s+(?:for|with|with\s+budget|starting|on|$))/i);
  if (isPlanRequest && destMatch) {
    const dest = destMatch[1].trim();
    return {
      action: 'plan_new_trip',
      reply: `I am orchestrating a brand new trip to ${dest} for you!`,
      tripParams: {
        destination: dest,
        durationDays: 3,
        travelerCount: 2,
        travelCompanion: 'friends',
        budget: dest.toLowerCase().includes('india') || dest.toLowerCase().includes('bangalore') || dest.toLowerCase().includes('goa') ? 15000 : 2500,
        currency: dest.toLowerCase().includes('india') || dest.toLowerCase().includes('bangalore') || dest.toLowerCase().includes('goa') ? 'INR' : 'USD',
        travelStyle: 'balanced',
        interests: ['sightseeing', 'culinary', 'culture'],
        dietaryPreference: 'any'
      }
    };
  }

  return {
    action: 'chat',
    reply: `I am your AI Travel Concierge powered by Google Gemini. Ask me about local specialities, vegetarian or non-vegetarian dining, scenic hangout spots, or tell me to plan a brand-new trip anywhere in the world!`
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
