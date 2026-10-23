import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const token = 'sbp_fc06f06f1c23719a55da2421fe542c5ecbc10562';
const projectRef = 'ikgsahbuhaucueffphxs';

async function testManagementApi() {
  console.log('Testing Supabase Management API with token...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  console.log('Project info:', data);
}

testManagementApi().catch(console.error);
