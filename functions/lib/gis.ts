import type { Env, AuthUser } from './shared'
import { getFilteredCases } from './cases'
import { countColor, normalizeKabupaten, resolveCoords } from './coords'
import { PUBLIC_SERVICES } from './gis-static'
import { getBoundaryGeoJson } from './gis-static'

export async function getMapData(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const { cases, connected } = await getFilteredCases(env, query, user)
  if (!connected) {
    return { connected: false, points: [], clusters: [], kabupatenStats: [], kecamatanStats: [], total: 0, withGps: 0, withoutGps: 0 }
  }

  const points = cases
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: c.id,
      lat: c.latitude as number,
      lng: c.longitude as number,
      nomorRegister: c.nomor_register,
      namaKorban: c.nama_korban,
      jenisKekerasan: c.jenis_kekerasan,
      jenisKelamin: c.jenis_kelamin,
      status: c.status,
      tanggal: c.tanggal,
      kabupaten: c.kabupaten,
      kecamatan: c.kecamatan,
      provinsi: c.provinsi,
    }))

  const kabMap = new Map<string, { name: string; count: number; aktif: number; selesai: number }>()
  const kecMap = new Map<string, { name: string; kabupaten: string; count: number }>()
  for (const c of cases) {
    const kab = String(c.kabupaten || 'Tidak diketahui')
    const kec = String(c.kecamatan || 'Tidak diketahui')
    const kabEntry = kabMap.get(kab) ?? { name: kab, count: 0, aktif: 0, selesai: 0 }
    kabEntry.count++
    if (c.status === 'Selesai') kabEntry.selesai++
    else kabEntry.aktif++
    kabMap.set(kab, kabEntry)
    const kecKey = `${kab}|${kec}`
    const kecEntry = kecMap.get(kecKey) ?? { name: kec, kabupaten: kab, count: 0 }
    kecEntry.count++
    kecMap.set(kecKey, kecEntry)
  }

  const kabupatenStats = [...kabMap.values()].sort((a, b) => b.count - a.count)
  const kecamatanStats = [...kecMap.values()].sort((a, b) => b.count - a.count)
  const maxCount = kabupatenStats[0]?.count ?? 1

  const clusters = kabupatenStats
    .map((c) => {
      const prov = cases.find((x) => String(x.kabupaten) === c.name)?.provinsi as string | undefined
      const resolved = resolveCoords(undefined, normalizeKabupaten(c.name) || c.name, prov ?? 'Jawa Barat', c.name)
      if (!resolved) return null
      const [lat, lng] = resolved
      return { name: c.name, count: c.count, kabupaten: normalizeKabupaten(c.name) || c.name, lat, lng, color: countColor(c.count, maxCount) }
    })
    .filter(Boolean)

  const provinsiSet = new Set(cases.map((c) => c.provinsi).filter(Boolean))
  const selesai = cases.filter((c) => c.status === 'Selesai').length

  return {
    connected: true,
    points,
    clusters,
    kabupatenStats,
    kecamatanStats: kecamatanStats.slice(0, 30),
    total: cases.length,
    withGps: points.length,
    withoutGps: cases.length - points.length,
    aktif: cases.length - selesai,
    selesai,
    provinsiCount: provinsiSet.size,
    kabupatenCount: kabMap.size,
    completionRate: cases.length > 0 ? Math.round((selesai / cases.length) * 100) : 0,
  }
}

export async function getInsights(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const data = await getMapData(env, query, user)
  const insights: string[] = []
  if (!data.connected || data.total === 0) return { insights: ['Tidak ada data kasus untuk filter saat ini.'] }
  const topKab = data.kabupatenStats[0]
  if (topKab) {
    insights.push(`${topKab.name}: ${topKab.count} kasus — wilayah prioritas tertinggi.`)
    const pctAktif = topKab.count > 0 ? Math.round((topKab.aktif / topKab.count) * 100) : 0
    if (pctAktif > 40) insights.push(`${topKab.name}: ${pctAktif}% kasus masih aktif — perlu perhatian.`)
  }
  const topKec = data.kecamatanStats[0]
  if (topKec) insights.push(`Hotspot kecamatan: ${topKec.name} (${topKec.kabupaten}) — ${topKec.count} kasus.`)
  const gpsPct = data.total > 0 ? Math.round((data.withGps / data.total) * 100) : 0
  insights.push(`Coverage GPS: ${gpsPct}% (${data.withGps}/${data.total} kasus).`)
  if (gpsPct < 50) insights.push('Disarankan geocode ulang untuk meningkatkan akurasi spasial.')
  if ((data.completionRate ?? 0) < 70) insights.push(`Tingkat penyelesaian ${data.completionRate}% — di bawah target 70%.`)
  return { insights }
}

export async function getStats(env: Env, query: Record<string, string | undefined>, user?: AuthUser | null) {
  const data = await getMapData(env, query, user)
  return {
    totalMarker: data.total,
    gpsValid: data.withGps,
    gpsInvalid: data.withoutGps,
    kabupaten: data.kabupatenCount,
    provinsi: data.provinsiCount,
    aktif: data.aktif,
    selesai: data.selesai,
    completionRate: data.completionRate,
    coverage: data.total > 0 ? Math.round((data.withGps / data.total) * 100) : 0,
  }
}

export function getServices() {
  return PUBLIC_SERVICES
}

export function getBoundaries(level: 'provinsi' | 'kabupaten' | 'kecamatan') {
  return getBoundaryGeoJson(level)
}
