const token = 'sbp_fc06f06f1c23719a55da2421fe542c5ecbc10562';
const projectRef = 'ikgsahbuhaucueffphxs';

async function testQuery() {
  console.log('Testing SQL query via Management API...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
        SELECT trigger_name, event_manipulation, event_object_table, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'users' OR event_object_table = 'profiles';
      `
    })
  });

  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  console.log('Triggers:', JSON.stringify(data, null, 2));
}

testQuery().catch(console.error);
