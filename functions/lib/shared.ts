import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type Env = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  BACKEND_URL?: string
  CORS_ORIGIN?: string
  OPENAI_API_KEY?: string
  AI_API_KEY?: string
  OPENAI_BASE_URL?: string
  AI_MODEL?: string
  AI_PROVIDER?: string
  AI_LLM_ENABLED?: string
  ML_SERVICE_URL?: string
}

export type AuthUser = {
  id: string
  email: string
  fullName: string
  role: string
  dataScope?: string
  scopeRegion?: string | null
  canRevealPii?: boolean
}

export function corsHeaders(origin: string | null, env: Env) {
  const allowed = (env.CORS_ORIGIN || 'https://e-insight.pages.dev').split(',').map((s) => s.trim())
  const ok = origin && (allowed.includes(origin) || allowed.includes('*') || origin.endsWith('.pages.dev'))
  return {
    'Access-Control-Allow-Origin': ok ? origin! : allowed[0],
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

export function dbClient(env: Env): SupabaseClient {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
  return createClient(env.SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function userClient(env: Env, token: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function queryParams(url: URL): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  url.searchParams.forEach((v, k) => { out[k] = v })
  return out
}

export function fileResponse(
  body: string | Uint8Array,
  contentType: string,
  filename: string,
  headers: Record<string, string> = {},
) {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...headers,
    },
  })
}
