import pg from 'pg'

const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

await c.connect()

const checks = [
  ['005 security_roles', "SELECT count(*) FROM security_roles"],
  ['005 permissions', "SELECT count(*) FROM permissions"],
  ['005 login_history', "SELECT to_regclass('public.login_history') IS NOT NULL"],
  ['005 api_keys', "SELECT to_regclass('public.api_keys') IS NOT NULL"],
  ['006 mfa_settings', "SELECT to_regclass('public.mfa_settings') IS NOT NULL"],
  ['006 profiles.data_scope', "SELECT count(*) FROM information_schema.columns WHERE table_name='profiles' AND column_name='data_scope'"],
  ['006 column_security_rules', "SELECT count(*) FROM column_security_rules"],
  ['007 scheduled_jobs', "SELECT count(*) FROM scheduled_jobs"],
  ['007 user_notifications', "SELECT to_regclass('public.user_notifications') IS NOT NULL"],
]

console.log('=== Migration Status ===')
for (const [label, sql] of checks) {
  const r = await c.query(sql)
  console.log(`${label}: ${JSON.stringify(r.rows[0])}`)
}

await c.end()
