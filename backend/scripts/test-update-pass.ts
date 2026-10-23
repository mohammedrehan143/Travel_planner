import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testUpdatePassword() {
  const aliceId = 'ae1f44dd-ce9b-44bb-a59b-ea089cc1fd81';
  console.log('Testing updateUserById for Alice...');
  const { data, error } = await adminClient.auth.admin.updateUserById(aliceId, {
    password: 'Password123!'
  });

  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('Successfully updated Alice password! ID:', data.user.id);
  }
}

testUpdatePassword().catch(console.error);
