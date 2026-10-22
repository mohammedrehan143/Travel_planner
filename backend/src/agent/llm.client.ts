import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AGENT_TOOLS } from './tools/definitions.js';

let openaiClient: OpenAI | null = null;

export function getLLMClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL || undefined
    });
  }

  return openaiClient;
}

export function isLLMConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== '');
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export async function callLLMWithTools(messages: ChatMessage[]) {
  const client = getLLMClient();
  if (!client) {
    throw new Error('LLM provider is not configured. Missing OPENAI_API_KEY.');
  }

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: messages as any,
    tools: AGENT_TOOLS as any,
    tool_choice: 'auto',
    temperature: 0.5
  });

  return response.choices[0]?.message;
}
