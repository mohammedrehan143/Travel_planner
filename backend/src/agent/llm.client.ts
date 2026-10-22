import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { AGENT_TOOLS } from './tools/definitions.js';

let openaiClient: OpenAI | null = null;
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

  if (!openaiClient) {
    if (provider === 'gemini') {
      openaiClient = new OpenAI({
        apiKey: env.GEMINI_API_KEY,
        baseURL: env.OPENAI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/'
      });
    } else {
      openaiClient = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        baseURL: env.OPENAI_BASE_URL || undefined
      });
    }
  }

  return { client: openaiClient, model, provider };
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
