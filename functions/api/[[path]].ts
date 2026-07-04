import { corsHeaders, json } from '../lib/shared'
import { handleLocal } from '../lib/router'

interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  BACKEND_URL?: string
  CORS_ORIGIN?: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/$/, '') || '/'
  const origin = request.headers.get('Origin')
  const cors = corsHeaders(origin, env)

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return json({ message: 'Supabase belum dikonfigurasi di Cloudflare Pages' }, 502, cors)
  }

  const local = await handleLocal(path, request, env, url, cors)
  if (local) return local

  const backend = env.BACKEND_URL?.replace(/\/$/, '')
  if (!backend) {
    return json({ message: 'Endpoint belum tersedia di Pages Functions', path }, 503, cors)
  }

  const target = `${backend}${url.pathname}${url.search}`
  const headers = new Headers(request.headers)
  headers.delete('host')
  const init: RequestInit = { method: request.method, headers, redirect: 'manual' }
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body

  try {
    const response = await fetch(target, init)
    const outHeaders = new Headers(response.headers)
    outHeaders.delete('content-encoding')
    Object.entries(cors).forEach(([k, v]) => outHeaders.set(k, v))
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: outHeaders })
  } catch (err) {
    return json({ message: 'Proxy gagal', target, error: String(err) }, 502, cors)
  }
}
