import { useState, useMemo } from 'react'
import { useApp } from '@/contexts/AppContext'
import { PageHeader } from '@/features/admin-security/components/PageHeader'
import { KpiGrid } from '@/features/backup-recovery/shared/components/KpiCard'
import { PageToolbar } from '@/features/backup-recovery/shared/components/PageToolbar'
import { EnterpriseTable } from '@/features/backup-recovery/shared/components/EnterpriseTable'
import { StatusBadge } from '@/features/backup-recovery/shared/components/StatusBadge'
import { DashboardSkeleton, TableSkeleton } from '@/features/backup-recovery/shared/components/SkeletonBlock'
import { CaseDetailDrawer } from '../drawers/CaseDetailDrawer'
import {
  useCaseKpis, useCaseList, useCaseQuality, useCaseAnalytics,
  useSavedFilters, useSaveFilter, useExportCases, useBulkCaseAction,
} from '../hooks/useCaseManagement'
import { DEFAULT_COLUMNS, RISK_COLORS } from '../constants/columns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, Activity, CheckCircle2, Calendar, Gauge, MapPin, Brain, MessageSquare, Shield,
} from 'lucide-react'
import { formatDate } from '@/features/backup-recovery/shared/utils/format'
import ReactECharts from 'echarts-for-react'

const LS_COLS = 'e-insight-case-columns'

