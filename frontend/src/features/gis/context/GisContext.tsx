import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import type {
  ClusterMethod,
  ChoroplethMetric,
  GisTool,
  HotspotSettings,
  LayerState,
  RadiusResult,
  PolygonResult,
} from '@/features/gis/types/gis'
import { DEFAULT_LAYERS } from '@/features/gis/types/gis'
import type { ClusterGroup } from '@/features/gis/utils/clustering'
import type { PublicService, ServiceCategory } from '@/features/gis/types/gis'

interface GisContextValue {
  layers: LayerState
  setLayers: React.Dispatch<React.SetStateAction<LayerState>>
  toggleLayer: (key: keyof LayerState) => void
  activeTool: GisTool
  setActiveTool: (t: GisTool) => void
  clusterMethod: ClusterMethod
  setClusterMethod: (m: ClusterMethod) => void
  clusterCount: number
  setClusterCount: (n: number) => void
  clusterGroups: ClusterGroup[]
  setClusterGroups: (g: ClusterGroup[]) => void
  hotspot: HotspotSettings
  setHotspot: React.Dispatch<React.SetStateAction<HotspotSettings>>
  choroplethMetric: ChoroplethMetric
  setChoroplethMetric: (m: ChoroplethMetric) => void
  radiusM: number
  setRadiusM: (m: number) => void
  radiusResult: RadiusResult | null
  setRadiusResult: (r: RadiusResult | null) => void
  polygonResult: PolygonResult | null
  setPolygonResult: (r: PolygonResult | null) => void
  bufferService: PublicService | null
  setBufferService: (s: PublicService | null) => void
  bufferKm: number
  setBufferKm: (k: number) => void
  nearestCategory: ServiceCategory
  setNearestCategory: (c: ServiceCategory) => void
  panelOpen: boolean
  setPanelOpen: (o: boolean) => void
  reverseAddress: string
  setReverseAddress: (a: string) => void
  selectedPointId: string | null
  setSelectedPointId: (id: string | null) => void
}

const GisContext = createContext<GisContextValue | null>(null)

export function GisProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS)
  const [activeTool, setActiveTool] = useState<GisTool>('none')
  const [clusterMethod, setClusterMethod] = useState<ClusterMethod>('marker')
  const [clusterCount, setClusterCount] = useState(5)
  const [clusterGroups, setClusterGroups] = useState<ClusterGroup[]>([])
  const [hotspot, setHotspot] = useState<HotspotSettings>({ intensity: 1, radius: 48, opacity: 0.65 })
  const [choroplethMetric, setChoroplethMetric] = useState<ChoroplethMetric>('total')
  const [radiusM, setRadiusM] = useState(1000)
  const [radiusResult, setRadiusResult] = useState<RadiusResult | null>(null)
  const [polygonResult, setPolygonResult] = useState<PolygonResult | null>(null)
  const [bufferService, setBufferService] = useState<PublicService | null>(null)
  const [bufferKm, setBufferKm] = useState(5)
  const [nearestCategory, setNearestCategory] = useState<ServiceCategory>('rumah_sakit')
  const [panelOpen, setPanelOpen] = useState(true)
  const [reverseAddress, setReverseAddress] = useState('')
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)

  const toggleLayer = (key: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const value = useMemo(
    () => ({
      layers,
      setLayers,
      toggleLayer,
      activeTool,
      setActiveTool,
      clusterMethod,
      setClusterMethod,
      clusterCount,
      setClusterCount,
      clusterGroups,
      setClusterGroups,
      hotspot,
      setHotspot,
      choroplethMetric,
      setChoroplethMetric,
      radiusM,
      setRadiusM,
      radiusResult,
      setRadiusResult,
      polygonResult,
      setPolygonResult,
      bufferService,
      setBufferService,
      bufferKm,
      setBufferKm,
      nearestCategory,
      setNearestCategory,
      panelOpen,
      setPanelOpen,
      reverseAddress,
      setReverseAddress,
      selectedPointId,
      setSelectedPointId,
    }),
    [
      layers, activeTool, clusterMethod, clusterCount, clusterGroups, hotspot,
      choroplethMetric, radiusM, radiusResult, polygonResult, bufferService,
      bufferKm, nearestCategory, panelOpen, reverseAddress, selectedPointId,
    ],
  )

  return <GisContext.Provider value={value}>{children}</GisContext.Provider>
}

export function useGis() {
  const ctx = useContext(GisContext)
  if (!ctx) throw new Error('useGis must be used within GisProvider')
  return ctx
}
