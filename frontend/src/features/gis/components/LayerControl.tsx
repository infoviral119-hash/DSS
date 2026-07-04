import { useGis } from '@/features/gis/context/GisContext'
import type { LayerState } from '@/features/gis/types/gis'

const LAYER_ITEMS: { key: keyof LayerState; label: string }[] = [
  { key: 'markers', label: 'Marker' },
  { key: 'cluster', label: 'Cluster' },
  { key: 'heatmap', label: 'Heatmap' },
  { key: 'hotspot', label: 'Hotspot' },
  { key: 'kabupaten', label: 'Kabupaten' },
  { key: 'provinsi', label: 'Provinsi' },
  { key: 'choropleth', label: 'Choropleth' },
  { key: 'radius', label: 'Radius' },
  { key: 'buffer', label: 'Buffer' },
  { key: 'polygon', label: 'Polygon' },
  { key: 'satellite', label: 'Satelit' },
  { key: 'osm', label: 'OpenStreetMap' },
]

export function LayerControl() {
  const { layers, toggleLayer } = useGis()

  return (
    <div className="absolute left-3 top-3 z-[500] max-h-[70vh] w-44 overflow-y-auto rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold">Layer Control</p>
      <div className="space-y-1.5">
        {LAYER_ITEMS.map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-xs">
            <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)} className="rounded" />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}
