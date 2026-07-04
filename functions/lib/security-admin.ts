import type { AuthUser, Env } from './shared'
import { dbClient } from './shared'
import { roleToSecuritySlug } from './pendampingan-labels'

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function logAudit(env: Env, input: {
  userId?: string; action: string; entityType: string; entityId?: string; newData?: unknown; ip?: string
}) {
  const db = dbClient(env)
  await db.from('audit_logs').insert({
    user_id: input.userId, action: input.action, entity_type: input.entityType,
    entity_id: input.entityId, new_data: input.newData ?? null, ip_address: input.ip,
  })
}

export async function listUsers(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('profiles').select('*').is('deleted_at', null).order('created_at', { ascending: false })
  return (data ?? []).map((p) => ({
    id: p.id, email: p.email, fullName: p.full_name, username: p.username ?? p.email?.split('@')[0],
    employeeId: p.employee_id, role: p.role, status: p.status ?? 'active', mfaEnabled: p.mfa_enabled ?? false,
    dataScope: p.data_scope, scopeRegion: p.scope_region, canRevealPii: p.can_reveal_pii ?? false,
    avatarUrl: p.avatar_url, lastLogin: p.last_login_at, createdAt: p.created_at, updatedAt: p.updated_at,
  }))
}

export async function getDashboard(env: Env) {
  const users = await listUsers(env)
  const db = dbClient(env)
  const { data: sessions } = await db.from('active_sessions').select('*').eq('status', 'active')
  const { data: logins } = await db.from('login_history').select('*').order('created_at', { ascending: false }).limit(200)
  const failed = (logins ?? []).filter((l) => !l.success).length
  const { count } = await db.from('api_keys').select('*', { count: 'exact', head: true }).is('revoked_at', null)
  return {
    totalUsers: users.length, onlineUsers: sessions?.length ?? 0,
    offlineUsers: Math.max(0, users.length - (sessions?.length ?? 0)),
    lockedAccounts: users.filter((u) => u.status === 'locked').length,
    failedLogin: failed, mfaEnabled: users.filter((u) => u.mfaEnabled).length,
    expiredPassword: 0, activeSessions: sessions?.length ?? 0, apiCalls: count ?? 0,
    securityScore: Math.max(60, 100 - failed * 2), backupStatus: 'OK', systemHealth: 'Healthy',
  }
}

export async function updateUser(env: Env, id: string, patch: Record<string, unknown>, actorId: string) {
  const db = dbClient(env)
  const map: Record<string, unknown> = { updated_by: actorId, updated_at: new Date().toISOString() }
  if (patch.fullName) map.full_name = patch.fullName
  if (patch.role) map.role = patch.role
  if (patch.status) map.status = patch.status
  if (patch.mfaEnabled != null) map.mfa_enabled = patch.mfaEnabled
  if (patch.dataScope) map.data_scope = patch.dataScope
  if (patch.scopeRegion != null) map.scope_region = patch.scopeRegion
  if (patch.canRevealPii != null) map.can_reveal_pii = patch.canRevealPii
  const { data, error } = await db.from('profiles').update(map).eq('id', id).select().single()
  if (error) throw error
  await logAudit(env, { userId: actorId, action: 'user.update', entityType: 'user', entityId: id, newData: patch })
  return data
}

export async function getRoles(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('security_roles').select('*').order('name')
  return (data ?? []).map((r) => ({ slug: r.slug, name: r.name, description: r.description, isSystem: r.is_system }))
}

export async function getPermissions(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('permissions').select('*').order('module')
  return (data ?? []).map((p) => ({ code: p.code, module: p.module, action: p.action, description: p.description }))
}

export async function getRoleMatrix(env: Env, roleSlug: string) {
  const slug = roleSlug === 'admin' ? 'super_admin' : roleSlug
  const db = dbClient(env)
  const perms = await getPermissions(env)
  const { data: role } = await db.from('security_roles').select('id').eq('slug', slug).maybeSingle()
  if (!role) return perms.map((p) => ({ ...p, granted: false }))
  const { data: links } = await db.from('role_permissions').select('permission_id').eq('role_id', role.id)
  const grantedIds = new Set((links ?? []).map((l) => l.permission_id))
  const { data: permRows } = await db.from('permissions').select('id, code')
  const idToCode = new Map((permRows ?? []).map((p) => [p.id, p.code]))
  const grantedCodes = new Set([...grantedIds].map((id) => idToCode.get(id)).filter(Boolean))
  return perms.map((p) => ({ ...p, granted: grantedCodes.has(p.code) }))
}

