const BASE = process.env.API_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`✓ ${name}`, detail ? `→ ${JSON.stringify(detail).slice(0, 80)}` : '');
  } catch (err) {
    results.push({ name, ok: false, error: String(err.message || err) });
    console.log(`✗ ${name}: ${err.message || err}`);
  }
}

async function getToken() {
  if (!SUPABASE_URL || !SUPABASE_ANON || !TEST_EMAIL || !TEST_PASSWORD) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  if (!r.ok) throw new Error(`login failed ${r.status}`);
  const d = await r.json();
  return d.access_token;
}

await check('API health', async () => {
  const r = await fetch(`${BASE}/api`);
  if (!r.ok) throw new Error(r.status);
  return (await r.json()).app;
});

await check('Security guard (401)', async () => {
  const r = await fetch(`${BASE}/api/security/dashboard`);
  if (r.status !== 401) throw new Error(`expected 401 got ${r.status}`);
  return '401 OK';
});

await check('Global search guard (401)', async () => {
  const r = await fetch(`${BASE}/api/security/search?q=admin`);
  if (r.status !== 401) throw new Error(`expected 401 got ${r.status}`);
  return '401 OK';
});

let token = null;
await check('Supabase login', async () => {
  token = await getToken();
  if (!token) return 'skipped (set TEST_EMAIL + TEST_PASSWORD)';
  return 'token OK';
});

if (token) {
  const auth = { Authorization: `Bearer ${token}` };

  await check('Security dashboard', async () => {
    const r = await fetch(`${BASE}/api/security/dashboard`, { headers: auth });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const d = await r.json();
    if (typeof d.totalUsers !== 'number') throw new Error('invalid dashboard');
    return { totalUsers: d.totalUsers, securityScore: d.securityScore };
  });

  await check('Global search', async () => {
    const r = await fetch(`${BASE}/api/security/search?q=admin`, { headers: auth });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    return { users: d.users?.length ?? 0, roles: d.roles?.length ?? 0 };
  });

  await check('Scheduler jobs', async () => {
    const r = await fetch(`${BASE}/api/security/scheduler/jobs`, { headers: auth });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const d = await r.json();
    if (!Array.isArray(d) || d.length < 1) throw new Error('no jobs');
    return { jobs: d.length };
  });

  await check('Notifications', async () => {
    const r = await fetch(`${BASE}/api/security/notifications/unread-count`, { headers: auth });
    if (!r.ok) throw new Error(r.status);
    return { unread: await r.json() };
  });

  await check('Login track', async () => {
    const r = await fetch(`${BASE}/api/auth/track-login`, { method: 'POST', headers: auth });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  });

  await check('Roles from DB', async () => {
    const r = await fetch(`${BASE}/api/security/roles`, { headers: auth });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    if (!d.length) throw new Error('empty roles');
    return { count: d.length };
  });

  await check('Cases stats (JWT)', async () => {
    const r = await fetch(`${BASE}/api/cases/stats`, { headers: auth });
    if (!r.ok) throw new Error(r.status);
    return { total: (await r.json()).total };
  });
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n=== Security Smoke: ${passed}/${results.length} passed ===`);
if (results.some((r) => !r.ok)) process.exit(1);
