import { useRef } from 'react'
import { GisProvider } from '@/features/gis/context/GisContext'
import { MiniStats } from '@/features/gis/components/MiniStats'
import { GISToolbar } from '@/features/gis/components/GISToolbar'
import { GisMap, type GisMapHandle } from '@/features/gis/components/GisMap'
import { LayerControl } from '@/features/gis/components/LayerControl'
import { Legend } from '@/features/gis/components/Legend'
import { SpatialInsight } from '@/features/gis/components/SpatialInsight'
import { useGis } from '@/features/gis/context/GisContext'
import { Button } from '@/components/ui/button'
import { PanelBottom } from 'lucide-react'

function GISLayout() {
  const mapRef = useRef<GisMapHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { reverseAddress, panelOpen, setPanelOpen } = useGis()

  return (
    <div className="-mx-4 -mb-4 flex flex-col gap-3 md:-mx-6 md:-mb-6">
      <MiniStats />
      <GISToolbar mapContainerRef={containerRef} />

      <div className="flex min-h-[calc(100vh-14rem)] flex-col lg:flex-row">
        <div ref={containerRef} className="relative min-h-[420px] flex-1 lg:w-3/4">
          <GisMap ref={mapRef} />
          <LayerControl />
          <Legend />
          {reverseAddress && (
            <div className="absolute bottom-14 right-3 z-[500] max-w-xs rounded-lg border border-border bg-card/95 p-2 text-xs shadow-lg">
              {reverseAddress}
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-3 right-3 z-[500] md:hidden"
            onClick={() => setPanelOpen(!panelOpen)}
          >
            <PanelBottom className="mr-1 h-4 w-4" />
            Insight
          </Button>
        </div>

        <div className={`${panelOpen ? 'block' : 'hidden'} lg:block lg:w-1/4`}>
          <div className="h-full min-h-[300px] max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:z-[700] max-lg:max-h-[55vh] max-lg:rounded-t-xl max-lg:border-t max-lg:shadow-2xl">
            <SpatialInsight onLocate={(lat, lng) => mapRef.current?.flyTo(lat, lng)} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function GISPage() {
  return (
    <GisProvider>
      <GISLayout />
    </GisProvider>
  )
}
