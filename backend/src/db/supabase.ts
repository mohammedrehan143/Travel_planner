import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types.js';
import { env } from '../config/env.js';

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Returns the Supabase client with admin/service-role privileges.
 * Used strictly on the backend for agent runs, background status tracking, and seeding.
 * NEVER expose service-role client to frontend.
 */
export function getAdminSupabase(): SupabaseClient<Database> {
  if (!adminClient) {
    adminClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return adminClient;
}

/**
 * Returns a Supabase client scoped to the authenticated user's JWT.
 * Enforces Row Level Security (RLS) directly in PostgreSQL.
 */
export function getUserSupabase(jwtToken: string): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`
      }
    }
  });
}
