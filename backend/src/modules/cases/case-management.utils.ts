type CaseRow = Record<string, unknown>;

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export function computeRiskScore(c: CaseRow): RiskLevel {
  let score = 0;
  const usia = c.usia as number | null;
  const jenis = String(c.jenis_kekerasan ?? '').toLowerCase();
  const hubungan = String(c.hubungan_pelaku ?? '').toLowerCase();
  const status = String(c.status ?? '');

  if (usia != null && usia < 18) score += 30;
  if (jenis.includes('seksual') || jenis.includes('perkosa')) score += 25;
  if (jenis.includes('kdrt') || jenis.includes('rumah tangga')) score += 15;
  if (hubungan.includes('suami') || hubungan.includes('pasangan') || hubungan.includes('pacar')) score += 15;
  if (status === 'Aktif') score += 10;
  if (!c.psikolog_nama) score += 5;

  if (score >= 60) return 'Critical';
  if (score >= 40) return 'High';
  if (score >= 20) return 'Medium';
  return 'Low';
}

export function detectDuplicates(cases: CaseRow[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const c of cases) {
    const key = `${String(c.nama_korban ?? '').toLowerCase()}|${String(c.tanggal ?? '')}`;
    const ids = groups.get(key) ?? [];
    ids.push(String(c.id));
    groups.set(key, ids);
  }
  const dupMap = new Map<string, string[]>();
  for (const [, ids] of groups) {
    if (ids.length > 1) ids.forEach((id) => dupMap.set(id, ids.filter((x) => x !== id)));
  }
  return dupMap;
}

export function computeDataQuality(cases: CaseRow[]) {
  let gpsEmpty = 0;
  let alamatEmpty = 0;
  let psikologEmpty = 0;
  let usiaEmpty = 0;
  let genderEmpty = 0;
  const dupMap = detectDuplicates(cases);
  const duplicates = dupMap.size;

  for (const c of cases) {
    if (c.latitude == null || c.longitude == null) gpsEmpty++;
    if (!c.alamat) alamatEmpty++;
    if (!c.psikolog_nama) psikologEmpty++;
    if (c.usia == null) usiaEmpty++;
    if (!c.jenis_kelamin) genderEmpty++;
  }

  const total = cases.length || 1;
  const issues = gpsEmpty + alamatEmpty + psikologEmpty + usiaEmpty + genderEmpty + duplicates;
  const maxIssues = total * 5 + duplicates;
  const score = Math.max(0, Math.round(100 - (issues / Math.max(maxIssues, 1)) * 100));

  return {
    score,
    gpsEmpty,
    alamatEmpty,
    psikologEmpty,
    usiaEmpty,
    genderEmpty,
    duplicates,
  };
}

export function expandedSearch(c: CaseRow, q: string): boolean {
  const hay = [
    c.nomor_register, c.nama_korban, c.alamat, c.psikolog_nama,
    c.kabupaten, c.kecamatan, c.catatan, c.pelaku, c.kategori, c.outcome,
  ].map((x) => String(x ?? '').toLowerCase()).join(' ');
  return hay.includes(q.toLowerCase());
}