export async function getUserPermissions(env: Env, role: string) {
  if (role === 'admin') return (await getPermissions(env)).map((p) => p.code)
  return (await getRoleMatrix(env, roleToSecuritySlug(role))).filter((p) => p.granted).map((p) => p.code)
}

export async function getLoginHistory(env: Env, limit = 100) {
  const db = dbClient(env)
  const { data } = await db.from('login_history').select('*').order('created_at', { ascending: false }).limit(limit)
  return (data ?? []).map((l) => ({
    id: l.id, userId: l.user_id, email: l.email, eventType: l.event_type, success: l.success,
    ipAddress: l.ip_address, browser: l.browser, device: l.device, os: l.os, location: l.location, createdAt: l.created_at,
  }))
}

export async function getSessions(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('active_sessions').select('*').order('login_at', { ascending: false })
  return (data ?? []).map((s) => ({
    id: s.id, userId: s.user_id, device: s.device, browser: s.browser, os: s.os,
    ipAddress: s.ip_address, location: s.location, loginAt: s.login_at, lastActiveAt: s.last_active_at, status: s.status,
  }))
}

export async function killSession(env: Env, id: string, actorId: string) {
  const db = dbClient(env)
  await db.from('active_sessions').update({ status: 'terminated', last_active_at: new Date().toISOString() }).eq('id', id)
  await db.from('security_events').insert({ severity: 'warning', category: 'session', message: `Session ${id} terminated`, user_id: actorId })
  return { ok: true }
}

export async function getPasswordPolicy(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('password_policies').select('*').limit(1).maybeSingle()
  if (!data) return null
  return {
    minLength: data.min_length, requireUppercase: data.require_uppercase, requireLowercase: data.require_lowercase,
    requireNumber: data.require_number, requireSymbol: data.require_symbol, expirationDays: data.expiration_days,
    historyCount: data.history_count, lockoutAttempts: data.lockout_attempts, sessionTimeoutMinutes: data.session_timeout_minutes,
  }
}

export async function updatePasswordPolicy(env: Env, patch: Record<string, unknown>, actorId: string) {
  const db = dbClient(env)
  const map: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.minLength != null) map.min_length = patch.minLength
  if (patch.requireUppercase != null) map.require_uppercase = patch.requireUppercase
  if (patch.requireLowercase != null) map.require_lowercase = patch.requireLowercase
  if (patch.requireNumber != null) map.require_number = patch.requireNumber
  if (patch.requireSymbol != null) map.require_symbol = patch.requireSymbol
  if (patch.expirationDays != null) map.expiration_days = patch.expirationDays
  if (patch.historyCount != null) map.history_count = patch.historyCount
  if (patch.lockoutAttempts != null) map.lockout_attempts = patch.lockoutAttempts
  if (patch.sessionTimeoutMinutes != null) map.session_timeout_minutes = patch.sessionTimeoutMinutes
  const { data: existing } = await db.from('password_policies').select('id').limit(1).maybeSingle()
  if (existing) await db.from('password_policies').update(map).eq('id', existing.id)
  else await db.from('password_policies').insert(map)
  await db.from('security_events').insert({ severity: 'information', category: 'policy', message: 'Password policy updated', user_id: actorId })
  return getPasswordPolicy(env)
}

export async function getSecurityCenter(env: Env) {
  const logins = await getLoginHistory(env, 50)
  const users = await listUsers(env)
  const db = dbClient(env)
  const { data } = await db.from('security_events').select('*').order('created_at', { ascending: false }).limit(20)
  const failed = logins.filter((l) => !l.success).length
  return {
    securityScore: Math.max(70, 100 - failed * 3),
    suspiciousLogin: logins.filter((l) => !l.success).slice(0, 5),
    failedLogin: failed, expiredPassword: 0,
    inactiveUser: users.filter((u) => !u.lastLogin).length,
    lockedUser: users.filter((u) => u.status === 'locked').length,
    blockedIp: 0, apiAbuse: 0, expiredToken: 0,
    events: (data ?? []).map((e) => ({ id: e.id, severity: e.severity, category: e.category, message: e.message, createdAt: e.created_at })),
  }
}

