const KOTA: Record<string, [number, number]> = {
  'kota bandung': [-6.9175, 107.6191], bandung: [-6.9175, 107.6191],
  'dki jakarta': [-6.2088, 106.8456], jakarta: [-6.2088, 106.8456],
  'kota cimahi': [-6.8841, 107.5417], cimahi: [-6.8841, 107.5417],
  'kota mataram': [-8.5833, 116.1167], mataram: [-8.5833, 116.1167],
  'lombok barat': [-8.6533, 116.0956],
}
const KABUPATEN: Record<string, [number, number]> = {
  kbb: [-6.893, 107.565], 'bandung barat': [-6.893, 107.565],
  'kabupaten bandung': [-7.1, 107.6], cianjur: [-6.8222, 107.1394],
}
const PROVINSI: Record<string, [number, number]> = {
  'jawa barat': [-6.9, 107.6], 'nusa tenggara barat': [-8.5833, 116.1167],
}

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/^kec(amatan)?\.?\s*/i, '').replace(/^kab(upaten)?\.?\s*/i, '').replace(/^kota\s+/i, 'kota ')
}

function lookup(table: Record<string, [number, number]>, raw?: string) {
  if (!raw) return null
  const key = normalize(raw)
  if (table[key]) return table[key]
  const hit = Object.entries(table).find(([k]) => key.includes(k) || k.includes(key))
  return hit ? hit[1] : null
}

function hashJitter(seed: string): [number, number] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const angle = ((h & 0xffff) / 0xffff) * Math.PI * 2
  const dist = 0.006 + ((h >> 16) & 0xff) / 0xff * 0.018
  return [Math.cos(angle) * dist, Math.sin(angle) * dist]
}

export function resolveCoords(kecamatan?: string, kabupaten?: string, provinsi?: string, seed = ''): [number, number] | null {
  const base = lookup(KOTA, kabupaten) ?? lookup(KOTA, kecamatan) ?? lookup(KABUPATEN, kabupaten) ?? lookup(PROVINSI, provinsi)
  if (!base) return null
  const [dy, dx] = hashJitter(seed || `${kecamatan}-${kabupaten}`)
  return [base[0] + dy, base[1] + dx]
}

export function countColor(count: number, max: number) {
  const t = max > 0 ? Math.min(count / max, 1) : 0
  return `rgb(${Math.round(41 + t * 200)},${Math.round(128 - t * 90)},${Math.round(185 - t * 120)})`
}

export function normalizeKabupaten(name: string) {
  return name.replace(/^kabupaten\s+/i, '').replace(/^kota\s+/i, 'Kota ').trim()
}
