import type { AuthUser, Env } from './shared'
import { fileResponse, queryParams } from './shared'
import { getOverview, getTrends, getDemographics } from './analytics'
import { getIntelligence as getAiIntelligence } from './ai-simple'
import { getIntelligence as getForecastIntelligence } from './forecast-simple'
import { getMapData, getInsights as getGisInsights, getStats as getGisStats } from './gis'
import { findAll, getStats } from './cases'
import { buildPrintHtml, buildReportIntelligence, docHashForReport, periodLabelFromQuery } from './report-engine'

type Schedule = {
  id: string; name: string; frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'yearly'
  category: string; format: string; email: string; filters: Record<string, string>
  enabled: boolean; nextRun: string; lastRun?: string; createdBy: string; createdAt: string
}

type Layout = { id: string; name: string; widgets: string[]; createdBy: string; createdAt: string; updatedAt: string }
type Version = { id: string; reportId: string; version: string; snapshot: Record<string, unknown>; createdBy: string; createdAt: string; note?: string }
type Approval = { reportId: string; status: 'draft' | 'review' | 'approved' | 'published'; reviewer: string | null; reviewedAt: string | null; note: string; history: { status: string; by: string; at: string; note?: string }[] }
type AuditEntry = { id: string; action: string; user: string; reportId?: string; format?: string; at: string; detail?: string }
type ShareLink = { id: string; token: string; reportId: string; passwordHash?: string; permission: 'read' | 'edit'; watermark: string; expiresAt: string; createdBy: string; createdAt: string; accessCount: number }
type HistoryEntry = { id: string; createdAt: string; createdBy: string; category: string; format: string; period: string; sizeKb: number; version: string; status: string }

const schedules = new Map<string, Schedule>()
const layouts = new Map<string, Layout>()
const versions = new Map<string, Version>()
const approvals = new Map<string, Approval>()
const shares = new Map<string, ShareLink>()
const auditLog: AuditEntry[] = []
const historyLog: HistoryEntry[] = []

function calcNextRun(frequency: Schedule['frequency']) {
  const d = new Date()
  if (frequency === 'daily') d.setDate(d.getDate() + 1)
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7)
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (frequency === 'quarterly') d.setMonth(d.getMonth() + 3)
  else if (frequency === 'semester') d.setMonth(d.getMonth() + 6)
  else d.setFullYear(d.getFullYear() + 1)
  return d.toISOString()
}

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function addAudit(entry: Omit<AuditEntry, 'id'>) {
  const item: AuditEntry = { ...entry, id: `AUD-${Date.now().toString(36)}` }
  auditLog.unshift(item)
  if (auditLog.length > 500) auditLog.length = 500
  return item
}

async function loadGisBundle(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const [stats, map, insights] = await Promise.all([
    getGisStats(env, query, user).catch(() => ({})),
    getMapData(env, query, user).catch(() => ({})),
    getGisInsights(env, query, user).catch(() => ({ insights: [] })),
  ])
  const mapData = map as {
    total?: number; withGps?: number; points?: unknown[]
    kabupatenStats?: { name: string; count: number; aktif: number; selesai: number }[]
    clusters?: unknown[]
  }
  return {
    total: mapData.total ?? (stats as { totalMarker?: number }).totalMarker ?? 0,
    withGps: mapData.withGps ?? (stats as { gpsValid?: number }).gpsValid ?? 0,
    coverage: (stats as { coverage?: number }).coverage ?? 0,
    points: (mapData.points ?? []).slice(0, 200),
    kabupatenStats: mapData.kabupatenStats ?? [],
    clusters: mapData.clusters ?? [],
    insights: (insights as { insights?: string[] }).insights ?? [],
    topKabupaten: (mapData.kabupatenStats ?? []).slice(0, 8),
  }
}

