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
};

export function normalizeKabupaten(value?: string | null): string {
  if (!value?.trim()) return '';
  const key = value.toLowerCase().trim();
  return KABUPATEN_ALIASES[key] ?? value.trim();
}

export function formatWilayah(kabupaten?: string | null, kecamatan?: string | null): string {
  const kab = normalizeKabupaten(kabupaten);
  if (kab) return kab;
  if (kecamatan?.trim()) return kecamatan.trim();
  return '';
}
