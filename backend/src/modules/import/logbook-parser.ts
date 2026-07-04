import * as XLSX from 'xlsx';

const MONTH_MAP: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maret: 3, mar: 3,
  april: 4, apr: 4,
  mei: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  agustus: 8, agu: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10, oct: 10,
  november: 11, nov: 11,
  desember: 12, des: 12, dec: 12,
};

const SKIP_PATTERNS = [
  'panduan mengisi',
  'hanya diisi',
  'contoh :',
  'misal :',
  'logbook jari',
  'log book',
];

export interface ParsedLogbook {
  format: string;
  tahun: number;
  fileName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  skippedRows: number;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function isSkipRow(cells: unknown[]): boolean {
  const text = cells.map((c) => String(c ?? '').toLowerCase()).join(' ');
  if (!text.trim()) return true;
  return SKIP_PATTERNS.some((p) => text.includes(p));
}

function extractYear(fileName: string): number {
  const match = fileName.match(/(20\d{2}|201\d)/);
  return match ? Number(match[1]) : new Date().getFullYear();
}

function parseExcelDate(value: unknown, fallbackYear: number): string {
  if (value === null || value === undefined || value === '') return `${fallbackYear}-01-01`;

  if (typeof value === 'number' && value > 30000 && value < 60000) {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }

  const str = String(value).trim();
  const idDate = str.match(/(\d{1,2})\s+([a-zA-Z]+)(?:\s+(\d{4}))?/);
  if (idDate) {
    const day = Number(idDate[1]);
    const month = MONTH_MAP[idDate[2].toLowerCase()] ?? 1;
    const year = idDate[3] ? Number(idDate[3]) : fallbackYear;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return `${fallbackYear}-01-01`;
}

function normalizeGender(value: unknown): string {
  const v = String(value ?? '').toLowerCase().trim();
  if (v === 'p' || v.startsWith('perempuan') || v === 'w') return 'Perempuan';
  if (v === 'l' || v.startsWith('laki')) return 'Laki-laki';
  return String(value ?? '');
}

function findHeaderRow(raw: unknown[][]): number {
  for (let i = 0; i < Math.min(raw.length, 10); i++) {
    const row = raw[i].map(normalizeHeader);
    const joined = row.join(' ');
    if (
      (joined.includes('nama') || joined.includes('identitas klien')) &&
      (joined.includes('usia') || joined.includes('jenis kelamin') || joined.includes('tanggal'))
    ) {
      return i;
    }
  }
  return 0;
}

function colIndex(headers: string[], ...keywords: string[]): number {
  return headers.findIndex((h) => keywords.some((k) => h.includes(k)));
}

function pickCell(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return '';
  return String(row[index] ?? '').trim();
}

function combineViolenceForms(...parts: string[]): string {
  return parts.filter(Boolean).join(', ');
}

function parseV1Row(row: unknown[], headers: string[], tahun: number, index: number): Record<string, unknown> {
  const h = headers.map(normalizeHeader);
  const noIdx = colIndex(h, 'no', 'nomor');
  const tanggalIdx = colIndex(h, 'bulan pelaporan', 'tanggal');
  const namaIdx = colIndex(h, 'nama');
  const usiaIdx = colIndex(h, 'usia');
  const jkIdx = colIndex(h, 'jenis kelamin');
  const alamatIdx = colIndex(h, 'alamat');
  const pekerjaanIdx = colIndex(h, 'pekerjaan');
  const pendidikanIdx = colIndex(h, 'pendidikan');
  const jenisIdx = colIndex(h, 'jenis kekerasan');
  const pelakuIdx = colIndex(h, 'pelaku', 'identitas pelaku');
  const bentukIdx = colIndex(h, 'bentuk kekerasan');
  const prosesIdx = colIndex(h, 'proses penerimaan');
  const dirujukIdx = colIndex(h, 'dirujuk oleh', 'dirujuk');
  const psikologIdx = colIndex(h, 'psikolog', 'konselor');
  const teknikIdx = colIndex(h, 'teknik', 'proses konseling');
  const indikatorIdx = colIndex(h, 'indikator');
  const ketIdx = colIndex(h, 'keterangan', 'ket');

  const nomor = pickCell(row, noIdx) || `${tahun}-${String(index).padStart(4, '0')}`;
  const tanggalRaw = pickCell(row, tanggalIdx);
  const nama = pickCell(row, namaIdx);

  if (!nama || nama.length < 2) return {};

  const bentukParts: string[] = [];
  for (let i = bentukIdx; i < row.length && bentukParts.length < 4; i++) {
    if (i === bentukIdx || (i > bentukIdx && !pickCell(row, i).match(/^(website|hotline|rujukan|tatap|online|offline)/i))) {
      const val = pickCell(row, i).toLowerCase();
      if (['fisik', 'psikis', 'seksual', 'ekonomi', 'psikis'].includes(val) || val.includes('fisik') || val.includes('psikis')) {
        bentukParts.push(pickCell(row, i));
      }
    }
  }

  const proses = pickCell(row, prosesIdx);
  const teknik = pickCell(row, teknikIdx);
  const indikator = pickCell(row, indikatorIdx);

  return {
    nomor_register: `REG-${tahun}-${nomor}`,
    tanggal: parseExcelDate(tanggalRaw, tahun),
    nama_korban: nama,
    jenis_kelamin: normalizeGender(pickCell(row, jkIdx)),
    usia: pickCell(row, usiaIdx) ? Number(pickCell(row, usiaIdx)) || pickCell(row, usiaIdx) : null,
    pendidikan: pickCell(row, pendidikanIdx),
    pekerjaan: pickCell(row, pekerjaanIdx),
    status: indikator.toLowerCase().includes('tuntas') ? 'Selesai' : 'Aktif',
    jenis_kekerasan: pickCell(row, jenisIdx) || combineViolenceForms(...bentukParts),
    kategori: Number(pickCell(row, usiaIdx)) < 18 ? 'Anak' : 'Dewasa',
    pelaku: pickCell(row, pelakuIdx),
    hubungan_pelaku: pickCell(row, pelakuIdx),
    psikolog_nama: pickCell(row, psikologIdx),
    status_pendampingan: indikator || 'Berjalan',
    alamat: pickCell(row, alamatIdx),
    kabupaten: extractKabupaten(pickCell(row, alamatIdx)),
    provinsi: 'Jawa Barat',
    catatan: [
      pickCell(row, dirujukIdx),
      proses ? `Penerimaan: ${proses}` : '',
      pickCell(row, ketIdx),
      teknik ? `Konseling: ${teknik}` : '',
    ].filter(Boolean).join(' | '),
    outcome: indikator,
    tahun,
  };
}

function parseLegacyRow(row: unknown[], headers: string[], tahun: number, index: number): Record<string, unknown> {
  const h = headers.map(normalizeHeader);
  const noIdx = colIndex(h, 'no register', 'no');
  const tanggalIdx = colIndex(h, 'tanggal masuk', 'bulan');
  const psikologIdx = colIndex(h, 'konselor', 'relawan', 'psikolog');
  const klienIdx = colIndex(h, 'identitas klien');
  const alamatIdx = colIndex(h, 'alamat');
  const pelakuIdx = colIndex(h, 'identitas pelaku', 'pelaku');
  const jenisIdx = colIndex(h, 'jenis kasus', 'informasi');
  const indikatorIdx = colIndex(h, 'indikator');

  const klienText = pickCell(row, klienIdx);
  const nama = klienText.split(/[,(]/)[0].trim() || klienText.slice(0, 40);
  if (!nama || nama.length < 2) return {};

  const usiaMatch = klienText.match(/(\d{1,2})\s*(th|tahun|thn)/i);
  const genderMatch = klienText.toLowerCase();
  const jk = genderMatch.includes('perempuan') ? 'Perempuan' : genderMatch.includes('laki') ? 'Laki-laki' : '';

  return {
    nomor_register: `REG-${tahun}-${pickCell(row, noIdx) || index}`,
    tanggal: parseExcelDate(pickCell(row, tanggalIdx), tahun),
    nama_korban: nama,
    jenis_kelamin: jk,
    usia: usiaMatch ? Number(usiaMatch[1]) : null,
    jenis_kekerasan: pickCell(row, jenisIdx),
    pelaku: pickCell(row, pelakuIdx),
    hubungan_pelaku: pickCell(row, pelakuIdx),
    psikolog_nama: pickCell(row, psikologIdx),
    alamat: pickCell(row, alamatIdx),
    kabupaten: extractKabupaten(pickCell(row, alamatIdx)),
    provinsi: 'Jawa Barat',
    status: pickCell(row, indikatorIdx).toLowerCase().includes('tuntas') ? 'Selesai' : 'Aktif',
    outcome: pickCell(row, indikatorIdx),
    catatan: klienText,
    tahun,
  };
}

function extractKabupaten(alamat: string): string {
  const lower = alamat.toLowerCase();
  if (lower.includes('kbb') || lower.includes('bandung barat')) return 'Kabupaten Bandung Barat';
  if (lower.includes('bandung')) return 'Kota Bandung';
  if (lower.includes('cimahi')) return 'Kota Cimahi';
  if (lower.includes('bekasi')) return 'Kota Bekasi';
  if (lower.includes('surabaya')) return 'Kota Surabaya';
  if (lower.includes('jakarta')) return 'DKI Jakarta';
  if (lower.includes('semarang')) return 'Kota Semarang';
  if (lower.includes('kab.')) return alamat;
  return alamat;
}

function detectFormat(headers: string[], fileName: string): string {
  const joined = headers.join(' ');
  if (joined.includes('identitas klien') || joined.includes('tanggal masuk')) return 'jari_legacy';
  if (joined.includes('nama korban') || joined.includes('bulan pelaporan')) return 'jari_v2';
  if (joined.includes('nama') && joined.includes('bulan pelaporan')) return 'jari_v1';
  const year = extractYear(fileName);
  if (year >= 2023) return 'jari_v2';
  if (year <= 2020) return 'jari_legacy';
  return 'jari_v1';
}

export function parseLogbookFile(buffer: Buffer, fileName: string): ParsedLogbook {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const tahun = extractYear(fileName);
  const headerRowIdx = findHeaderRow(raw);
  const headerCells = (raw[headerRowIdx] ?? []).map((c) => String(c ?? '').trim());
  const headers = headerCells.filter(Boolean);
  const format = detectFormat(headers.map(normalizeHeader), fileName);

  const rows: Record<string, unknown>[] = [];
  let skippedRows = 0;

  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const row = raw[i] ?? [];
    if (isSkipRow(row)) {
      skippedRows++;
      continue;
    }

    const firstCell = String(row[0] ?? '').trim();
    if (!firstCell || Number.isNaN(Number(firstCell))) {
      if (!pickCell(row, colIndex(headerCells.map(normalizeHeader), 'nama', 'identitas'))) {
        skippedRows++;
        continue;
      }
    }

    const parsed =
      format === 'jari_legacy'
        ? parseLegacyRow(row, headerCells, tahun, rows.length + 1)
        : parseV1Row(row, headerCells, tahun, rows.length + 1);

    if (parsed.nama_korban) {
      rows.push(parsed);
    } else {
      skippedRows++;
    }
  }

  const standardHeaders = Object.keys(rows[0] ?? {
    nomor_register: '', tanggal: '', nama_korban: '', jenis_kelamin: '', usia: '',
    jenis_kekerasan: '', alamat: '', psikolog_nama: '', status: '',
  });

  return { format, tahun, fileName, headers: standardHeaders, rows, skippedRows };
}

export function parseLogbookFolder(files: { fileName: string; buffer: Buffer }[]): ParsedLogbook[] {
  return files
    .filter((f) => f.fileName.toLowerCase().includes('logbook'))
    .sort((a, b) => extractYear(a.fileName) - extractYear(b.fileName))
    .map((f) => parseLogbookFile(f.buffer, f.fileName));
}
