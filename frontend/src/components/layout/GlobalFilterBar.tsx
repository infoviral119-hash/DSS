import { useQuery } from '@tanstack/react-query'
import { Filter, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { api } from '@/lib/api'

const TAHUN_OPTIONS = [2021, 2022, 2023, 2024, 2025]

export function GlobalFilterBar() {
  const { filters, setFilters, resetFilters } = useApp()

  const { data: options } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => (await api.get('/api/cases/filter-options')).data,
    staleTime: 60000,
  })

  const kabupatenList: string[] = options?.kabupaten?.length
    ? options.kabupaten
    : ['Kota Mataram', 'Lombok Barat', 'Lombok Tengah']

  const jenisList: string[] = options?.jenisKekerasan?.length
    ? options.jenisKekerasan
    : ['Fisik', 'Seksual', 'Psikologis', 'Penelantaran']

  const statusList: string[] = options?.status?.length
    ? options.status
    : ['Aktif', 'Selesai', 'Dirujuk']

  return (
    <div className="glass-panel mb-4 flex flex-wrap items-center gap-2 rounded-lg p-3" data-tour="global-filter">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        Filter Global
      </div>

      <select
        value={filters.tahun ?? ''}
        onChange={(e) => setFilters({ tahun: e.target.value ? Number(e.target.value) : null })}
        className="h-8 rounded-md border border-border bg-white/50 px-2 text-xs dark:bg-black/20"
      >
        <option value="">Semua Tahun</option>
        {TAHUN_OPTIONS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select
        value={filters.kabupaten ?? ''}
        onChange={(e) => setFilters({ kabupaten: e.target.value || null })}
        className="h-8 rounded-md border border-border bg-white/50 px-2 text-xs dark:bg-black/20"
      >
        <option value="">Semua Kabupaten</option>
        {kabupatenList.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>

      <select
        value={filters.jenisKekerasan ?? ''}
        onChange={(e) => setFilters({ jenisKekerasan: e.target.value || null })}
        className="h-8 rounded-md border border-border bg-white/50 px-2 text-xs dark:bg-black/20"
      >
        <option value="">Semua Jenis</option>
        {jenisList.map((j) => (
          <option key={j} value={j}>{j}</option>
        ))}
      </select>

      <select
        value={filters.jenisKelamin ?? ''}
        onChange={(e) => setFilters({ jenisKelamin: e.target.value || null })}
        className="h-8 rounded-md border border-border bg-white/50 px-2 text-xs dark:bg-black/20"
      >
        <option value="">Semua Gender</option>
        <option value="Perempuan">Perempuan</option>
        <option value="Laki-laki">Laki-laki</option>
      </select>

      <select
        value={filters.status ?? ''}
        onChange={(e) => setFilters({ status: e.target.value || null })}
        className="h-8 rounded-md border border-border bg-white/50 px-2 text-xs dark:bg-black/20"
      >
        <option value="">Semua Status</option>
        {statusList.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto h-8 text-xs">
        <RotateCcw className="mr-1 h-3 w-3" />
        Reset
      </Button>
    </div>
  )
}
