import { useGis } from '@/features/gis/context/GisContext'
import { useGisMapData, useGisServices } from '@/features/gis/hooks/useGisData'
import { SERVICE_LABELS, type ServiceCategory } from '@/features/gis/types/gis'
import { nearestService, googleMapsUrl } from '@/features/gis/utils/spatial'

const CATEGORIES = Object.keys(SERVICE_LABELS) as ServiceCategory[]

export function NearestPanel() {
  const { nearestCategory, setNearestCategory, selectedPointId } = useGis()
  const { data: mapData } = useGisMapData()
  const { data: services } = useGisServices()

  const point = mapData?.points.find((p) => p.id === selectedPointId)
  const filtered = (services ?? []).filter((s) => s.category === nearestCategory)
  const nearest = point ? nearestService(point.lat, point.lng, filtered) : null

  return (
    <section className="rounded border border-border p-2 text-xs">
      <p className="mb-2 font-semibold">Nearest Service</p>
      <select
        className="mb-2 w-full rounded border border-border bg-background px-2 py-1"
        value={nearestCategory}
        onChange={(e) => setNearestCategory(e.target.value as ServiceCategory)}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{SERVICE_LABELS[c]}</option>
        ))}
      </select>
      {!point && <p className="text-muted-foreground">Klik marker kasus untuk cari layanan terdekat.</p>}
      {point && nearest && (
        <div className="space-y-1">
          <p className="font-medium">{nearest.service.name}</p>
          <p>Jarak: {nearest.distanceKm.toFixed(1)} km</p>
          <p>Estimasi: ~{nearest.durationMin} menit</p>
          <a
            href={googleMapsUrl(point.lat, point.lng, nearest.service.lat, nearest.service.lng)}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-primary hover:underline"
          >
            Navigasi Google Maps
          </a>
        </div>
      )}
    </section>
  )
}
