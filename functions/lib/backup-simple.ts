import type { Env } from './shared'
import { dbClient } from './shared'

function mapJob(j: Record<string, unknown>) {
  return {
    id: j.id, name: j.name, backupType: j.backup_type, jobType: j.backup_type,
    targets: j.targets ?? [], repositoryId: j.repository_id, compression: j.compression,
    encryptionEnabled: j.encryption_enabled, encryption: j.encryption_enabled ? 'AES-256' : 'Off',
    enabled: j.enabled, lastRunAt: j.last_run_at, lastStatus: j.last_status,
    createdAt: j.created_at, updatedAt: j.updated_at, createdBy: '-',
    progress: j.last_status === 'running' ? 65 : j.last_status === 'completed' ? 100 : 0,
    priority: 'normal', retryCount: 3,
    verification: j.last_status === 'completed' ? 'Passed' : j.last_status === 'failed' ? 'Failed' : 'Pending',
  }
}

export async function getDashboard(env: Env) {
  const db = dbClient(env)
  const [health, repos, history, restoreHist, jobs, points] = await Promise.all([
    db.from('backup_health').select('*').order('computed_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('backup_repository').select('*').is('deleted_at', null),
    db.from('backup_history').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(60),
    db.from('restore_history').select('*').order('created_at', { ascending: false }).limit(30),
    db.from('backup_jobs').select('*').is('deleted_at', null),
    db.from('recovery_points').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(20),
  ])
  const hist = history.data ?? []
  const successCount = hist.filter((h) => h.status === 'completed').length
  const failedCount = hist.filter((h) => h.status === 'failed').length
  const runningCount = (jobs.data ?? []).filter((j) => j.last_status === 'running').length
  let healthScore = 100
  if (failedCount > 0) healthScore -= Math.min(30, failedCount * 10)
  if (!points.data?.length) healthScore -= 25
  healthScore = Math.max(0, healthScore)
  return {
    healthScore, successCount, failedCount, runningCount,
    lastBackupAt: points.data?.[0]?.created_at ?? health.data?.last_backup_at,
    totalJobs: jobs.data?.length ?? 0, recoveryPoints: points.data?.length ?? 0,
    repositories: (repos.data ?? []).length, restoreCount: restoreHist.data?.length ?? 0,
    status: healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Warning' : 'Critical',
  }
}

export async function listJobs(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('backup_jobs').select('*').is('deleted_at', null).order('created_at', { ascending: false })
  return (data ?? []).map((j) => mapJob(j as Record<string, unknown>))
}

export async function getJob(env: Env, id: string) {
  const db = dbClient(env)
  const { data } = await db.from('backup_jobs').select('*').eq('id', id).maybeSingle()
  if (!data) throw new Error('Job tidak ditemukan')
  return mapJob(data as Record<string, unknown>)
}

export async function getMeta(env: Env) {
  return { appVersion: '1.0.0', backupEngine: 'supabase-export', storage: 'cloud' }
}

export async function listRecoveryPoints(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('recovery_points').select('*').is('deleted_at', null).order('created_at', { ascending: false })
  return (data ?? []).map((p) => ({
    id: p.id, label: p.label, backupType: p.backup_type, status: p.status,
    sizeKb: p.size_kb, createdAt: p.created_at, expiresAt: p.expires_at,
  }))
}

export async function getRecoveryPoint(env: Env, id: string) {
  const db = dbClient(env)
  const { data } = await db.from('recovery_points').select('*').eq('id', id).maybeSingle()
  if (!data) throw new Error('Recovery point tidak ditemukan')
  return data
}

export async function listHistory(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('backup_history').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(100)
  return data ?? []
}

export async function listRestoreHistory(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('restore_history').select('*').order('created_at', { ascending: false }).limit(50)
  return data ?? []
}

export async function listRepositories(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('backup_repository').select('*').is('deleted_at', null).order('name')
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, repoType: r.repo_type, path: r.path, capacityGb: r.capacity_gb,
    usedGb: r.used_gb, status: r.status, health: r.health ?? 'Healthy',
  }))
}

export async function getRepository(env: Env, id: string) {
  const db = dbClient(env)
  const { data } = await db.from('backup_repository').select('*').eq('id', id).maybeSingle()
  if (!data) throw new Error('Repository tidak ditemukan')
  return data
}

export async function getStorage(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('backup_repository').select('used_gb, capacity_gb').is('deleted_at', null)
  const used = (data ?? []).reduce((s, r) => s + Number(r.used_gb ?? 0), 0)
  const capacity = (data ?? []).reduce((s, r) => s + Number(r.capacity_gb ?? 0), 0) || 100
  return { usedGb: used, capacityGb: capacity, usagePercent: capacity ? Math.round((used / capacity) * 100) : 0 }
}

export async function getHealth(env: Env) {
  const dash = await getDashboard(env)
  return { score: dash.healthScore, status: dash.status, database: 'Connected' }
}

export async function handleBackup(
  path: string, method: string, env: Env, body?: Record<string, unknown>,
): Promise<unknown | null> {
  if (path === '/api/backup/dashboard' && method === 'GET') return getDashboard(env)
  if (path === '/api/backup/jobs' && method === 'GET') return listJobs(env)
  const jobDetail = path.match(/^\/api\/backup\/jobs\/([^/]+)$/)
  if (jobDetail && method === 'GET' && !path.includes('/logs') && !path.includes('/clone')) return getJob(env, jobDetail[1])
  if (path === '/api/backup/meta' && method === 'GET') return getMeta(env)
  if (path === '/api/backup/recovery' && method === 'GET') return listRecoveryPoints(env)
  const recoveryDetail = path.match(/^\/api\/backup\/recovery\/([^/]+)$/)
  if (recoveryDetail && method === 'GET') return getRecoveryPoint(env, recoveryDetail[1])
  if (path === '/api/backup/history' && method === 'GET') return listHistory(env)
  if (path === '/api/backup/restore-history' && method === 'GET') return listRestoreHistory(env)
  if (path === '/api/backup/repository' && method === 'GET') return listRepositories(env)
  const repoDetail = path.match(/^\/api\/backup\/repository\/([^/]+)$/)
  if (repoDetail && method === 'GET') return getRepository(env, repoDetail[1])
  if (path === '/api/backup/storage' && method === 'GET') return getStorage(env)
  if (path === '/api/backup/health' && method === 'GET') return getHealth(env)
  if (path === '/api/backup/run' && method === 'POST') return { ok: true, message: 'Backup manual dijadwalkan (simulasi)' }
  if (path === '/api/backup/restore/preview' && method === 'POST') return { ok: true, preview: body }
  if (path === '/api/backup/restore' && method === 'POST') return { ok: false, message: 'Restore penuh membutuhkan backend dengan filesystem' }
  return null
}
