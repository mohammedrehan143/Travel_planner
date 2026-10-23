import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

console.log('=== CHECKING SUPABASE DATABASE CONNECTION ===');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY present:', Boolean(supabaseAnonKey));
console.log('SUPABASE_SERVICE_ROLE_KEY present:', Boolean(supabaseServiceKey));

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const anonSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('\n--- 1. Testing Admin Client (profiles table) ---');
  try {
    const { data: profiles, error: pError } = await adminSupabase
      .from('profiles')
      .select('*')
      .limit(10);

    if (pError) {
      console.error('❌ Error querying profiles:', pError);
    } else {
      console.log(`✅ Profiles table exists! Found ${profiles.length} row(s):`);
      profiles.forEach((p, idx) => {
        console.log(`   [${idx + 1}] ID: ${p.id}, Email: ${p.email}, Phone: ${p.phone || p.mobile_number}, Name: ${p.full_name}`);
      });
    }
  } catch (err) {
    console.error('❌ Exception in profiles query:', err);
  }

  console.log('\n--- 2. Testing Admin Client (trips table) ---');
  try {
    const { data: trips, error: tError } = await adminSupabase
      .from('trips')
      .select('id, title, destination, user_id, user_phone')
      .limit(5);

    if (tError) {
      console.error('❌ Error querying trips:', tError);
    } else {
      console.log(`✅ Trips table exists! Found ${trips.length} row(s):`);
      trips.forEach((t, idx) => {
        console.log(`   [${idx + 1}] ID: ${t.id}, Title: "${t.title}", Dest: "${t.destination}", Phone: ${t.user_phone}`);
      });
    }
  } catch (err) {
    console.error('❌ Exception in trips query:', err);
  }

  console.log('\n--- 3. Testing Auth Users list ---');
  try {
    const { data: usersData, error: uError } = await adminSupabase.auth.admin.listUsers();
    if (uError) {
      console.error('❌ Error listing auth users:', uError);
    } else {
      console.log(`✅ Auth connection verified! Registered users count: ${usersData.users.length}`);
      usersData.users.forEach((u, idx) => {
        console.log(`   [${idx + 1}] ID: ${u.id}, Email: ${u.email}, Phone: ${u.phone}, Created: ${u.created_at}`);
      });
    }
  } catch (err) {
    console.error('❌ Exception in listUsers:', err);
  }

  console.log('\n--- 4. Testing Anon Client Profile Read (RLS check) ---');
  try {
    const { data: anonData, error: anError } = await anonSupabase
      .from('profiles')
      .select('id, email')
      .limit(2);
    if (anError) {
      console.log('ℹ️ Expected RLS behavior for unauthenticated anon read:', anError.message);
    } else {
      console.log('Anon query result:', anonData);
    }
  } catch (err) {
    console.error('Exception in anon query:', err);
  }

  console.log('\n=== CHECK COMPLETE ===');
}

main().catch(console.error);
