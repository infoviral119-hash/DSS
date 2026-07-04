import type { GlobalFilters } from '@/types'

export function filtersToParams(filters: GlobalFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.tahun) params.tahun = String(filters.tahun)
  if (filters.tanggalMulai) params.tanggalMulai = filters.tanggalMulai
  if (filters.tanggalSelesai) params.tanggalSelesai = filters.tanggalSelesai
  if (filters.kabupaten) params.kabupaten = filters.kabupaten
  if (filters.kecamatan) params.kecamatan = filters.kecamatan
  if (filters.kelurahan) params.kelurahan = filters.kelurahan
  if (filters.jenisKekerasan) params.jenisKekerasan = filters.jenisKekerasan
  if (filters.jenisKelamin) params.jenisKelamin = filters.jenisKelamin
  if (filters.usiaMin != null) params.usiaMin = String(filters.usiaMin)
  if (filters.usiaMax != null) params.usiaMax = String(filters.usiaMax)
  if (filters.psikolog) params.psikolog = filters.psikolog
  if (filters.status) params.status = filters.status
  if (filters.kategori) params.kategori = filters.kategori
  if (filters.outcome) params.outcome = filters.outcome
  return params
}
