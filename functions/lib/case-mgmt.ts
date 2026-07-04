import type { Env, AuthUser } from './shared'
import { dbClient } from './shared'
import { applyCaseFilters, countByField, parseCaseFilters } from './case-filters'
import { applyRowScope, processCases } from './data-security'
import { findAll } from './cases'

type CaseRow = Record<string, unknown>
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

function computeRiskScore(c: CaseRow): RiskLevel {
  let score = 0
  const usia = c.usia as number | null
  const jenis = String(c.jenis_kekerasan ?? '').toLowerCase()
  const status = String(c.status ?? '')
  if (usia != null && usia < 18) score += 30
  if (jenis.includes('seksual') || jenis.includes('perkosa')) score += 25
  if (jenis.includes('kdrt')) score += 15
  if (status === 'Aktif') score += 10
  if (!c.psikolog_nama) score += 5
  if (score >= 60) return 'Critical'
  if (score >= 40) return 'High'
  if (score >= 20) return 'Medium'
  return 'Low'
}

function detectDuplicates(cases: CaseRow[]) {
  const groups = new Map<string, string[]>()
  for (const c of cases) {
    const key = `${String(c.nama_korban ?? '').toLowerCase()}|${String(c.tanggal ?? '')}`
    const ids = groups.get(key) ?? []
    ids.push(String(c.id))
    groups.set(key, ids)
  }
  const dupMap = new Map<string, string[]>()
  for (const [, ids] of groups) {
    if (ids.length > 1) ids.forEach((id) => dupMap.set(id, ids.filter((x) => x !== id)))
  }
  return dupMap
}

function computeDataQuality(cases: CaseRow[]) {
  let gpsEmpty = 0, alamatEmpty = 0, psikologEmpty = 0, usiaEmpty = 0, genderEmpty = 0
  const dupMap = detectDuplicates(cases)
  for (const c of cases) {
    if (c.latitude == null || c.longitude == null) gpsEmpty++
    if (!c.alamat) alamatEmpty++
    if (!c.psikolog_nama) psikologEmpty++
    if (c.usia == null) usiaEmpty++
    if (!c.jenis_kelamin) genderEmpty++
  }
  const total = cases.length || 1
  const issues = gpsEmpty + alamatEmpty + psikologEmpty + usiaEmpty + genderEmpty + dupMap.size
  const score = Math.max(0, Math.round(100 - (issues / Math.max(total * 5 + dupMap.size, 1)) * 100))
  return { score, gpsEmpty, alamatEmpty, psikologEmpty, usiaEmpty, genderEmpty, duplicates: dupMap.size }
}

function expandedSearch(c: CaseRow, q: string) {
  const hay = [c.nomor_register, c.nama_korban, c.alamat, c.psikolog_nama, c.kabupaten, c.kecamatan, c.catatan]
    .map((x) => String(x ?? '').toLowerCase()).join(' ')
  return hay.includes(q.toLowerCase())
}

function mapCaseListRow(c: CaseRow, duplicateIds?: string[]) {
  return {
    id: c.id, register: c.nomor_register, tanggal: c.tanggal, korban: c.nama_korban,
    nama_korban_masked: c.nama_korban_masked, usia: c.usia, gender: c.jenis_kelamin,
    jenis: c.jenis_kekerasan, kabupaten: c.kabupaten, kecamatan: c.kecamatan,
    status: c.status, riskScore: computeRiskScore(c), lastUpdate: c.updated_at ?? c.created_at,
    psikolog: c.psikolog_nama, possibleDuplicate: (duplicateIds?.length ?? 0) > 0,
    duplicateCount: duplicateIds?.length ?? 0, latitude: c.latitude, longitude: c.longitude,
  }
}

async function fetchAllCases(env: Env) {
  const db = dbClient(env)
  const { data, error } = await db.from('cases').select('*').order('tanggal', { ascending: false })
  if (error || !data) return []
  return data as CaseRow[]
}

async function getScopedCases(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const filters = parseCaseFilters(query)
  let cases = applyRowScope(await fetchAllCases(env), user)
  if (filters.search) {
    const q = filters.search
    cases = cases.filter((c) => expandedSearch(c, q))
    delete (filters as { search?: string }).search
  }
  if (query.riskScore) cases = cases.filter((c) => computeRiskScore(c) === query.riskScore)
  cases = applyCaseFilters(cases, filters)
  return { cases, filters }
}

function monthlyTrend(cases: CaseRow[]) {
  const map = new Map<string, number>()
  for (const c of cases) {
    const key = String(c.tanggal ?? '').slice(0, 7)
    if (key) map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v)
}

export async function getKpis(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const { cases } = await getScopedCases(env, query, user)
  const now = new Date()
  let aktif = 0, selesai = 0, baruBulanIni = 0, totalUsia = 0, usiaCount = 0
  const kabSet = new Set<string>(), psikologSet = new Set<string>()
  let konselingCount = 0
  for (const c of cases) {
    if (c.status === 'Selesai') selesai++
    else aktif++
    const d = new Date(String(c.tanggal))
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) baruBulanIni++
    if (c.usia != null) { totalUsia += Number(c.usia); usiaCount++ }
    if (c.kabupaten) kabSet.add(String(c.kabupaten))
    if (c.psikolog_nama) psikologSet.add(String(c.psikolog_nama))
    if (String(c.catatan ?? '').toLowerCase().includes('konseling')) konselingCount++
  }
  const quality = computeDataQuality(cases)
  return {
    totalKasus: cases.length, kasusAktif: aktif, kasusSelesai: selesai, kasusBaruBulanIni: baruBulanIni,
    rataRataUsia: usiaCount ? Math.round(totalUsia / usiaCount) : 0,
    jumlahKabupaten: kabSet.size, psikologAktif: psikologSet.size, jumlahKonseling: konselingCount,
    dataQualityScore: quality.score, trend: monthlyTrend(cases),
  }
}