export async function getIntelligence(env: Env, query: Record<string, string | undefined>, createdBy?: string, user?: AuthUser | null) {
  const reportId = query.reportId
  const approval = reportId ? approvals.get(reportId) : undefined
  const versionList = reportId
    ? [...versions.values()].filter((v) => v.reportId === reportId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : []
  const version = versionList[0]?.version ?? query.version ?? '1.0'

  const [overview, trends, demographics, ai, gisStats, forecastRaw] = await Promise.all([
    getOverview(env, query),
    getTrends(env, query),
    getDemographics(env, query),
    getAiIntelligence(env, query),
    loadGisBundle(env, query, user),
    getForecastIntelligence(env, { ...query, horizon: '6' }).catch(() => null),
  ])

  const forecast = forecastRaw && !(forecastRaw as { insufficient?: boolean }).insufficient
    ? {
      model: (forecastRaw as { modelName?: string }).modelName,
      nextMonth: (forecastRaw as { forecast?: { values?: number[] } }).forecast?.values?.[0]
        ? { predicted: (forecastRaw as { forecast?: { values?: number[] } }).forecast!.values![0] }
        : undefined,
      nextQuarter: (forecastRaw as { forecast?: { values?: number[] } }).forecast?.values?.slice(0, 3).reduce((a, b) => a + b, 0),
      metrics: (forecastRaw as { metrics?: unknown }).metrics,
      trendClass: (forecastRaw as { trend?: string }).trend,
      narrative: (forecastRaw as { summary?: string }).summary,
      series: (forecastRaw as { historical?: { labels?: string[]; values?: number[] } }).historical,
      confidenceLevel: (forecastRaw as { confidence?: number }).confidence,
    }
    : undefined

  const total = Number(overview.total ?? 0)
  const hash = await docHashForReport(reportId || `RPT-${Date.now()}`, version, total)
  const report = buildReportIntelligence({
    query, overview, trends, demographics, ai: ai as Parameters<typeof buildReportIntelligence>[0]['ai'],
    gisStats, forecast, createdBy, docHash: hash,
    approval: approval ? { status: approval.status, reviewer: approval.reviewer, reviewedAt: approval.reviewedAt, note: approval.note, history: approval.history } : undefined,
    version,
  })

  addAudit({ action: 'view', user: createdBy ?? 'system', reportId: String(report.reportId), at: new Date().toISOString() })
  return { ...report, versionHistory: versionList.slice(0, 10) }
}

function buildCsv(data: Record<string, unknown>[]) {
  const headers = [
    'nomor_register', 'tanggal', 'nama_korban', 'jenis_kelamin', 'usia',
    'jenis_kekerasan', 'kabupaten', 'kecamatan', 'kelurahan', 'status',
    'psikolog_nama', 'tahun', 'kategori',
  ]
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '\uFEFF' + [headers.join(','), ...data.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n')
}

function logExport(input: { createdBy: string; category: string; format: string; period: string; sizeKb: number; reportId?: string }) {
  addAudit({ action: 'export', user: input.createdBy, reportId: input.reportId, format: input.format, at: new Date().toISOString(), detail: input.period })
  const entry: HistoryEntry = {
    id: `HIS-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    category: input.category,
    format: input.format,
    period: input.period,
    sizeKb: input.sizeKb,
    version: '1.0',
    status: 'draft',
  }
  historyLog.unshift(entry)
  if (historyLog.length > 200) historyLog.length = 200
  return entry
}

export async function handleReports(
  path: string,
  method: string,
  env: Env,
  user: AuthUser | null,
  url: URL,
  body?: Record<string, unknown>,
  cors: Record<string, string> = {},
): Promise<unknown | Response | null> {
  const q = queryParams(url)
  const userName = user?.fullName || user?.email || 'operator'

  if (path === '/api/reports/intelligence' && method === 'GET') {
    return getIntelligence(env, q, userName, user)
  }

  if (path === '/api/reports/history' && method === 'GET') {
    return historyLog.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50)
  }

  if (path === '/api/reports/audit' && method === 'GET') {
    return auditLog.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100)
  }

  if (path === '/api/reports/history/log' && method === 'POST') {
    return logExport({
      createdBy: userName,
      category: String(body?.category ?? q.category ?? 'executive'),
      format: String(body?.format ?? 'pdf'),
      period: periodLabelFromQuery(q),
      sizeKb: Number(body?.sizeKb ?? 0),
      reportId: body?.reportId ? String(body.reportId) : undefined,
    })
  }

  if (path === '/api/reports/schedules' && method === 'GET') {
    return [...schedules.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  if (path === '/api/reports/schedules' && method === 'POST') {
    const item: Schedule = {
      id: `SCH-${Date.now().toString(36)}`,
      name: String(body?.name ?? 'Jadwal'),
      frequency: (body?.frequency as Schedule['frequency']) ?? 'monthly',
      category: String(body?.category ?? 'executive'),
      format: String(body?.format ?? 'pdf'),
      email: String(body?.email ?? ''),
      filters: (body?.filters as Record<string, string>) ?? {},
      enabled: true,
      nextRun: calcNextRun((body?.frequency as Schedule['frequency']) ?? 'monthly'),
      createdBy: userName,
      createdAt: new Date().toISOString(),
    }
    schedules.set(item.id, item)
    addAudit({ action: 'schedule_create', user: userName, at: new Date().toISOString(), detail: item.name })
    return item
  }

  const delSchedule = path.match(/^\/api\/reports\/schedules\/([^/]+)$/)
  if (delSchedule && method === 'DELETE') {
    schedules.delete(delSchedule[1])
    addAudit({ action: 'schedule_delete', user: userName, at: new Date().toISOString(), detail: delSchedule[1] })
    return { ok: true }
  }

  const runSchedule = path.match(/^\/api\/reports\/schedules\/([^/]+)\/run$/)
  if (runSchedule && method === 'POST') {
    const sch = schedules.get(runSchedule[1])
    if (!sch) throw new Error('Jadwal tidak ditemukan')
    const report = await getIntelligence(env, { ...sch.filters, category: sch.category }, userName, user)
    sch.lastRun = new Date().toISOString()
    sch.nextRun = calcNextRun(sch.frequency)
    schedules.set(sch.id, sch)
    addAudit({ action: 'schedule_run', user: userName, reportId: String(report.reportId), at: new Date().toISOString() })
    return { ok: true, reportId: report.reportId, emailed: sch.email, note: 'Email dikirim ke antrian (simulasi)' }
  }

  if (path === '/api/reports/layouts' && method === 'GET') {
    return [...layouts.values()]
  }

  if (path === '/api/reports/layouts' && method === 'POST') {
    const now = new Date().toISOString()
    const item: Layout = {
      id: body?.id ? String(body.id) : `LAY-${Date.now().toString(36)}`,
      name: String(body?.name ?? 'Layout'),
      widgets: (body?.widgets as string[]) ?? [],
      createdBy: userName,
      createdAt: now,
      updatedAt: now,
    }
    layouts.set(item.id, item)
    return item
  }

  const versionsPath = path.match(/^\/api\/reports\/versions\/([^/]+)$/)
  if (versionsPath && method === 'GET') {
    return [...versions.values()].filter((v) => v.reportId === versionsPath[1]).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  if (versionsPath && method === 'POST') {
    const existing = [...versions.values()].filter((v) => v.reportId === versionsPath[1])
    const nextVer = existing.length ? `v1.${existing.length}` : 'v1.0'
    const item: Version = {
      id: `VER-${Date.now().toString(36)}`,
      reportId: versionsPath[1],
      version: nextVer,
      snapshot: (body?.snapshot as Record<string, unknown>) ?? {},
      createdBy: userName,
      createdAt: new Date().toISOString(),
      note: body?.note ? String(body.note) : undefined,
    }
    versions.set(item.id, item)
    addAudit({ action: 'version_save', user: userName, reportId: versionsPath[1], at: new Date().toISOString(), detail: nextVer })
    return item
  }

  const approvalPath = path.match(/^\/api\/reports\/approval\/([^/]+)$/)
  if (approvalPath && method === 'POST') {
    const action = String(body?.action ?? '')
    const current = approvals.get(approvalPath[1]) ?? {
      reportId: approvalPath[1], status: 'draft' as const, reviewer: null, reviewedAt: null, note: '', history: [],
    }
    const transitions: Record<string, { status: Approval['status']; note: string }> = {
      submit: { status: 'review', note: String(body?.note ?? 'Diajukan untuk review') },
      approve: { status: 'approved', note: String(body?.note ?? 'Disetujui') },
      reject: { status: 'draft', note: String(body?.note ?? 'Dikembalikan ke draft') },
      publish: { status: 'published', note: String(body?.note ?? 'Dipublikasikan') },
    }
    const next = transitions[action]
    if (!next) throw new Error('Aksi tidak valid')
    const record: Approval = {
      reportId: approvalPath[1],
      status: next.status,
      reviewer: ['approve', 'reject', 'publish'].includes(action) ? userName : current.reviewer,
      reviewedAt: ['approve', 'reject', 'publish'].includes(action) ? new Date().toISOString() : current.reviewedAt,
      note: next.note,
      history: [...current.history, { status: next.status, by: userName, at: new Date().toISOString(), note: next.note }],
    }
    approvals.set(approvalPath[1], record)
    addAudit({ action: `approval_${action}`, user: userName, reportId: approvalPath[1], at: new Date().toISOString() })
    return record
  }

  if (path === '/api/reports/share' && method === 'POST') {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Number(body?.expiresInDays ?? 7))
    const password = body?.password ? String(body.password) : undefined
    const item: ShareLink = {
      id: `SHR-${Date.now().toString(36)}`,
      token: crypto.randomUUID().replace(/-/g, ''),
      reportId: String(body?.reportId ?? ''),
      passwordHash: password ? await sha256Hex(password) : undefined,
      permission: (body?.permission as 'read' | 'edit') ?? 'read',
      watermark: String(body?.watermark ?? 'SHARED'),
      expiresAt: expiresAt.toISOString(),
      createdBy: userName,
      createdAt: new Date().toISOString(),
      accessCount: 0,
    }
    shares.set(item.token, item)
    addAudit({ action: 'share_create', user: userName, reportId: item.reportId, at: new Date().toISOString() })
    return item
  }

  const shareAccess = path.match(/^\/api\/reports\/share\/([^/]+)$/)
  if (shareAccess && method === 'GET') {
    const link = shares.get(shareAccess[1])
    if (!link) throw new Error('Link tidak ditemukan')
    if (new Date(link.expiresAt) < new Date()) throw new Error('Link kedaluwarsa')
    const password = url.searchParams.get('password') ?? undefined
    if (link.passwordHash && (await sha256Hex(password ?? '')) !== link.passwordHash) {
      throw new Error('Password salah')
    }
    link.accessCount++
    shares.set(link.token, link)
    const report = await getIntelligence(env, { reportId: link.reportId, watermark: link.watermark }, 'share_guest', null)
    return { report, permission: link.permission, watermark: link.watermark, expiresAt: link.expiresAt }
  }

  if (path === '/api/reports/email-queue' && method === 'GET') {
    return []
  }

  if (path === '/api/reports/summary' && method === 'GET') {
    const stats = await getStats(env, q, user ?? undefined)
    const { data } = await findAll(env, { ...q, limit: '1' }, user ?? undefined)
    return { ...stats, exportable: true, sampleCount: data.length }
  }

  if (path === '/api/reports/export' && method === 'GET') {
    const { data } = await findAll(env, { ...q, limit: '5000' }, user ?? undefined)
    const csv = buildCsv(data)
    logExport({ createdBy: userName, category: q.category ?? 'case', format: 'csv', period: periodLabelFromQuery(q), sizeKb: Math.round(csv.length / 1024) })
    return fileResponse(csv, 'text/csv; charset=utf-8', `laporan-kasus-${Date.now()}.csv`, cors)
  }

  if (path === '/api/reports/export/json' && method === 'GET') {
    const report = await getIntelligence(env, q, userName, user)
    const json = JSON.stringify(report, null, 2)
    logExport({ createdBy: userName, category: q.category ?? 'executive', format: 'json', period: periodLabelFromQuery(q), sizeKb: Math.round(json.length / 1024), reportId: String(report.reportId) })
    return fileResponse(json, 'application/json; charset=utf-8', `laporan-${Date.now()}.json`, cors)
  }

  if (path === '/api/reports/export/html' && method === 'GET') {
    const report = await getIntelligence(env, q, userName, user)
    return new Response(buildPrintHtml(report), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors } })
  }

  if (path === '/api/reports/export/word' && method === 'GET') {
    const report = await getIntelligence(env, q, userName, user)
    const html = buildPrintHtml(report)
    logExport({ createdBy: userName, category: q.category ?? 'executive', format: 'word', period: periodLabelFromQuery(q), sizeKb: Math.round(html.length / 1024), reportId: String(report.reportId) })
    return fileResponse(html, 'application/msword; charset=utf-8', `laporan-${Date.now()}.doc`, cors)
  }

  if (path === '/api/reports/export/excel' && method === 'GET') {
    const report = await getIntelligence(env, q, userName, user)
    const rows = [
      ['e-Insight Report', String(report.reportId)],
      ['Periode', String(report.periodLabel)],
      ['Total', (report.kpi as { total: number }).total],
      ['Aktif', (report.kpi as { aktif: number }).aktif],
      ['Selesai', (report.kpi as { selesai: number }).selesai],
      ['Completion Rate', `${(report.kpi as { completionRate: number }).completionRate}%`],
      [],
      ['Kabupaten', 'Jumlah'],
      ...((report.tables as { kabupaten: { name: string; count: number }[] }).kabupaten ?? []).map((r) => [r.name, r.count]),
      [],
      ['Jenis Kekerasan', 'Jumlah'],
      ...((report.tables as { jenis: { name: string; count: number }[] }).jenis ?? []).map((r) => [r.name, r.count]),
    ]
    const csv = rows.map((r) => r.join('\t')).join('\n')
    logExport({ createdBy: userName, category: q.category ?? 'executive', format: 'excel', period: periodLabelFromQuery(q), sizeKb: Math.round(csv.length / 1024), reportId: String(report.reportId) })
    return fileResponse(csv, 'application/vnd.ms-excel; charset=utf-8', `laporan-${Date.now()}.xls`, cors)
  }

  return null
}

export async function handlePublicShare(
  path: string,
  method: string,
  env: Env,
  url: URL,
  cors: Record<string, string>,
): Promise<Response | null> {
  if (!path.match(/^\/api\/reports\/share\/[^/]+$/) || method !== 'GET') return null
  try {
    const result = await handleReports(path, method, env, null, url, undefined, cors)
    if (result instanceof Response) return result
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } })
  } catch (e) {
    return new Response(JSON.stringify({ message: (e as Error).message }), { status: 401, headers: { 'Content-Type': 'application/json', ...cors } })
  }
}
