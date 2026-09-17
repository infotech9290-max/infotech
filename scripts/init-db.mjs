// Direct Supabase SQL execution via REST API using service role
// This uses the PostgREST /rpc endpoint approach

const SUPABASE_URL = 'https://ozjqjhcyckximousfypo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96anFqaGN5Y2t4aW1vdXNmeXBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU3NzcxNiwiZXhwIjoyMTA1MTUzNzE2fQ.zUHwkTT8gPMHTrAtEK8nJ5d6afOkGfZPGqLIi0Efhp4';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'return=representation'
};

// Test connection first
async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=id&limit=1`, { headers });
    if (r.status === 200) {
      console.log('✅ Database ALREADY connected! Tables exist!');
      const data = await r.json();
      console.log('Settings row:', data);
      return 'connected';
    } else if (r.status === 404 || r.status === 400) {
      console.log('⚠️  Tables do not exist yet. Need to create them.');
      return 'needs_setup';
    } else {
      const t = await r.text();
      console.log(`Status ${r.status}:`, t.slice(0, 200));
      return 'error';
    }
  } catch (e) {
    console.log('❌ Connection failed:', e.message);
    return 'error';
  }
}

// Try creating settings table via a creative approach
async function tryCreateViaInsert() {
  console.log('\n🔧 Attempting table creation check...');

  // Try inserting into settings - if table exists this works, if not we get a specific error
  const r = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ id: 1, website_name: '', upi_id: '', bank_name: '', bank_account: '', bank_ifsc: '', account_name: '', logo_url: '', courses: [] })
  });

  const text = await r.text();
  if (r.ok) {
    console.log('✅ Settings table exists and data inserted!');
    return true;
  } else {
    console.log(`Settings insert status ${r.status}:`, text.slice(0, 300));
    return false;
  }
}

async function tryInsertAdmin() {
  console.log('\n👤 Inserting default admin user...');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({
      id: 'ADM-01',
      name: 'Super Admin',
      email: 'info@admin.com',
      role: 'ADMIN',
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
    })
  });

  const text = await r.text();
  if (r.ok) {
    console.log('✅ Admin user ready!');
    return true;
  } else {
    console.log(`Admin insert status ${r.status}:`, text.slice(0, 300));
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('  ADMIN PORTAL - Database Setup Check');
  console.log('='.repeat(50));

  const status = await testConnection();

  if (status === 'connected') {
    await tryInsertAdmin();
    console.log('\n🎉 READY! Go to localhost:3000/login');
    console.log('   Email: info@admin.com | Password: admin');
    return;
  }

  if (status === 'needs_setup') {
    const ok = await tryCreateViaInsert();
    if (!ok) {
      console.log('\n' + '='.repeat(50));
      console.log('❌ Tables do not exist. Need PAT token to create them.');
      console.log('');
      console.log('FASTEST FIX — 2 minutes:');
      console.log('1. Go to: supabase.com/dashboard/account/tokens');
      console.log('2. Generate new token → Database: Full access');
      console.log('3. Go to: localhost:3000/admin/dashboard?tab=settings');
      console.log('4. Click "DB Setup" tab → paste token → click Initialize');
      console.log('='.repeat(50));
    }
  }
}

main();
