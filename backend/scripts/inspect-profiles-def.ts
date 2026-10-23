import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  const data = await res.json();
  console.log('Profile properties in OpenAPI:');
  console.log(data.definitions?.profiles?.properties);
  console.log('Required in profiles:', data.definitions?.profiles?.required);
}

run();
