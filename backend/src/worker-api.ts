import { createClient } from '@supabase/supabase-js'

type Env = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  CORS_ORIGIN?: string
}

const corsHeaders = (origin: string | null, env: Env) => {
  const allowed = (env.CORS_ORIGIN || 'https://e-insight.pages.dev').split(',').map((s) => s.trim())
  const ok = origin && (allowed.includes(origin) || allowed.includes('*') || origin.endsWith('.pages.dev'))
  return {
    'Access-Control-Allow-Origin': ok ? origin! : allowed[0],
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
  }
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

function supabaseAdmin(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function supabaseUser(env: Env, token: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function authMe(env: Env, token: string) {
  const admin = supabaseAdmin(env)
  const { data: authData, error } = await admin.auth.getUser(token)
  if (error || !authData.user) return null

  const user = authData.user
  const email = user.email ?? ''
  const fullName = String(user.user_metadata?.full_name ?? email.split('@')[0] ?? 'User')
  const userDb = supabaseUser(env, token)

  let { data: profile } = await userDb.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) {
    const { data: created } = await userDb
      .from('profiles')
      .insert({ id: user.id, email, full_name: fullName, role: 'operator' })
      .select()
      .single()
    profile = created ?? { id: user.id, email, full_name: fullName, role: 'operator' }
  }

  return {
    id: user.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    dataScope: profile.data_scope ?? 'national',
    scopeRegion: profile.scope_region ?? null,
    canRevealPii: profile.can_reveal_pii ?? false,
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/$/, '') || '/'
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    if (path === '/api' || path === '/api/health') {
      return json({ status: 'ok', app: 'e-Insight DSS', version: '1.0.0', timestamp: new Date().toISOString() }, 200, cors)
    }

    if (path === '/api/auth/me' && request.method === 'GET') {
      const header = request.headers.get('Authorization')
      if (!header?.startsWith('Bearer ')) return json({ message: 'Token tidak ada' }, 401, cors)
      const user = await authMe(env, header.slice(7))
      if (!user) return json({ message: 'Token tidak valid' }, 401, cors)
      return json(user, 200, cors)
    }

    if (path === '/api/auth/track-login' && request.method === 'POST') {
      return json({ ok: true, sessionId: `sess-${Date.now().toString(36)}` }, 200, cors)
    }

    return json({ message: 'Endpoint belum tersedia di Worker', path }, 404, cors)
  },
}
