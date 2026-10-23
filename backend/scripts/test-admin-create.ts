import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const admin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function run() {
  console.log('Testing admin.createUser...');
  const res = await admin.auth.admin.createUser({
    email: `admin_test_${Date.now()}@trippilot.test`,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'Admin Test' }
  });
  console.log('Error:', res.error);
  console.log('User created:', res.data?.user?.id);
  if (res.data?.user) {
    await admin.auth.admin.deleteUser(res.data.user.id);
  }
}

run().catch(console.error);
