import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminClient = createClient(supabaseUrl, serviceKey);

async function inspectSchema() {
  console.log('1. Trying to query openapi spec from Supabase...');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Paths available in OpenAPI:');
    const paths = Object.keys(data.paths || {});
    console.log(paths);
    console.log('Definitions:');
    console.log(Object.keys(data.definitions || {}));
  } catch (err) {
    console.error('Error fetching spec:', err);
  }
}

inspectSchema();
