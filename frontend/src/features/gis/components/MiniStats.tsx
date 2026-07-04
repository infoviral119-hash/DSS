import { formatNumber } from '@/lib/utils'
import { useGisMapData } from '@/features/gis/hooks/useGisData'
import { useGis } from '@/features/gis/context/GisContext'

export function MiniStats() {
  const { data } = useGisMapData()
  const { clusterGroups } = useGis()

  const items = [
    { label: 'Total Kasus', value: data?.total ?? 0 },
    { label: 'Kasus Aktif', value: data?.aktif ?? 0 },
    { label: 'Hotspot', value: data?.kecamatanStats?.[0]?.count ?? 0 },
    { label: 'Cluster', value: clusterGroups.length || data?.clusters?.length || 0 },
    { label: 'Coverage', value: data?.total ? `${Math.round((data.withGps / data.total) * 100)}%` : '0%' },
    { label: 'GPS Valid', value: data?.withGps ?? 0 },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map((s) => (
        <div key={s.label} className="rounded-lg border border-border bg-card px-3 py-2 text-center shadow-sm">
          <p className="text-[10px] text-muted-foreground">{s.label}</p>
          <p className="text-sm font-bold text-foreground">
            {typeof s.value === 'number' ? formatNumber(s.value) : s.value}
          </p>
        </div>
      ))}
    </div>
  )
}
