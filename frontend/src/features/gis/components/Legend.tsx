import { useGisMapData } from '@/features/gis/hooks/useGisData'
import { legendBuckets } from '@/features/gis/utils/colors'

export function Legend() {
  const { data } = useGisMapData()
  const max = data?.kabupatenStats?.[0]?.count ?? 100
  const buckets = legendBuckets(max)

  return (
    <div className="absolute bottom-3 left-3 z-[500] rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold">Legenda Kasus</p>
      <div className="space-y-1">
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-sm" style={{ background: b.color }} />
            {b.label}
          </div>
        ))}
      </div>
    </div>
  )
}
