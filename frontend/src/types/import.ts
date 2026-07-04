export interface PreviewResponse {
  batchId: string
  fileName: string
  fileType: string
  headers: string[]
  suggestedMapping: Record<string, string>
  previewRows: Record<string, unknown>[]
  totalRows: number
  isLogbook?: boolean
  logbookFormat?: string
  detectedTahun?: number
  skippedRows?: number
}

export interface ColumnIssue {
  field: string
  label: string
  count: number
  rows?: number[]
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

export interface ExecuteResponse {
  batchId: string
  status: string
  imported: number
  failed: number
  errors: { row: number; message: string }[]
}

export interface ImportLogEntry {
  at: string
  action: 'preview' | 'validate' | 'import' | 'rollback' | 'error'
  message: string
  meta?: Record<string, unknown>
}

export interface ImportHistoryItem {
  id: string
  fileName: string
  fileType: string
  tahun: number | null
  totalRows: number
  validRows: number
  errorRows: number
  warningRows?: number
  duplicateRows: number
  status: string
  createdAt: string
  completedAt?: string
  logCount?: number
}

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

export type ImportStep = 'upload' | 'mapping' | 'validate' | 'import' | 'done'
