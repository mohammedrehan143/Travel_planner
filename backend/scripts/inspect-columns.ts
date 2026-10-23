import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function inspectColumns() {
  const { data, error } = await adminClient.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching profile row:', error);
  } else if (data && data[0]) {
    console.log('Columns in public.profiles:');
    console.log(Object.keys(data[0]));
    console.log('Sample profile row:', data[0]);
  } else {
    console.log('Profiles table is empty.');
  }
}

inspectColumns().catch(console.error);
