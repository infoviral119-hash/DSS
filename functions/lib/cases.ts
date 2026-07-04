import type { Env, AuthUser } from './shared'
import { dbClient } from './shared'
import { applyCaseFilters, parseCaseFilters } from './case-filters'
import { applyRowScope, processCases } from './data-security'

const CASE_SELECT =
  'id, nomor_register, tanggal, nama_korban, jenis_kelamin, usia, status, jenis_kekerasan, kategori, kabupaten, kecamatan, kelurahan, psikolog_nama, tahun, latitude, longitude, outcome, status_pendampingan, provinsi, alamat, catatan'

async function fetchCases(env: Env) {
  const db = dbClient(env)
  const { data, error } = await db.from('cases').select(CASE_SELECT).order('tanggal', { ascending: false })
  if (error || !data) return { cases: [] as Record<string, unknown>[], connected: false, error: error?.message }
  return { cases: data as Record<string, unknown>[], connected: true }
}

export async function getStats(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const filters = parseCaseFilters(query)
  const { cases: raw, connected } = await fetchCases(env)
  if (!connected) return { total: 0, aktif: 0, selesai: 0, byYear: {}, connected: false }
  const cases = applyCaseFilters(applyRowScope(raw, user), filters)
  const byYear: Record<number, number> = {}
  let aktif = 0
  let selesai = 0
  for (const c of cases) {
    const year = (c.tahun as number) ?? new Date(String(c.tanggal)).getFullYear()
    byYear[year] = (byYear[year] ?? 0) + 1
    if (c.status === 'Selesai') selesai++
    else aktif++
  }
  return { total: cases.length, aktif, selesai, byYear, connected: true }
}

export async function getFilteredCases(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const filters = parseCaseFilters(query)
  const { cases: raw, connected } = await fetchCases(env)
  if (!connected) return { cases: [] as Record<string, unknown>[], connected: false }
  const filtered = applyCaseFilters(applyRowScope(raw, user), filters)
  return { cases: processCases(filtered, user), connected: true }
}

export async function findAll(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const filters = parseCaseFilters(query)
  const { cases: raw, connected } = await fetchCases(env)
  if (!connected) return { data: [], total: 0 }
  const filtered = applyCaseFilters(applyRowScope(raw, user), filters)
  const processed = processCases(filtered, user)
  const limit = filters.limit ?? 100
  return { data: processed.slice(0, limit), total: processed.length }
}

export async function getFilterOptions(env: Env, user?: AuthUser | null) {
  const { cases: raw, connected } = await fetchCases(env)
  if (!connected) return { kabupaten: [], jenisKekerasan: [], status: [] }
  const scoped = applyRowScope(raw, user)
  const uniq = (field: string) =>
    [...new Set(scoped.map((c) => c[field]).filter(Boolean))].sort() as string[]
  return { kabupaten: uniq('kabupaten'), jenisKekerasan: uniq('jenis_kekerasan'), status: uniq('status') }
}

export async function getMaster(env: Env, user?: AuthUser | null) {
  const options = await getFilterOptions(env, user)
  const { data } = await findAll(env, { limit: '5000' }, user)
  const uniq = (field: string) => {
    const set = new Set<string>()
    for (const row of data) {
      const val = row[field]
      if (val) set.add(String(val))
    }
    return [...set].sort()
  }
  const psikologCount: Record<string, number> = {}
  for (const row of data) {
    const p = String(row.psikolog_nama || 'Belum ditugaskan')
    psikologCount[p] = (psikologCount[p] ?? 0) + 1
  }
  return {
    kabupaten: options.kabupaten,
    jenisKekerasan: options.jenisKekerasan,
    status: options.status,
    kategori: uniq('kategori'),
    kecamatan: uniq('kecamatan'),
    psikolog: Object.entries(psikologCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  }
}
