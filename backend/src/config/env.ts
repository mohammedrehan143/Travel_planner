import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url().default('http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().default('mock-anon-key-for-development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('mock-service-role-key-for-development'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_PROVIDER: z.enum(['gemini', 'openai', 'auto']).default('auto'),
  MAPS_API_KEY: z.string().optional(),
  WEATHER_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('*')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
