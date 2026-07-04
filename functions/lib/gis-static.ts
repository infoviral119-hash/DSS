export const PUBLIC_SERVICES = [
  { id: 'rs-1', name: 'RSUD Kota Bandung', category: 'rumah_sakit', lat: -6.9147, lng: 107.6098, address: 'Jl. Kebonjati, Bandung' },
  { id: 'rs-2', name: 'RS Hasan Sadikin', category: 'rumah_sakit', lat: -6.9012, lng: 107.5855, address: 'Jl. Pasteur, Bandung' },
  { id: 'pol-1', name: 'Polresta Bandung', category: 'polsek', lat: -6.9201, lng: 107.6185 },
  { id: 'lbh-1', name: 'LBH Bandung', category: 'lbh', lat: -6.905, lng: 107.612 },
  { id: 'sh-1', name: 'Rumah Aman Bandung', category: 'shelter', lat: -6.928, lng: 107.635 },
  { id: 'psi-1', name: 'Klinik Psikolog Bandung', category: 'psikolog', lat: -6.915, lng: 107.625 },
  { id: 'p2-1', name: 'P2TP2A Jawa Barat', category: 'p2tp2a', lat: -6.91, lng: 107.62 },
  { id: 'kej-1', name: 'Kejaksaan Negeri Bandung', category: 'kejaksaan', lat: -6.918, lng: 107.61 },
  { id: 'pn-1', name: 'Pengadilan Negeri Bandung', category: 'pengadilan', lat: -6.922, lng: 107.615 },
  { id: 'pk-1', name: 'Puskesmas Batujajar', category: 'puskesmas', lat: -6.895, lng: 107.508 },
]

const REGION_BOX: Record<string, { center: [number, number]; size: number }> = {
  'Jawa Barat': { center: [-6.9, 107.6], size: 0.55 },
  'DKI Jakarta': { center: [-6.2088, 106.8456], size: 0.12 },
  'Nusa Tenggara Barat': { center: [-8.5833, 116.1167], size: 0.45 },
  'Kota Bandung': { center: [-6.9175, 107.6191], size: 0.08 },
  'Kabupaten Bandung Barat': { center: [-6.893, 107.565], size: 0.1 },
  'Kota Cimahi': { center: [-6.8841, 107.5417], size: 0.06 },
  'Kota Mataram': { center: [-8.5833, 116.1167], size: 0.06 },
  'Lombok Barat': { center: [-8.6533, 116.0956], size: 0.1 },
}

function boxPolygon(center: [number, number], size: number) {
  const [lat, lng] = center
  const h = size / 2
  return { type: 'Polygon' as const, coordinates: [[[lng - h, lat - h], [lng + h, lat - h], [lng + h, lat + h], [lng - h, lat + h], [lng - h, lat - h]]] }
}

function toFeature(name: string, level: string, provinsi?: string) {
  const cfg = REGION_BOX[name]
  if (!cfg) return null
  return { type: 'Feature' as const, properties: { name, level, provinsi: provinsi ?? name }, geometry: boxPolygon(cfg.center, cfg.size) }
}

const PROVINSI_NAMES = ['Jawa Barat', 'DKI Jakarta', 'Nusa Tenggara Barat']
const KABUPATEN_NAMES = Object.keys(REGION_BOX).filter((k) => !PROVINSI_NAMES.includes(k))

export function getBoundaryGeoJson(level: 'provinsi' | 'kabupaten' | 'kecamatan') {
  if (level === 'provinsi') {
    return { type: 'FeatureCollection', features: PROVINSI_NAMES.map((n) => toFeature(n, 'provinsi')).filter(Boolean) }
  }
  if (level === 'kabupaten') {
    return { type: 'FeatureCollection', features: KABUPATEN_NAMES.map((n) => toFeature(n, 'kabupaten', 'Jawa Barat')).filter(Boolean) }
  }
  return { type: 'FeatureCollection', features: [] }
}
