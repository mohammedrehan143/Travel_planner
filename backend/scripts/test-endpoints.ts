const token = 'sbp_fc06f06f1c23719a55da2421fe542c5ecbc10562';
const projectRef = 'ikgsahbuhaucueffphxs';

async function testEndpoints() {
  const endpoints = [
    `/v1/projects/${projectRef}/config/database`,
    `/v1/projects/${projectRef}/database/migrations`,
    `/v1/projects/${projectRef}/database/query`,
    `/v1/projects/${projectRef}/database/pooling-configuration`,
    `/v1/projects/${projectRef}/settings`,
    `/v1/organizations`,
  ];

  for (const ep of endpoints) {
    const res = await fetch(`https://api.supabase.com${ep}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(ep, res.status, res.statusText);
    if (res.status === 200) {
      const data = await res.json();
      console.log('Result:', JSON.stringify(data).slice(0, 200));
    }
  }
}

testEndpoints().catch(console.error);
