import { Button } from '@/components/ui/button'
import { useGis } from '@/features/gis/context/GisContext'
import type { GisTool } from '@/features/gis/types/gis'
import { ExportControl } from '@/features/gis/components/ExportControl'
import {
  MapPin, Flame, Layers, Circle, Pentagon, Navigation, Search,
} from 'lucide-react'

interface GISToolbarProps {
  mapContainerRef?: React.RefObject<HTMLDivElement | null>
}

const TOOLS: { id: GisTool; label: string; icon: typeof MapPin }[] = [
  { id: 'none', label: 'GPS', icon: MapPin },
  { id: 'none', label: 'Heatmap', icon: Flame },
  { id: 'radius', label: 'Radius', icon: Circle },
  { id: 'polygon', label: 'Polygon', icon: Pentagon },
  { id: 'buffer', label: 'Buffer', icon: Layers },
  { id: 'nearest', label: 'Nearest', icon: Navigation },
  { id: 'geocode', label: 'Geocode', icon: Search },
]

export function GISToolbar({ mapContainerRef }: GISToolbarProps) {
  const { activeTool, setActiveTool, layers, toggleLayer, setLayers } = useGis()

  const handleTool = (label: string) => {
    if (label === 'GPS') {
      setLayers((p) => ({ ...p, markers: true, cluster: true, heatmap: false, hotspot: false }))
      setActiveTool('none')
      return
    }
    if (label === 'Heatmap') {
      setLayers((p) => ({ ...p, heatmap: !p.heatmap, hotspot: false }))
      setActiveTool('none')
      return
    }
    const tool = TOOLS.find((t) => t.label === label)
    if (tool && tool.id !== 'none') setActiveTool(activeTool === tool.id ? 'none' : tool.id)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-2 shadow-sm">
      {TOOLS.map((t) => (
        <Button
          key={t.label}
          size="sm"
          variant={
            (t.label === 'Heatmap' && layers.heatmap) || (activeTool === t.id && t.id !== 'none')
              ? 'default'
              : 'secondary'
          }
          className="h-8 gap-1 text-xs"
          onClick={() => handleTool(t.label)}
        >
          <t.icon className="h-3.5 w-3.5" />
          {t.label}
        </Button>
      ))}
      <Button
        size="sm"
        variant={layers.choropleth ? 'default' : 'secondary'}
        className="h-8 gap-1 text-xs"
        onClick={() => toggleLayer('choropleth')}
      >
        <Layers className="h-3.5 w-3.5" />
        Boundary
      </Button>
      <ExportControl mapRef={mapContainerRef} />
    </div>
  )
}