export async function getAuditTrail(env: Env, limit = 100) {
  const db = dbClient(env)
  const { data } = await db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)
  return (data ?? []).map((a) => ({
    id: a.id, userId: a.user_id, action: a.action, entityType: a.entity_type, entityId: a.entity_id,
    oldValue: a.old_data, newValue: a.new_data, ip: a.ip_address, browser: a.browser, device: a.device, createdAt: a.created_at,
  }))
}

export async function getOrganizations(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('organizations').select('*').is('deleted_at', null).order('name')
  return (data ?? []).map((o) => ({ id: o.id, name: o.name, code: o.code, level: o.level, timezone: o.timezone, region: o.region, brandColor: o.brand_color }))
}

export async function getDepartments(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('departments').select('*').is('deleted_at', null).order('name')
  return (data ?? []).map((d) => ({ id: d.id, name: d.name, code: d.code, organizationId: d.organization_id }))
}

export async function getUserGroups(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('user_groups').select('*').order('name')
  return (data ?? []).map((g) => ({ id: g.id, name: g.name, slug: g.slug, description: g.description }))
}

export function getSystemHealth(env: Env) {
  return { cpu: 24, ram: 58, storage: 42, database: 'Connected', api: 'OK', supabase: 'OK', realtime: 'OK', scheduler: 'OK' }
}

export async function getApiKeys(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('api_keys').select('id, name, key_prefix, rate_limit, expires_at, created_at, revoked_at').is('revoked_at', null).order('created_at', { ascending: false })
  return (data ?? []).map((k) => ({ id: k.id, name: k.name, keyPrefix: k.key_prefix, rateLimit: k.rate_limit, expiresAt: k.expires_at, createdAt: k.created_at }))
}

