import * as turf from '@turf/turf'
import type { GisMapPoint } from '@/features/gis/types/gis'

export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return turf.distance([lng1, lat1], [lng2, lat2], { units: 'meters' })
}

export function pointsInRadius(points: GisMapPoint[], center: [number, number], radiusM: number) {
  const circle = turf.circle(center, radiusM / 1000, { steps: 64, units: 'kilometers' })
  return points.filter((p) => turf.booleanPointInPolygon(turf.point([p.lng, p.lat]), circle))
}

export function pointsInPolygon(points: GisMapPoint[], coords: [number, number][]) {
  if (coords.length < 3) return []
  const ring = [...coords.map(([lat, lng]) => [lng, lat] as [number, number]), [coords[0][1], coords[0][0]]]
  const poly = turf.polygon([ring])
  return points.filter((p) => turf.booleanPointInPolygon(turf.point([p.lng, p.lat]), poly))
}

export function aggregateCases(cases: GisMapPoint[]) {
  const byJenis: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  const byGender: Record<string, number> = {}
  const byKabupaten: Record<string, number> = {}
  const byKecamatan: Record<string, number> = {}
  let aktif = 0
  let selesai = 0

  for (const c of cases) {
    const j = c.jenisKekerasan || 'Lainnya'
    byJenis[j] = (byJenis[j] ?? 0) + 1
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1
    byGender[c.jenisKelamin] = (byGender[c.jenisKelamin] ?? 0) + 1
    byKabupaten[c.kabupaten || '-'] = (byKabupaten[c.kabupaten || '-'] ?? 0) + 1
    byKecamatan[c.kecamatan || '-'] = (byKecamatan[c.kecamatan || '-'] ?? 0) + 1
    if (c.status === 'Selesai') selesai++
    else aktif++
  }

  return { byJenis, byStatus, byGender, byKabupaten, byKecamatan, aktif, selesai }
}

export function nearestService(
  lat: number,
  lng: number,
  services: { lat: number; lng: number; name: string; category: string; id: string }[],
) {
  if (services.length === 0) return null
  const from = turf.point([lng, lat])
  let best = services[0]
  let bestDist = Infinity
  for (const s of services) {
    const d = turf.distance(from, turf.point([s.lng, s.lat]), { units: 'kilometers' })
    if (d < bestDist) {
      bestDist = d
      best = s
    }
  }
  const durationMin = Math.round((bestDist / 30) * 60)
  return { service: best, distanceKm: bestDist, durationMin }
}

export function googleMapsUrl(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}`
}
