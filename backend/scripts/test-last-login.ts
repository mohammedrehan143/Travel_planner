import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  console.log('Testing insert with last_login_at...');
  const dummyId = '00000000-0000-0000-0000-000000000099';
  const { error: errWithCol } = await adminClient.from('profiles').insert({
    id: dummyId,
    email: 'dummy@test.com',
    last_login_at: new Date().toISOString()
  });
  console.log('Insert with last_login_at error:', errWithCol);
}

testInsert().catch(console.error);
