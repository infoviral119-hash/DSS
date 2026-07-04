import pg from 'pg'

const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

await c.connect()
const tables = await c.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public'
  AND table_name IN ('security_roles','permissions','login_history','active_sessions','role_permissions')
  ORDER BY 1
`)
const cols = await c.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name='profiles'
  AND column_name IN ('username','mfa_enabled','status','last_login_at')
  ORDER BY 1
`)
console.log('tables:', tables.rows.map((r) => r.table_name).join(', ') || '(none)')
console.log('profiles cols:', cols.rows.map((r) => r.column_name).join(', ') || '(none)')
await c.end()
