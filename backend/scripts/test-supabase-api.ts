async function testSupabaseApi() {
  const token = 'sbp_fc06f06f1c23719a55da2421fe542c5ecbc10562';
  const projectRef = 'ikgsahbuhaucueffphxs';

  console.log('Testing Supabase Management API SQL execution...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'SELECT current_database(), current_user, version();'
    })
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

testSupabaseApi();
