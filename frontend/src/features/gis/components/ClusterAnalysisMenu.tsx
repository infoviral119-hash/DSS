import { useGis } from '@/features/gis/context/GisContext'
import type { ClusterMethod } from '@/features/gis/types/gis'
import { Button } from '@/components/ui/button'

const METHODS: { id: ClusterMethod; label: string }[] = [
  { id: 'dbscan', label: 'DBSCAN' },
  { id: 'kmeans', label: 'KMeans' },
  { id: 'grid', label: 'Grid Cluster' },
  { id: 'marker', label: 'Marker Cluster' },
]

export function ClusterAnalysisMenu() {
  const { clusterMethod, setClusterMethod, clusterCount, setClusterCount, clusterGroups } = useGis()

  return (
    <section className="rounded border border-border p-2">
      <p className="mb-2 text-xs font-semibold">Cluster Analysis</p>
      <div className="flex flex-wrap gap-1">
        {METHODS.map((m) => (
          <Button
            key={m.id}
            size="sm"
            variant={clusterMethod === m.id ? 'default' : 'secondary'}
            className="h-7 text-[10px]"
            onClick={() => setClusterMethod(m.id)}
          >
            {m.label}
          </Button>
        ))}
      </div>
      {clusterMethod === 'kmeans' && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span>Jumlah cluster</span>
          <input
            type="number"
            min={2}
            max={20}
            value={clusterCount}
            onChange={(e) => setClusterCount(Number(e.target.value))}
            className="w-14 rounded border border-border px-1 py-0.5"
          />
        </div>
      )}
      {clusterGroups.length > 0 && (
        <div className="mt-2 space-y-1">
          {clusterGroups.slice(0, 6).map((g) => (
            <div key={g.id} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />
              Cluster {g.id + 1}: {g.count} kasus
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
