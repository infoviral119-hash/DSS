import type { Env, AuthUser } from './shared'
import { dbClient, userClient } from './shared'

export async function authMe(env: Env, token: string): Promise<AuthUser | null> {
  const admin = dbClient(env)
  const { data: authData, error } = await admin.auth.getUser(token)
  if (error || !authData.user) return null

  const user = authData.user
  const email = user.email ?? ''
  const fullName = String(user.user_metadata?.full_name ?? email.split('@')[0] ?? 'User')
  const userDb = userClient(env, token)

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

export async function requireAuth(request: Request, env: Env): Promise<AuthUser | Response> {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ message: 'Token tidak ada' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  const user = await authMe(env, header.slice(7))
  if (!user) {
    return new Response(JSON.stringify({ message: 'Token tidak valid' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  return user
}
