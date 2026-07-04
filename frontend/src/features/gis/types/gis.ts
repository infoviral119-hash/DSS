export interface GisMapPoint {
  id: string
  lat: number
  lng: number
  nomorRegister: string
  namaKorban: string
  jenisKekerasan: string
  jenisKelamin: string
  status: string
  tanggal: string
  kabupaten: string
  kecamatan: string
  provinsi: string
}

export interface GisCluster {
  name: string
  count: number
  kabupaten: string
  lat: number
  lng: number
  color: string
}

export interface KabupatenStat {
  name: string
  count: number
  aktif: number
  selesai: number
}

export interface GisMapData {
  connected: boolean
  points: GisMapPoint[]
  clusters: GisCluster[]
  kabupatenStats: KabupatenStat[]
  kecamatanStats: { name: string; kabupaten: string; count: number }[]
  total: number
  withGps: number
  withoutGps: number
  aktif: number
  selesai: number
  provinsiCount: number
  kabupatenCount: number
  completionRate: number
}

export type ClusterMethod = 'dbscan' | 'kmeans' | 'grid' | 'marker'
export type ChoroplethMetric = 'total' | 'aktif' | 'completion'
export type GisTool = 'none' | 'radius' | 'polygon' | 'buffer' | 'nearest' | 'geocode'

export type ServiceCategory =
  | 'rumah_sakit'
  | 'polsek'
  | 'lbh'
  | 'shelter'
  | 'psikolog'
  | 'p2tp2a'
  | 'kejaksaan'
  | 'pengadilan'
  | 'puskesmas'

export interface PublicService {
  id: string
  name: string
  category: ServiceCategory
  lat: number
  lng: number
  address?: string
}

export interface LayerState {
  markers: boolean
  cluster: boolean
  heatmap: boolean
  hotspot: boolean
  kabupaten: boolean
  provinsi: boolean
  kecamatan: boolean
  radius: boolean
  buffer: boolean
  polygon: boolean
  choropleth: boolean
  satellite: boolean
  osm: boolean
}

export const DEFAULT_LAYERS: LayerState = {
  markers: true,
  cluster: true,
  heatmap: false,
  hotspot: false,
  kabupaten: false,
  provinsi: false,
  kecamatan: false,
  radius: false,
  buffer: false,
  polygon: false,
  choropleth: false,
  satellite: false,
  osm: true,
}

export interface HotspotSettings {
  intensity: number
  radius: number
  opacity: number
}

export interface RadiusResult {
  center: [number, number]
  radiusM: number
  count: number
  byJenis: Record<string, number>
  byStatus: Record<string, number>
  byGender: Record<string, number>
  cases: GisMapPoint[]
}

export interface PolygonResult {
  count: number
  aktif: number
  selesai: number
  byJenis: Record<string, number>
  byGender: Record<string, number>
  byKabupaten: Record<string, number>
  byKecamatan: Record<string, number>
  cases: GisMapPoint[]
}

export const SERVICE_LABELS: Record<ServiceCategory, string> = {
  rumah_sakit: 'Rumah Sakit',
  polsek: 'Polsek',
  lbh: 'LBH',
  shelter: 'Shelter',
  psikolog: 'Psikolog',
  p2tp2a: 'P2TP2A',
  kejaksaan: 'Kejaksaan',
  pengadilan: 'Pengadilan',
  puskesmas: 'Puskesmas',
}
