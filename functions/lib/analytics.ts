import type { Env } from './shared'
import { dbClient } from './shared'
import { applyCaseFilters, countByField, parseCaseFilters } from './case-filters'

type CaseRow = Record<string, unknown>

async function loadCases(env: Env, query: Record<string, string | undefined>) {
  const filters = parseCaseFilters(query)
  const db = dbClient(env)
  const { data, error } = await db
    .from('cases')
    .select('tahun, tanggal, status, jenis_kelamin, usia, jenis_kekerasan, kabupaten, kecamatan, kategori, outcome, status_pendampingan, pendidikan, catatan')
    .order('tanggal', { ascending: true })
  if (error || !data) return { cases: [] as CaseRow[], connected: false }
  return { cases: applyCaseFilters(data as CaseRow[], filters), connected: true }
}

function isDirujuk(catatan: string, outcome: string) {
  const t = `${catatan} ${outcome}`.toLowerCase()
  return t.includes('dirujuk') || t.includes('rujuk')
}

function buildPendampinganStats(cases: CaseRow[]) {
  let dirujuk = 0
  let tidakDirujuk = 0
  const konseling: Record<string, number> = {}
  for (const c of cases) {
    const catatan = String(c.catatan ?? '')
    const outcome = String(c.outcome ?? '')
    if (isDirujuk(catatan, outcome)) dirujuk++
    else tidakDirujuk++
    const mode = String(c.status_pendampingan ?? 'Tidak diketahui')
    konseling[mode] = (konseling[mode] ?? 0) + 1
  }
  return {
    dirujuk: { dirujuk, tidakDirujuk, total: cases.length },
    konseling,
    penerimaan: {},
    pendidikan: {},
  }
}

export async function getTrends(env: Env, query: Record<string, string | undefined>) {
  const { cases, connected } = await loadCases(env, query)
  const byYear: Record<string, number> = {}
  const byMonth: Record<string, number> = {}
  for (const c of cases) {
    const year = String((c.tahun as number) ?? new Date(String(c.tanggal)).getFullYear())
    byYear[year] = (byYear[year] ?? 0) + 1
    const month = String(c.tanggal).slice(0, 7)
    byMonth[month] = (byMonth[month] ?? 0) + 1
  }
  const labels = Object.keys(byYear).sort()
  return {
    connected,
    yearly: labels.map((l) => byYear[l]),
    labels,
    monthly: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
  }
}

export async function getDemographics(env: Env, query: Record<string, string | undefined>) {
  const { cases, connected } = await loadCases(env, query)
  const gender: Record<string, number> = {}
  const ageGroups: Record<string, number> = {}
  for (const c of cases) {
    const g = String(c.jenis_kelamin || 'Tidak diketahui')
    gender[g] = (gender[g] ?? 0) + 1
    const usia = (c.usia as number) ?? 0
    let group = 'Tidak diketahui'
    if (usia <= 12) group = '0-12'
    else if (usia <= 17) group = '13-17'
    else if (usia <= 25) group = '18-25'
    else if (usia <= 40) group = '26-40'
    else if (usia > 40) group = '40+'
    ageGroups[group] = (ageGroups[group] ?? 0) + 1
  }
  return { connected, gender, ageGroups }
}

export async function getOverview(env: Env, query: Record<string, string | undefined>) {
  const { cases, connected } = await loadCases(env, query)
  const total = cases.length
  const selesai = cases.filter((c) => c.status === 'Selesai').length
  const completionRate = total ? Math.round((selesai / total) * 100) : 0
  return {
    connected,
    total,
    selesai,
    aktif: total - selesai,
    completionRate,
    topKecamatan: countByField(cases, 'kecamatan', 8),
    topKabupaten: countByField(cases, 'kabupaten', 6),
    topJenisKekerasan: countByField(cases, 'jenis_kekerasan', 8),
    topKategori: countByField(cases, 'kategori', 6),
    pendampingan: buildPendampinganStats(cases),
  }
}
