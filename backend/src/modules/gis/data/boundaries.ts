type Polygon = { type: 'Polygon'; coordinates: number[][][] }

interface FeatureCollection {
  type: 'FeatureCollection'
  features: { type: 'Feature'; properties: Record<string, string>; geometry: Polygon }[]
}

const REGION_BOX: Record<string, { center: [number, number]; size: number }> = {
  'Jawa Barat': { center: [-6.9, 107.6], size: 0.55 },
  'DKI Jakarta': { center: [-6.2088, 106.8456], size: 0.12 },
  'Nusa Tenggara Barat': { center: [-8.5833, 116.1167], size: 0.45 },
  'Kota Bandung': { center: [-6.9175, 107.6191], size: 0.08 },
  DKI: { center: [-6.2088, 106.8456], size: 0.12 },
  'Kabupaten Bandung Barat': { center: [-6.893, 107.565], size: 0.1 },
  'Kabupaten Bandung': { center: [-7.1, 107.6], size: 0.12 },
  'Kota Cimahi': { center: [-6.8841, 107.5417], size: 0.06 },
  'Kota Bekasi': { center: [-6.2383, 106.9756], size: 0.07 },
  'Kota Depok': { center: [-6.4025, 106.7942], size: 0.07 },
  'Kota Bogor': { center: [-6.595, 106.816], size: 0.08 },
  'Kota Tangerang': { center: [-6.1783, 106.6319], size: 0.07 },
  Cianjur: { center: [-6.8222, 107.1394], size: 0.1 },
  Sumedang: { center: [-6.8329, 107.9532], size: 0.1 },
  Garut: { center: [-7.2279, 107.9088], size: 0.12 },
  Tasikmalaya: { center: [-7.3274, 108.2207], size: 0.1 },
  Purwakarta: { center: [-6.5569, 107.443], size: 0.09 },
  Subang: { center: [-6.5695, 107.752], size: 0.09 },
  Karawang: { center: [-6.3227, 107.3376], size: 0.1 },
  'Kota Mataram': { center: [-8.5833, 116.1167], size: 0.06 },
  'Lombok Barat': { center: [-8.6533, 116.0956], size: 0.1 },
  'Lombok Tengah': { center: [-8.7167, 116.2833], size: 0.1 },
  'Lombok Timur': { center: [-8.5667, 116.5333], size: 0.12 },
  'Lombok Utara': { center: [-8.3522, 116.2156], size: 0.1 },
}

function boxPolygon(center: [number, number], size: number): Polygon {
  const [lat, lng] = center
  const h = size / 2
  return {
    type: 'Polygon',
    coordinates: [[
      [lng - h, lat - h],
      [lng + h, lat - h],
      [lng + h, lat + h],
      [lng - h, lat + h],
      [lng - h, lat - h],
    ]],
  }
}

function toFeature(name: string, level: string, provinsi?: string) {
  const cfg = REGION_BOX[name]
  if (!cfg) return null
  return {
    type: 'Feature' as const,
    properties: { name, level, provinsi: provinsi ?? name },
    geometry: boxPolygon(cfg.center, cfg.size),
  }
}

const PROVINSI_NAMES = ['Jawa Barat', 'DKI Jakarta', 'Nusa Tenggara Barat']
const KABUPATEN_NAMES = Object.keys(REGION_BOX).filter((k) => !PROVINSI_NAMES.includes(k))

export type BoundaryFeatureCollection = FeatureCollection

export function getBoundaryGeoJson(level: 'provinsi' | 'kabupaten' | 'kecamatan'): BoundaryFeatureCollection {
  if (level === 'provinsi') {
    return {
      type: 'FeatureCollection',
      features: PROVINSI_NAMES.map((n) => toFeature(n, 'provinsi')).filter(Boolean) as FeatureCollection['features'],
    }
  }
  if (level === 'kabupaten') {
    return {
      type: 'FeatureCollection',
      features: KABUPATEN_NAMES.map((n) => toFeature(n, 'kabupaten', 'Jawa Barat')).filter(Boolean) as FeatureCollection['features'],
    }
  }
  return { type: 'FeatureCollection', features: [] }
}
