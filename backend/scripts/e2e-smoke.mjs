const BASE = process.env.API_URL || 'http://localhost:3001';
const ML = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const WEBHOOK = process.env.REPORT_EMAIL_WEBHOOK || 'http://localhost:9999/send';

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: String(err.message || err) });
    console.log(`✗ ${name}: ${err.message || err}`);
  }
}

await check('API health', async () => {
  const r = await fetch(`${BASE}/api`);
  if (!r.ok) throw new Error(r.status);
  return r.json();
});

await check('ML service health', async () => {
  const r = await fetch(`${ML}/health`);
  if (!r.ok) throw new Error(r.status);
  const d = await r.json();
  if (d.status !== 'ok') throw new Error('ml not ok');
  return d.models;
});

await check('ML forecast (hybrid)', async () => {
  const labels = ['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12'];
  const values = [40,42,45,44,48,50,52,55,53,58,60,62];
  const r = await fetch(`${ML}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labels, values, horizon: 3, model: 'hybrid', confidence: 95 }),
  });
  const d = await r.json();
  if (!d.available) throw new Error(d.message || 'forecast failed');
  return { model: d.model, forecast: d.forecast };
});

await check('ML forecast (LSTM)', async () => {
  const labels = ['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12'];
  const values = [40,42,45,44,48,50,52,55,53,58,60,62];
  const r = await fetch(`${ML}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labels, values, horizon: 3, model: 'lstm', confidence: 95 }),
  });
  const d = await r.json();
  if (!d.available) throw new Error(d.message || 'lstm failed');
  return { forecast: d.forecast?.length };
});

await check('Email webhook', async () => {
  const r = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: 'test@e-insight.local', subject: 'Smoke Test', body: 'E2E scheduled report test' }),
  });
  if (!r.ok) throw new Error(r.status);
  return r.json();
});

await check('Dev smoke (integrated)', async () => {
  const r = await fetch(`${BASE}/api/dev/smoke`);
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const d = await r.json();
  const failed = (d.checks || []).filter((c) => !c.ok);
  if (failed.length) throw new Error(failed.map((f) => f.name).join(', '));
  return d.summary;
});

await check('Auth guard active', async () => {
  const r = await fetch(`${BASE}/api/reports/history`);
  if (r.status !== 401) throw new Error(`expected 401 got ${r.status}`);
  return '401 OK';
});

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
console.log(`\n=== E2E: ${passed}/${results.length} passed ===`);
if (failed) process.exit(1);
