/**
 * Create a starter e-Insight dashboard in Metabase and print public embed URL.
 * Usage: node scripts/setup-metabase-dashboard.mjs
 */
const BASE = process.env.METABASE_URL ?? 'http://localhost:3000'
const EMAIL = process.env.METABASE_ADMIN_EMAIL ?? 'admin@e-insight.local'
const PASSWORD = process.env.METABASE_ADMIN_PASSWORD ?? 'eInsight2026!Metabase'

async function api(path, opts = {}, token) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Metabase-Session': token } : {}),
      ...(opts.headers ?? {}),
    },
  })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${path} -> ${res.status}: ${text}`)
  return data
}

async function createNativeCard(token, dbId, name, display, sql, viz = {}) {
  return api('/api/card', {
    method: 'POST',
    body: JSON.stringify({
      name,
      display,
      visualization_settings: viz,
      dataset_query: {
        type: 'native',
        database: dbId,
        native: { query: sql },
      },
    }),
  }, token)
}

async function main() {
  const session = await api('/api/session', {
    method: 'POST',
    body: JSON.stringify({ username: EMAIL, password: PASSWORD }),
  })
  const token = session.id

  const dbs = await api('/api/database', {}, token)
  const db = dbs.data?.find((d) => d.name === 'e-Insight Supabase') ?? dbs.data?.[0]
  if (!db) throw new Error('Database not found in Metabase')

  let totalCard = (await api('/api/card', {}, token)).find((c) => c.name === 'Total Kasus')
  if (!totalCard) {
    totalCard = await createNativeCard(
      token, db.id, 'Total Kasus', 'scalar',
      'SELECT COUNT(*) AS total FROM cases',
      {},
    )
  }

  let barCard = (await api('/api/card', {}, token)).find((c) => c.name === 'e-Insight Kasus per Jenis')
  if (!barCard) {
    barCard = await createNativeCard(
      token, db.id, 'e-Insight Kasus per Jenis', 'bar',
      `SELECT jenis_kekerasan, COUNT(*) AS count
FROM cases
GROUP BY jenis_kekerasan
ORDER BY count DESC`,
      {
        'graph.dimensions': ['jenis_kekerasan'],
        'graph.metrics': ['count'],
      },
    )
  }

  let dash = (await api('/api/dashboard', {}, token)).find((d) => d.name === 'e-Insight Overview')
  if (!dash) {
    dash = await api('/api/dashboard', {
      method: 'POST',
      body: JSON.stringify({
        name: 'e-Insight Overview',
        description: 'Dashboard kasus SIMPATI.KK',
      }),
    }, token)
  }

  await api(`/api/dashboard/${dash.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: dash.name,
      description: dash.description ?? 'Dashboard kasus SIMPATI.KK',
      dashcards: [
        {
          id: -1,
          card_id: totalCard.id,
          row: 0,
          col: 0,
          size_x: 6,
          size_y: 3,
          visualization_settings: {},
          parameter_mappings: [],
        },
        {
          id: -2,
          card_id: barCard.id,
          row: 0,
          col: 6,
          size_x: 18,
          size_y: 8,
          visualization_settings: {},
          parameter_mappings: [],
        },
      ],
    }),
  }, token)

  const pub = await api(`/api/dashboard/${dash.id}/public_link`, { method: 'POST' }, token)
  const publicUrl = `${BASE}/public/dashboard/${pub.uuid}`

  console.log('')
  console.log('Dashboard ready:', dash.name)
  console.log('Public URL:', publicUrl)
  console.log('')
  console.log('metabase.env:')
  console.log(`METABASE_DASHBOARD_URL=${publicUrl}`)
  console.log('')
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
