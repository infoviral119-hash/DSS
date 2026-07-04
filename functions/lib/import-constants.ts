export const MIN_LOGBOOK_YEAR = 2021;

export const CASE_FIELDS = [
  { key: 'nomor_register', label: 'Nomor Register', required: true },
  { key: 'tanggal', label: 'Tanggal', required: true },
  { key: 'nama_korban', label: 'Nama Korban', required: true },
  { key: 'jenis_kelamin', label: 'Jenis Kelamin', required: false },
  { key: 'usia', label: 'Usia', required: false },
  { key: 'pendidikan', label: 'Pendidikan', required: false },
  { key: 'pekerjaan', label: 'Pekerjaan', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'jenis_kekerasan', label: 'Jenis Kekerasan', required: true },
  { key: 'kategori', label: 'Kategori', required: false },
  { key: 'pelaku', label: 'Pelaku', required: false },
  { key: 'hubungan_pelaku', label: 'Hubungan Pelaku', required: false },
  { key: 'psikolog_nama', label: 'Psikolog', required: false },
  { key: 'status_pendampingan', label: 'Status Pendampingan', required: false },
  { key: 'tanggal_selesai', label: 'Tanggal Selesai', required: false },
  { key: 'lama_pendampingan', label: 'Lama Pendampingan', required: false },
  { key: 'alamat', label: 'Alamat', required: false },
  { key: 'rt', label: 'RT', required: false },
  { key: 'rw', label: 'RW', required: false },
  { key: 'kelurahan', label: 'Kelurahan', required: false },
  { key: 'kecamatan', label: 'Kecamatan', required: false },
  { key: 'kabupaten', label: 'Kabupaten', required: false },
  { key: 'provinsi', label: 'Provinsi', required: false },
  { key: 'latitude', label: 'Latitude', required: false },
  { key: 'longitude', label: 'Longitude', required: false },
  { key: 'catatan', label: 'Catatan', required: false },
] as const

export type CaseFieldKey = (typeof CASE_FIELDS)[number]['key']

export const COLUMN_ALIASES: Record<CaseFieldKey, string[]> = {
  nomor_register: ['nomor register', 'no register', 'register', 'no_reg', 'nomor_reg', 'no', 'nomor'],
  tanggal: ['tanggal', 'tgl', 'date', 'tanggal kasus', 'bulan pelaporan', 'tanggal masuk'],
  nama_korban: ['nama korban', 'nama', 'korban', 'nama klien', 'identitas klien'],
  jenis_kelamin: ['jenis kelamin', 'gender', 'jk', 'kelamin', 'jenis kelamin (l/p)'],
  usia: ['usia', 'umur', 'age'],
  pendidikan: ['pendidikan', 'education'],
  pekerjaan: ['pekerjaan', 'occupation', 'profesi'],
  status: ['status', 'status kasus'],
  jenis_kekerasan: ['jenis kekerasan', 'kekerasan', 'violence type', 'jenis kasus', 'informasi'],
  kategori: ['kategori', 'category'],
  pelaku: ['pelaku', 'perpetrator', 'identitas pelaku'],
  hubungan_pelaku: ['hubungan pelaku', 'hubungan', 'relasi pelaku', 'relasi dengan korban'],
  psikolog_nama: ['psikolog', 'petugas', 'counselor', 'konselor', 'psikolog/konselor'],
  status_pendampingan: ['status pendampingan', 'pendampingan', 'indikator'],
  tanggal_selesai: ['tanggal selesai', 'tgl selesai', 'selesai'],
  lama_pendampingan: ['lama pendampingan', 'durasi', 'lama'],
  alamat: ['alamat', 'address'],
  rt: ['rt'],
  rw: ['rw'],
  kelurahan: ['kelurahan', 'desa', 'kel'],
  kecamatan: ['kecamatan', 'kec'],
  kabupaten: ['kabupaten', 'kab', 'kota'],
  provinsi: ['provinsi', 'prov'],
  latitude: ['latitude', 'lat'],
  longitude: ['longitude', 'lng', 'lon'],
  catatan: ['catatan', 'notes', 'keterangan'],
}

export interface ColumnIssue {
  field: string;
  label: string;
  count: number;
  rows?: number[];
}

export interface ImportLogEntry {
  at: string;
  action: 'preview' | 'validate' | 'import' | 'rollback' | 'error';
  message: string;
  meta?: Record<string, unknown>;
}

export interface ImportRow {
  rowNumber: number
  data: Record<string, string | number | null>
  errors: string[]
  warnings: string[]
  isDuplicate: boolean
}

export interface ImportBatch {
  id: string
  fileName: string
  fileType: string
  tahun: number | null
  headers: string[]
  mapping: Record<string, string>
  rows: ImportRow[]
  totalRows: number
  validRows: number
  errorRows: number
  duplicateRows: number
  warningRows: number
  status: 'preview' | 'validated' | 'importing' | 'completed' | 'failed' | 'rolled_back'
  importedCaseIds: string[]
  emptyColumns: ColumnIssue[]
  invalidColumns: ColumnIssue[]
  logs: ImportLogEntry[]
  createdAt: string
  completedAt?: string
}

export interface PreviewResponse {
  batchId: string
  fileName: string
  fileType: string
  headers: string[]
  suggestedMapping: Record<string, string>
  previewRows: Record<string, unknown>[]
  totalRows: number
}

export interface ValidationResponse {
  batchId: string
  totalRows: number
  validRows: number
  errorRows: number
  warningRows: number
  duplicateRows: number
  emptyColumns: ColumnIssue[]
  invalidColumns: ColumnIssue[]
  errors: { row: number; field: string; message: string }[]
  warnings: { row: number; field?: string; message: string }[]
  duplicates: { row: number; nomorRegister: string }[]
  previewRows: Record<string, unknown>[]
}
