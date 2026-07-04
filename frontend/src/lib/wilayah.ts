const KABUPATEN_ALIASES: Record<string, string> = {
  kbb: 'Kabupaten Bandung Barat',
  'kab. bandung barat': 'Kabupaten Bandung Barat',
  'bandung barat': 'Kabupaten Bandung Barat',
  jateng: 'Jawa Tengah',
  'dki jakarta': 'DKI Jakarta',
  jakarta: 'DKI Jakarta',
  bogor: 'Kota Bogor',
  depok: 'Kota Depok',
  tanggerang: 'Kota Tangerang',
  tangerang: 'Kota Tangerang',
  cimahi: 'Kota Cimahi',
  bekasi: 'Kota Bekasi',
  bandung: 'Kota Bandung',
  malang: 'Kota Malang',
  bali: 'Bali',
}

export function formatWilayah(kabupaten?: string | null, kecamatan?: string | null): string {
  const raw = (kabupaten ?? '').trim()
  if (!raw && !kecamatan?.trim()) return '—'
  const key = raw.toLowerCase()
  const label = KABUPATEN_ALIASES[key] ?? raw
  return label || kecamatan?.trim() || '—'
}
