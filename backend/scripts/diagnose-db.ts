import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('Testing admin.createUser...');
  const testEmail = `admin_test_${Date.now()}@trippilot.test`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Admin Test User',
      phone: '+15559876543',
      terms_accepted: true
    }
  });

  if (error) {
    console.error('Error object:', JSON.stringify(error, null, 2));
  } else {
    console.log('Successfully created user:', data.user.id);
    
    // Check if profile was created
    const { data: pData, error: pErr } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    console.log('Profile result:', pData, pErr);

    // Delete test user
    await adminClient.auth.admin.deleteUser(data.user.id);
    console.log('Cleaned up user.');
  }
}

diagnose().catch(console.error);
