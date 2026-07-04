const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function applyRls() {
  const sql = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/002_rls_policies.sql'), 'utf8');
  console.log('RLS SQL harus dijalankan manual di Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/pyugtvxdwgfgohpiirje/sql/new');
  console.log('---');
  console.log(sql);
}

async function runImport() {
  const res = await fetch('http://localhost:3001/api/import/doc-folder', { method: 'POST' });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

async function checkCount() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cases?select=count`, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      Prefer: 'count=exact',
    },
  });
  console.log('cases count header:', res.headers.get('content-range'));
}

async function main() {
  const cmd = process.argv[2] || 'import';
  if (cmd === 'rls') return applyRls();
  if (cmd === 'check') return checkCount();
  await runImport();
  await checkCount();
}

main().catch(console.error);
