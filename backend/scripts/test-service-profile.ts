import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adminClient = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function testProfileDirect() {
  const testId = '00000000-0000-0000-0000-000000000999';
  console.log('Testing direct upsert to public.profiles via adminClient...');
  const { data, error } = await adminClient.from('profiles').upsert({
    id: testId,
    email: 'direct_test@trippilot.test',
    full_name: 'Direct Test User',
    preferred_currency: 'INR',
    phone: '+15551234567',
    mobile_number: '+15551234567',
    terms_accepted: true,
  }).select('*').single();

  if (error) {
    console.error('Direct upsert error:', error);
  } else {
    console.log('Direct upsert SUCCESS:', data);
    // clean up
    await adminClient.from('profiles').delete().eq('id', testId);
    console.log('Cleaned up test profile.');
  }
}

testProfileDirect();