export function CaseManagementPage() {
  const { filters } = useApp()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showColumns, setShowColumns] = useState(false)
  const [advanced, setAdvanced] = useState<Record<string, string>>({})
  const [filterName, setFilterName] = useState('')
  const [visibleCols, setVisibleCols] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(LS_COLS)
      return s ? JSON.parse(s) : DEFAULT_COLUMNS.filter((c) => c.default).map((c) => c.key)
    } catch { return DEFAULT_COLUMNS.filter((c) => c.default).map((c) => c.key) }
  })

  const extra = { search, page: String(page), pageSize: '25', ...advanced }
  const { data: kpis, isLoading: kpiLoading, refetch, isFetching, dataUpdatedAt } = useCaseKpis(filters, extra)
  const { data: listData, isLoading: listLoading } = useCaseList(filters, extra)
  const { data: quality } = useCaseQuality(filters, extra)
  const { data: analytics } = useCaseAnalytics(filters, extra)
  const { data: savedFilters = [] } = useSavedFilters()
  const saveFilter = useSaveFilter()
  const exportCases = useExportCases()
  const bulk = useBulkCaseAction()

  const rows = listData?.data ?? []
  const total = listData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 25))

  const columns = useMemo(() => {
    const defs = DEFAULT_COLUMNS.filter((c) => visibleCols.includes(c.key))
    return defs.map((col) => ({
      key: col.key,
      label: col.label,
      sortable: true,
      render: col.key === 'status' ? (r: Record<string, unknown>) => <StatusBadge status={String(r.status)} />
        : col.key === 'riskScore' ? (r: Record<string, unknown>) => (
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', RISK_COLORS[String(r.riskScore)] ?? '')}>{String(r.riskScore)}</span>
        ) : col.key === 'lastUpdate' ? (r: Record<string, unknown>) => formatDate(String(r.lastUpdate))
        : col.key === 'korban' ? (r: Record<string, unknown>) => String(r.korban)
        : undefined,
    }))
  }, [visibleCols])

  const toggleCol = (key: string) => {
    setVisibleCols((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      localStorage.setItem(LS_COLS, JSON.stringify(next))
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExport = async (scope: string) => {
    const params = { ...extra }
    const body = { scope, format: 'csv', ids: scope === 'selected' ? [...selectedIds] : undefined }
    const res = await exportCases.mutateAsync({ query: params as Record<string, string>, body })
    if (res.content) {
      const blob = new Blob([res.content], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cases-export.csv'
      a.click()
    }
  }

  if (kpiLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-4">
      <PageHeader title="Case Management Center" subtitle="Enterprise eksplorasi data logbook kasus" />

      <PageToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Cari register, nama, alamat, psikolog..."
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        lastUpdated={new Date(dataUpdatedAt).toISOString()}
        onExport={() => handleExport('filtered')}
        extra={
          <>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowAdvanced(!showAdvanced)}>Advanced Filter</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowColumns(!showColumns)}>Column Manager</Button>
          </>
        }
      />

      {showAdvanced && (
        <div className="glass-panel grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: 'status', label: 'Status', opts: ['Aktif', 'Selesai'] },
            { key: 'riskScore', label: 'Risk Score', opts: ['Low', 'Medium', 'High', 'Critical'] },
            { key: 'jenisKekerasan', label: 'Jenis Kekerasan' },
            { key: 'kabupaten', label: 'Kabupaten' },
            { key: 'usiaMin', label: 'Usia Min', type: 'number' },
            { key: 'usiaMax', label: 'Usia Max', type: 'number' },
            { key: 'psikolog', label: 'Psikolog' },
          ].map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-[10px] text-muted-foreground">{f.label}</label>
              {f.opts ? (
                <select className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs" value={advanced[f.key] ?? ''} onChange={(e) => setAdvanced({ ...advanced, [f.key]: e.target.value })}>
                  <option value="">Semua</option>
                  {f.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input className="h-8 text-xs" type={f.type ?? 'text'} value={advanced[f.key] ?? ''} onChange={(e) => setAdvanced({ ...advanced, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
          <div className="flex items-end gap-2 sm:col-span-2">
            <Input className="h-8 text-xs" placeholder="Nama saved filter" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
            <Button size="sm" className="h-8 text-xs" onClick={() => saveFilter.mutate({ name: filterName, filters: { ...advanced, search } })} disabled={!filterName}>Simpan Filter</Button>
          </div>
          {savedFilters.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-1">
              {(savedFilters as { id: string; name: string; filters: Record<string, string> }[]).map((sf) => (
                <button key={sf.id} type="button" className="rounded-full bg-secondary px-2 py-0.5 text-[10px] hover:bg-primary/10" onClick={() => { setAdvanced(sf.filters); setSearch(sf.filters.search ?? '') }}>
                  {sf.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showColumns && (
        <div className="glass-panel flex flex-wrap gap-3 rounded-lg border border-border p-3">
          {DEFAULT_COLUMNS.map((c) => (
            <label key={c.key} className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={visibleCols.includes(c.key)} onChange={() => toggleCol(c.key)} />
              {c.label}
            </label>
          ))}
        </div>
      )}

      <KpiGrid items={[
        { label: 'Total Kasus', value: kpis?.totalKasus ?? 0, icon: Users, sparkline: kpis?.trend },
        { label: 'Kasus Aktif', value: kpis?.kasusAktif ?? 0, icon: Activity, tone: 'warning' },
        { label: 'Kasus Selesai', value: kpis?.kasusSelesai ?? 0, icon: CheckCircle2, tone: 'success' },
        { label: 'Baru Bulan Ini', value: kpis?.kasusBaruBulanIni ?? 0, icon: Calendar },
        { label: 'Rata-rata Usia', value: kpis?.rataRataUsia ?? '-', icon: Gauge },
        { label: 'Kabupaten', value: kpis?.jumlahKabupaten ?? 0, icon: MapPin },
        { label: 'Psikolog Aktif', value: kpis?.psikologAktif ?? 0, icon: Brain },
        { label: 'Konseling', value: kpis?.jumlahKonseling ?? 0, icon: MessageSquare },
        { label: 'Data Quality', value: `${kpis?.dataQualityScore ?? 0}%`, icon: Shield, progress: kpis?.dataQualityScore, tone: (kpis?.dataQualityScore ?? 100) >= 80 ? 'success' : 'warning' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
              <span>{selectedIds.size} dipilih</span>
              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleExport('selected')}>Export</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => bulk.mutate({ action: 'tag', ids: [...selectedIds] })}>Tag</Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </div>
          )}

          {listLoading ? <TableSkeleton /> : (
            <EnterpriseTable
              rows={rows}
              columns={[
                {
                  key: '_select',
                  label: '',
                  render: (r) => (
                    <input type="checkbox" checked={selectedIds.has(String(r.id))} onChange={(e) => { e.stopPropagation(); toggleSelect(String(r.id)) }} onClick={(e) => e.stopPropagation()} />
                  ),
                },
                ...columns,
                {
                  key: 'dup',
                  label: '',
                  render: (r) => r.possibleDuplicate ? <StatusBadge status="Possible Duplicate" /> : null,
                },
              ]}
              onRowClick={(r) => setSelectedId(String(r.id))}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              emptyTitle="Tidak ada kasus"
              emptyDescription="Sesuaikan filter global atau pencarian."
            />
          )}
          <p className="text-[10px] text-muted-foreground">{total} kasus total · halaman {page}/{totalPages}</p>
        </div>

        <aside className="space-y-3">
          {quality && (
            <div className="glass-panel rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-semibold">Data Quality</p>
              <div className="space-y-1 text-[10px]">
                <p>GPS kosong: {quality.gpsEmpty}</p>
                <p>Alamat kosong: {quality.alamatEmpty}</p>
                <p>Psikolog kosong: {quality.psikologEmpty}</p>
                <p>Usia kosong: {quality.usiaEmpty}</p>
                <p>Duplikasi: {quality.duplicates}</p>
              </div>
            </div>
          )}
          {analytics && (
            <div className="glass-panel rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-semibold">Quick Analytics</p>
              <ReactECharts style={{ height: 160 }} option={{
                tooltip: { trigger: 'item' },
                series: [{ type: 'pie', radius: ['30%', '55%'], data: analytics.jenisKekerasan?.slice(0, 6).map((x: { name: string; count: number }) => ({ name: x.name, value: x.count })) }],
              }} />
              <ReactECharts style={{ height: 120 }} option={{
                xAxis: { type: 'category', data: analytics.status?.map((x: { name: string }) => x.name) },
                yAxis: { type: 'value' },
                series: [{ type: 'bar', data: analytics.status?.map((x: { count: number }) => x.count), itemStyle: { color: '#0078d4' } }],
              }} />
            </div>
          )}
        </aside>
      </div>

      <CaseDetailDrawer caseId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