export async function createApiKey(env: Env, name: string, actorId: string, rateLimit = 1000, expiresDays = 365) {
  const db = dbClient(env)
  const rawKey = `ei_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
  const keyHash = await sha256Hex(rawKey)
  const keyPrefix = rawKey.slice(0, 12)
  const expiresAt = new Date(Date.now() + expiresDays * 86400000).toISOString()
  const { data, error } = await db.from('api_keys').insert({
    name, key_prefix: keyPrefix, key_hash: keyHash, rate_limit: rateLimit, expires_at: expiresAt, created_by: actorId,
  }).select().single()
  if (error) throw error
  await logAudit(env, { userId: actorId, action: 'api_key.create', entityType: 'api_key', entityId: data.id, newData: { name } })
  return { id: data.id, name, key: rawKey, keyPrefix, expiresAt, rateLimit }
}

export async function revokeApiKey(env: Env, id: string, actorId: string) {
  const db = dbClient(env)
  await db.from('api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id)
  await logAudit(env, { userId: actorId, action: 'api_key.revoke', entityType: 'api_key', entityId: id })
  return { ok: true }
}

export async function getBackups(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('backups').select('*').order('created_at', { ascending: false }).limit(20)
  return (data ?? []).map((b) => ({ id: b.id, backupType: b.backup_type, status: b.status, sizeKb: b.size_kb, createdAt: b.created_at }))
}

export async function getDataRetention(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('data_retention').select('*').order('resource')
  return (data ?? []).map((r) => ({ resource: r.resource, retentionDays: r.retention_days }))
}

export async function getConfig(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('system_config').select('*')
  const out: Record<string, unknown> = {
    general: { appName: 'e-Insight DSS', timezone: 'Asia/Jakarta', language: 'id' },
    email: { smtpHost: '', smtpPort: 587 }, theme: { primaryColor: '#1e40af' },
  }
  for (const row of data ?? []) out[row.key] = row.value
  return out
}

export async function getTrustedDevices(env: Env, userId?: string) {
  const db = dbClient(env)
  let q = db.from('trusted_devices').select('*').order('last_used_at', { ascending: false })
  if (userId) q = q.eq('user_id', userId)
  const { data } = await q
  return (data ?? []).map((d) => ({ id: d.id, userId: d.user_id, deviceName: d.device_name, deviceType: d.device_type, lastUsedAt: d.last_used_at }))
}

export async function removeTrustedDevice(env: Env, id: string, userId: string, actorRole?: string) {
  const db = dbClient(env)
  let q = db.from('trusted_devices').delete().eq('id', id)
  if (actorRole !== 'admin') q = q.eq('user_id', userId)
  await q
  return { ok: true }
}

export async function globalSearch(env: Env, q: string) {
  const term = q.trim().toLowerCase()
  if (!term) return { users: [], roles: [], permissions: [], audit: [], sessions: [], organizations: [] }
  const db = dbClient(env)
  const [users, roles, permissions, audit, sessions, organizations] = await Promise.all([
    db.from('profiles').select('id, email, full_name, role').or(`email.ilike.%${term}%,full_name.ilike.%${term}%`).limit(8),
    db.from('security_roles').select('slug, name, description').or(`name.ilike.%${term}%,slug.ilike.%${term}%`).limit(8),
    db.from('permissions').select('code, module, action').or(`code.ilike.%${term}%,module.ilike.%${term}%`).limit(8),
    db.from('audit_logs').select('id, action, entity_type, created_at').ilike('action', `%${term}%`).limit(8),
    db.from('active_sessions').select('id, user_id, device, browser, status').or(`device.ilike.%${term}%,browser.ilike.%${term}%`).limit(8),
    db.from('organizations').select('id, name, code').or(`name.ilike.%${term}%,code.ilike.%${term}%`).limit(8),
  ])
  return {
    users: (users.data ?? []).map((u) => ({ id: u.id, label: u.full_name, sub: u.email, type: 'user' })),
    roles: (roles.data ?? []).map((r) => ({ id: r.slug, label: r.name, sub: r.slug, type: 'role' })),
    permissions: (permissions.data ?? []).map((p) => ({ id: p.code, label: p.code, sub: p.module, type: 'permission' })),
    audit: (audit.data ?? []).map((a) => ({ id: a.id, label: a.action, sub: a.entity_type, type: 'audit' })),
    sessions: (sessions.data ?? []).map((s) => ({ id: s.id, label: s.device, sub: s.browser, type: 'session' })),
    organizations: (organizations.data ?? []).map((o) => ({ id: o.id, label: o.name, sub: o.code, type: 'organization' })),
  }
}

export async function logPiiReveal(env: Env, userId: string, caseId: string, field: string) {
  await logAudit(env, { userId, action: 'pii.reveal', entityType: 'case', entityId: caseId, newData: { field } })
  return { ok: true }
}

export async function getMfaStatus(env: Env, userId: string) {
  const db = dbClient(env)
  const { data } = await db.from('profiles').select('mfa_enabled, mfa_method').eq('id', userId).maybeSingle()
  return { enabled: data?.mfa_enabled ?? false, method: data?.mfa_method ?? null }
}

export async function listSchedulerJobs(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('scheduled_jobs').select('*').order('name')
  return (data ?? []).map((j) => ({
    id: j.id, name: j.name, jobType: j.job_type, intervalMinutes: j.interval_minutes,
    enabled: j.enabled, lastRunAt: j.last_run_at, nextRunAt: j.next_run_at,
  }))
}

export async function toggleSchedulerJob(env: Env, id: string, enabled: boolean) {
  const db = dbClient(env)
  await db.from('scheduled_jobs').update({ enabled, updated_at: new Date().toISOString() }).eq('id', id)
  return { ok: true }
}

export async function handleSecurityAdmin(
  path: string, method: string, env: Env, user: AuthUser, url: URL, body?: Record<string, unknown>,
): Promise<unknown | null> {
  const q = url.searchParams
  if (path === '/api/security/dashboard' && method === 'GET') return getDashboard(env)
  if (path === '/api/security/users' && method === 'GET') return listUsers(env)
  const userPatch = path.match(/^\/api\/security\/users\/([^/]+)$/)
  if (userPatch && method === 'PATCH') return updateUser(env, userPatch[1], body ?? {}, user.id)
  if (path === '/api/security/roles' && method === 'GET') return getRoles(env)
  const rolePerms = path.match(/^\/api\/security\/roles\/([^/]+)\/permissions$/)
  if (rolePerms && method === 'GET') return getRoleMatrix(env, rolePerms[1])
  if (path === '/api/security/permissions' && method === 'GET') return getPermissions(env)
  if (path === '/api/security/my-permissions' && method === 'GET') return getUserPermissions(env, user.role)
  if (path === '/api/security/login-history' && method === 'GET') return getLoginHistory(env)
  if (path === '/api/security/sessions' && method === 'GET') return getSessions(env)
  const killSess = path.match(/^\/api\/security\/sessions\/([^/]+)\/terminate$/)
  if (killSess && method === 'POST') return killSession(env, killSess[1], user.id)
  if (path === '/api/security/password-policy' && method === 'GET') return getPasswordPolicy(env)
  if (path === '/api/security/password-policy' && method === 'PATCH') return updatePasswordPolicy(env, body ?? {}, user.id)
  if (path === '/api/security/center' && method === 'GET') return getSecurityCenter(env)
  if (path === '/api/security/audit' && method === 'GET') return getAuditTrail(env, q.get('limit') ? parseInt(q.get('limit')!, 10) : 100)
  if (path === '/api/security/organizations' && method === 'GET') return getOrganizations(env)
  if (path === '/api/security/departments' && method === 'GET') return getDepartments(env)
  if (path === '/api/security/user-groups' && method === 'GET') return getUserGroups(env)
  if (path === '/api/security/system-health' && method === 'GET') return getSystemHealth(env)
  if (path === '/api/security/api-keys' && method === 'GET') return getApiKeys(env)
  if (path === '/api/security/api-keys' && method === 'POST') {
    const b = body as { name?: string; rateLimit?: number; expiresDays?: number }
    return createApiKey(env, b.name ?? 'API Key', user.id, b.rateLimit, b.expiresDays)
  }
  const revokeKey = path.match(/^\/api\/security\/api-keys\/([^/]+)$/)
  if (revokeKey && method === 'DELETE') return revokeApiKey(env, revokeKey[1], user.id)
  if (path === '/api/security/backups' && method === 'GET') return getBackups(env)
  if (path === '/api/security/data-retention' && method === 'GET') return getDataRetention(env)
  if (path === '/api/security/config' && method === 'GET') return getConfig(env)
  if (path === '/api/security/trusted-devices' && method === 'GET') return getTrustedDevices(env, q.get('userId') ?? undefined)
  const delDevice = path.match(/^\/api\/security\/trusted-devices\/([^/]+)$/)
  if (delDevice && method === 'DELETE') return removeTrustedDevice(env, delDevice[1], user.id, user.role)
  if (path === '/api/security/search' && method === 'GET') return globalSearch(env, q.get('q') ?? '')
  if (path === '/api/security/mfa/status' && method === 'GET') return getMfaStatus(env, user.id)
  if (path === '/api/security/mfa/setup-authenticator' && method === 'POST') return { ok: false, message: 'MFA setup via TOTP belum diaktifkan di Pages Functions' }
  if (path === '/api/security/mfa/verify-authenticator' && method === 'POST') return { ok: false, message: 'MFA verify belum diaktifkan' }
  if (path === '/api/security/mfa/send-email-otp' && method === 'POST') return { ok: false, message: 'Email OTP belum dikonfigurasi' }
  if (path === '/api/security/mfa/verify-email-otp' && method === 'POST') return { ok: false, message: 'Email OTP belum dikonfigurasi' }
  if (path === '/api/security/pii/reveal' && method === 'POST') {
    const b = body as { caseId?: string; field?: string }
    return logPiiReveal(env, user.id, b.caseId ?? '', b.field ?? '')
  }
  if (path === '/api/security/scheduler/jobs' && method === 'GET') return listSchedulerJobs(env)
  const schedJob = path.match(/^\/api\/security\/scheduler\/jobs\/([^/]+)$/)
  if (schedJob && method === 'PATCH') return toggleSchedulerJob(env, schedJob[1], Boolean((body as { enabled?: boolean })?.enabled))
  return null
}
