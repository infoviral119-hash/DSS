const KOTA: Record<string, [number, number]> = {
  'kota bandung': [-6.9175, 107.6191],
  bandung: [-6.9175, 107.6191],
  'dki jakarta': [-6.2088, 106.8456],
  jakarta: [-6.2088, 106.8456],
  'kota cimahi': [-6.8841, 107.5417],
  cimahi: [-6.8841, 107.5417],
  'kota bekasi': [-6.2383, 106.9756],
  bekasi: [-6.2383, 106.9756],
  'kota depok': [-6.4025, 106.7942],
  depok: [-6.4025, 106.7942],
  'kota bogor': [-6.595, 106.816],
  bogor: [-6.5971, 106.806],
  'kota tangerang': [-6.1783, 106.6319],
  tanggerang: [-6.1783, 106.6319],
  tangerang: [-6.1783, 106.6319],
  'kota sukabumi': [-6.9277, 106.93],
  sukabumi: [-6.9277, 106.93],
  'kota malang': [-7.9797, 112.6304],
  malang: [-7.9797, 112.6304],
  'kota semarang': [-6.9667, 110.4167],
  'kota surabaya': [-7.2575, 112.7521],
  surabaya: [-7.2575, 112.7521],
  palembang: [-2.9761, 104.7754],
  bali: [-8.4095, 115.1889],
  denpasar: [-8.6705, 115.2126],
};

const KABUPATEN: Record<string, [number, number]> = {
  kbb: [-6.893, 107.565],
  'kabupaten bandung barat': [-6.893, 107.565],
  'bandung barat': [-6.893, 107.565],
  'kabupaten bandung': [-7.1, 107.6],
  cianjur: [-6.8222, 107.1394],
  sumedang: [-6.8329, 107.9532],
  'kabupaten bogor': [-6.6, 106.8],
  'kabupaten bekasi': [-6.28, 107.05],
  'kabupaten tangerang': [-6.2, 106.55],
  garut: [-7.2279, 107.9088],
  tasikmalaya: [-7.3274, 108.2207],
  purwakarta: [-6.5569, 107.443],
  subang: [-6.5695, 107.752],
  karawang: [-6.3227, 107.3376],
  cirebon: [-6.732, 108.5523],
  indramayu: [-6.3277, 108.32],
  majalengka: [-6.8361, 108.242],
  kuningan: [-6.9833, 108.4833],
  'kota mataram': [-8.5833, 116.1167],
  mataram: [-8.5833, 116.1167],
  'lombok barat': [-8.6533, 116.0956],
  'lombok tengah': [-8.7167, 116.2833],
  'lombok timur': [-8.5667, 116.5333],
  'lombok utara': [-8.3522, 116.2156],
};

const PROVINSI: Record<string, [number, number]> = {
  'jawa barat': [-6.9, 107.6],
  'dki jakarta': [-6.2088, 106.8456],
  'nusa tenggara barat': [-8.5833, 116.1167],
  'jawa timur': [-7.5, 112.5],
  bali: [-8.4095, 115.1889],
};

const JAVA_KAB_KEYWORDS = [
  'bandung', 'jakarta', 'bekasi', 'bogor', 'depok', 'tangerang', 'tanggerang',
  'cimahi', 'cianjur', 'sumedang', 'garut', 'tasik', 'purwakarta', 'subang',
  'karawang', 'cirebon', 'kbb', 'jawa barat', 'jabar',
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^kec(amatan)?\.?\s*/i, '')
    .replace(/^kab(upaten)?\.?\s*/i, '')
    .replace(/^kota\s+/i, 'kota ');
}

function lookup(table: Record<string, [number, number]>, raw?: string) {
  if (!raw) return null;
  const key = normalize(raw);
  if (table[key]) return table[key];
  const hit = Object.entries(table).find(([k]) => key.includes(k) || k.includes(key));
  return hit ? hit[1] : null;
}

function hashJitter(seed: string): [number, number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const angle = ((h & 0xffff) / 0xffff) * Math.PI * 2;
  const dist = 0.006 + ((h >> 16) & 0xff) / 0xff * 0.018;
  return [Math.cos(angle) * dist, Math.sin(angle) * dist];
}

export function resolveCoords(
  kecamatan?: string,
  kabupaten?: string,
  provinsi?: string,
  seed = '',
): [number, number] | null {
  const base =
    lookup(KOTA, kabupaten) ??
    lookup(KOTA, kecamatan) ??
    lookup(KABUPATEN, kabupaten) ??
    lookup(KABUPATEN, kecamatan) ??
    lookup(PROVINSI, provinsi);

  if (!base) return null;

  const [dy, dx] = hashJitter(seed || `${kecamatan}-${kabupaten}`);
  return [base[0] + dy, base[1] + dx];
}

export function isLikelyWrongCoords(
  kabupaten?: string | null,
  provinsi?: string | null,
  latitude?: number | null,
  longitude?: number | null,
) {
  if (latitude == null || longitude == null) return false;
  const label = `${kabupaten ?? ''} ${provinsi ?? ''}`.toLowerCase();
  const isJava = JAVA_KAB_KEYWORDS.some((k) => label.includes(k));
  const inNtb = latitude < -7.8 && latitude > -9.5 && longitude > 115 && longitude < 118;
  return isJava && inNtb;
}

export function geocodeIfMissing(
  kecamatan?: string | null,
  kabupaten?: string | null,
  provinsi?: string | null,
  latitude?: number | null,
  longitude?: number | null,
  seed = '',
) {
  if (latitude != null && longitude != null && !isLikelyWrongCoords(kabupaten, provinsi, latitude, longitude)) {
    return { latitude, longitude, geocoded: false };
  }
  if (!kecamatan && !kabupaten && !provinsi) {
    return { latitude: null, longitude: null, geocoded: false };
  }
  const resolved = resolveCoords(kecamatan ?? undefined, kabupaten ?? undefined, provinsi ?? undefined, seed);
  if (!resolved) return { latitude: null, longitude: null, geocoded: false };
  return { latitude: resolved[0], longitude: resolved[1], geocoded: true };
}

export function countColor(count: number, max: number) {
  const t = max > 0 ? Math.min(count / max, 1) : 0;
  const r = Math.round(41 + t * 200);
  const g = Math.round(128 - t * 90);
  const b = Math.round(185 - t * 120);
  return `rgb(${r},${g},${b})`;
}
