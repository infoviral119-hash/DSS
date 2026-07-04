export type UserRole =
  | 'admin'
  | 'operator'
  | 'psikolog'
  | 'supervisor'
  | 'direktur'
  | 'ketua_yayasan'
  | 'auditor'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string
}

export interface GlobalFilters {
  tahun: number | null
  tanggalMulai: string | null
  tanggalSelesai: string | null
  kabupaten: string | null
  kecamatan: string | null
  kelurahan: string | null
  jenisKekerasan: string | null
  jenisKelamin: string | null
  usiaMin: number | null
  usiaMax: number | null
  psikolog: string | null
  status: string | null
  kategori: string | null
  outcome: string | null
}

export const DEFAULT_FILTERS: GlobalFilters = {
  tahun: null,
  tanggalMulai: null,
  tanggalSelesai: null,
  kabupaten: null,
  kecamatan: null,
  kelurahan: null,
  jenisKekerasan: null,
  jenisKelamin: null,
  usiaMin: null,
  usiaMax: null,
  psikolog: null,
  status: null,
  kategori: null,
  outcome: null,
}

export interface CaseRecord {
  id: string
  nomorRegister: string
  tanggal: string
  namaKorban: string
  jenisKelamin: string
  usia: number
  pendidikan: string
  pekerjaan: string
  status: string
  jenisKekerasan: string
  kategori: string
  pelaku: string
  hubunganPelaku: string
  psikolog: string
  statusPendampingan: string
  tanggalSelesai: string | null
  lamaPendampingan: number | null
  alamat: string
  rt: string
  rw: string
  kelurahan: string
  kecamatan: string
  kabupaten: string
  provinsi: string
  latitude: number | null
  longitude: number | null
  catatan: string | null
  tahun: number
}

export interface NavItem {
  id: string
  label: string
  path: string
  icon: string
  roles?: UserRole[]
}
