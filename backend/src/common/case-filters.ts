export interface CaseFilters {
  tahun?: number;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  kabupaten?: string;
  kecamatan?: string;
  kelurahan?: string;
  jenisKekerasan?: string;
  jenisKelamin?: string;
  usiaMin?: number;
  usiaMax?: number;
  psikolog?: string;
  status?: string;
  kategori?: string;
  outcome?: string;
  search?: string;
  limit?: number;
}

type CaseRow = Record<string, unknown>;

export function parseCaseFilters(query: Record<string, string | undefined>): CaseFilters {
  const num = (v?: string) => (v !== undefined && v !== '' ? Number(v) : undefined);
  return {
    tahun: num(query.tahun),
    tanggalMulai: query.tanggalMulai || undefined,
    tanggalSelesai: query.tanggalSelesai || undefined,
    kabupaten: query.kabupaten || undefined,
    kecamatan: query.kecamatan || undefined,
    kelurahan: query.kelurahan || undefined,
    jenisKekerasan: query.jenisKekerasan || undefined,
    jenisKelamin: query.jenisKelamin || undefined,
    usiaMin: num(query.usiaMin),
    usiaMax: num(query.usiaMax),
    psikolog: query.psikolog || undefined,
    status: query.status || undefined,
    kategori: query.kategori || undefined,
    outcome: query.outcome || undefined,
    search: query.search || undefined,
    limit: num(query.limit),
  };
}

export function applyCaseFilters(cases: CaseRow[], filters: CaseFilters): CaseRow[] {
  return cases.filter((c) => {
    const tahun = (c.tahun as number) ?? new Date(String(c.tanggal)).getFullYear();
    if (filters.tahun && tahun !== filters.tahun) return false;
    if (filters.tanggalMulai && String(c.tanggal) < filters.tanggalMulai) return false;
    if (filters.tanggalSelesai && String(c.tanggal) > filters.tanggalSelesai) return false;
    if (filters.kabupaten && c.kabupaten !== filters.kabupaten) return false;
    if (filters.kecamatan && c.kecamatan !== filters.kecamatan) return false;
    if (filters.kelurahan && c.kelurahan !== filters.kelurahan) return false;
    if (filters.jenisKekerasan && c.jenis_kekerasan !== filters.jenisKekerasan) return false;
    if (filters.jenisKelamin && c.jenis_kelamin !== filters.jenisKelamin) return false;
    if (filters.usiaMin != null && ((c.usia as number) ?? 0) < filters.usiaMin) return false;
    if (filters.usiaMax != null && ((c.usia as number) ?? 999) > filters.usiaMax) return false;
    if (filters.psikolog && c.psikolog_nama !== filters.psikolog) return false;
    if (filters.status && c.status !== filters.status) return false;
    if (filters.kategori && c.kategori !== filters.kategori) return false;
    if (filters.outcome && c.outcome !== filters.outcome) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${c.nomor_register} ${c.nama_korban}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function countByField(cases: CaseRow[], field: string, top = 10) {
  const map = new Map<string, number>();
  for (const c of cases) {
    const key = String(c[field] || 'Tidak diketahui');
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, count]) => ({ name, count }));
}