export async function listCases(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.min(100, Math.max(10, Number(query.pageSize ?? 25)))
  const sortBy = query.sortBy ?? 'tanggal'
  const sortDir = query.sortDir === 'asc' ? 1 : -1
  const { cases } = await getScopedCases(env, query, user)
  const dupMap = detectDuplicates(cases)
  const processed = await findAll(env, query, user)
  const maskedMap = new Map((processed.data as CaseRow[]).map((c) => [String(c.id), c]))
  let rows = cases.map((c) => mapCaseListRow(maskedMap.get(String(c.id)) ?? c, dupMap.get(String(c.id))))
  rows.sort((a, b) => sortDir * String(a[sortBy as keyof typeof a] ?? '').localeCompare(String(b[sortBy as keyof typeof b] ?? ''), undefined, { numeric: true }))
  const total = rows.length
  return { data: rows.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize }
}

export async function getDetail(env: Env, id: string, user?: AuthUser | null) {
  const db = dbClient(env)
  const { data: raw } = await db.from('cases').select('*').eq('id', id).single()
  if (!raw) throw new Error('Kasus tidak ditemukan')
  const processed = await findAll(env, {}, user)
  const masked = (processed.data as CaseRow[]).find((c) => String(c.id) === id) ?? raw
  const { data: attachments } = await db.from('case_attachments').select('*').eq('case_id', id).order('created_at', { ascending: false })
  return {
    overview: {
      register: masked.nomor_register, tanggal: masked.tanggal, korban: masked.nama_korban,
      usia: masked.usia, gender: masked.jenis_kelamin, jenis: masked.jenis_kekerasan,
      kabupaten: masked.kabupaten, kecamatan: masked.kecamatan, status: masked.status,
      riskScore: computeRiskScore(masked), psikolog: masked.psikolog_nama,
    },
    attachments: attachments ?? [],
    auditTrail: [
      { user: 'System', date: raw.created_at, column: 'create', oldValue: '-', newValue: 'Kasus dibuat' },
      { user: 'System', date: raw.updated_at, column: 'update', oldValue: '-', newValue: 'Data diperbarui' },
    ],
  }
}

export async function getQuality(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const { cases } = await getScopedCases(env, query, user)
  return computeDataQuality(cases)
}

function usiaBuckets(cases: CaseRow[]) {
  const buckets = { '<18': 0, '18-30': 0, '31-45': 0, '46+': 0, Unknown: 0 }
  for (const c of cases) {
    const u = c.usia as number | null
    if (u == null) buckets.Unknown++
    else if (u < 18) buckets['<18']++
    else if (u <= 30) buckets['18-30']++
    else if (u <= 45) buckets['31-45']++
    else buckets['46+']++
  }
  return Object.entries(buckets).map(([name, count]) => ({ name, count }))
}

export async function getQuickAnalytics(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const { cases } = await getScopedCases(env, query, user)
  return {
    jenisKekerasan: countByField(cases, 'jenis_kekerasan', 8),
    gender: countByField(cases, 'jenis_kelamin', 5),
    kabupaten: countByField(cases, 'kabupaten', 8),
    status: countByField(cases, 'status', 5),
    usia: usiaBuckets(cases),
    psikolog: countByField(cases, 'psikolog_nama', 8),
  }
}

export async function getSavedFilters(env: Env, userId: string) {
  const db = dbClient(env)
  const { data } = await db.from('case_saved_filters').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  return data ?? []
}

export async function saveFilter(env: Env, userId: string, name: string, filters: Record<string, unknown>) {
  const db = dbClient(env)
  const { data, error } = await db.from('case_saved_filters').insert({ user_id: userId, name, filters }).select('*').single()
  if (error) throw error
  return data
}

export async function deleteSavedFilter(env: Env, userId: string, id: string) {
  const db = dbClient(env)
  await db.from('case_saved_filters').delete().eq('id', id).eq('user_id', userId)
  return { ok: true }
}

export async function getPreferences(env: Env, userId: string) {
  const db = dbClient(env)
  const { data } = await db.from('case_user_preferences').select('*').eq('user_id', userId).maybeSingle()
  return data ?? { visible_columns: [], column_order: [] }
}

export async function savePreferences(env: Env, userId: string, visibleColumns: string[], columnOrder: string[]) {
  const db = dbClient(env)
  const { data, error } = await db.from('case_user_preferences').upsert({
    user_id: userId, visible_columns: visibleColumns, column_order: columnOrder, updated_at: new Date().toISOString(),
  }).select('*').single()
  if (error) throw error
  return data
}

export async function exportCases(env: Env, body: { ids?: string[]; format?: string }, query: Record<string, string | undefined>, user: AuthUser) {
  const { cases } = await getScopedCases(env, query, user)
  let rows = cases
  if (body.ids?.length) rows = cases.filter((c) => body.ids!.includes(String(c.id)))
  const csv = [
    'Register,Tanggal,Korban,Usia,Gender,Jenis,Kabupaten,Status,Risk',
    ...rows.map((c) => [c.nomor_register, c.tanggal, c.nama_korban, c.usia, c.jenis_kelamin, c.jenis_kekerasan, c.kabupaten, c.status, computeRiskScore(c)]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  return { content: csv, rowCount: rows.length, format: 'csv' }
}

export async function bulkAction(body: { action: string; ids: string[] }) {
  return { ok: true, action: body.action, count: body.ids.length }
}
