import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sql = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/006_security_rls_mfa.sql'), 'utf8')

const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

await c.connect()
await c.query(sql)
console.log('Migration 006 applied OK')
await c.end()
