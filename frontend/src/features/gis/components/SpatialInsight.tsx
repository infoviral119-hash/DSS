import { useGisInsights, useGisMapData } from '@/features/gis/hooks/useGisData'
import { useGis } from '@/features/gis/context/GisContext'
import { formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { ClusterAnalysisMenu } from '@/features/gis/components/ClusterAnalysisMenu'
import { HotspotControls } from '@/features/gis/components/HotspotControls'
import { RadiusPanel } from '@/features/gis/components/RadiusPanel'
import { NearestPanel } from '@/features/gis/components/NearestPanel'
import { GeocodeSearch } from '@/features/gis/components/GeocodeSearch'
import { BufferPanel } from '@/features/gis/components/BufferPanel'

export function SpatialInsight({ onLocate }: { onLocate?: (lat: number, lng: number) => void }) {
  const { data } = useGisMapData()
  const { data: insightsData } = useGisInsights()
  const { panelOpen, setPanelOpen, radiusResult, polygonResult } = useGis()

  if (!panelOpen) {
    return (
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-2 top-1/2 z-[500] hidden -translate-y-1/2 md:flex"
        onClick={() => setPanelOpen(true)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card md:w-80 lg:w-96">
      <div className="flex items-center justify-between border-b border-border p-3">
        <h3 className="text-sm font-semibold">Panel Insight</h3>
        <Button variant="ghost" size="icon" className="hidden h-7 w-7 md:flex" onClick={() => setPanelOpen(false)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          <section>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Statistik GIS</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Stat label="Total" value={data?.total} />
              <Stat label="GPS Valid" value={data?.withGps} />
              <Stat label="Wilayah" value={data?.kabupatenCount} />
              <Stat label="Provinsi" value={data?.provinsiCount} />
            </div>
          </section>

          <ClusterAnalysisMenu />
          <HotspotControls />
          <BufferPanel />
          <GeocodeSearch onLocate={onLocate} />

          <section>
            <p className="mb-2 text-xs font-semibold">Hotspot — Top Kabupaten</p>
            <div className="space-y-1">
              {(data?.kabupatenStats ?? []).slice(0, 5).map((k) => (
                <div key={k.name} className="flex justify-between rounded bg-muted/50 px-2 py-1 text-xs">
                  <span className="truncate">{k.name}</span>
                  <span className="font-medium">{formatNumber(k.count)}</span>
                </div>
              ))}
            </div>
          </section>

          {radiusResult && <RadiusPanel result={radiusResult} />}
          {polygonResult && (
            <section className="rounded border border-border p-2 text-xs">
              <p className="font-semibold">Polygon Selection</p>
              <p>{formatNumber(polygonResult.count)} kasus · Aktif {polygonResult.aktif} · Selesai {polygonResult.selesai}</p>
            </section>
          )}

          <NearestPanel />

          <section>
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Spatial AI Insight
            </p>
            <ul className="space-y-2">
              {(insightsData?.insights ?? []).map((line, i) => (
                <li key={i} className="rounded-md border border-border bg-muted/30 p-2 text-xs leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded bg-muted/40 px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-semibold">{formatNumber(value ?? 0)}</p>
    </div>
  )
}
