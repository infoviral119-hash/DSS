import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { PageHeader } from '@/features/admin-security/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { PageToolbar } from '../shared/components/PageToolbar'
import { StatusBadge } from '../shared/components/StatusBadge'
import { EmptyState } from '../shared/components/EmptyState'
import { useTableState } from '../shared/hooks/useTableState'
import { RepositoryDetailDrawer } from '../repository/RepositoryDetailDrawer'
import { useBackupRepositories, useBackupStorage, useCreateRepository } from '../hooks/useBackup'
import { formatBytes, formatDate } from '../shared/utils/format'
import { HardDrive } from 'lucide-react'
import { TableSkeleton } from '../shared/components/SkeletonBlock'

export function BackupRepositoryPage() {
  const { data: repos = [], isLoading, refetch, isFetching, dataUpdatedAt } = useBackupRepositories()
  const { data: storage } = useBackupStorage()
  const createRepo = useCreateRepository()
  const [name, setName] = useState('Supabase Storage')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const table = useTableState(repos as Record<string, unknown>[], ['name', 'provider', 'region'], 8)

  if (isLoading) return <TableSkeleton />

  return (
    <div className="space-y-4">
      <PageHeader title="Backup Repository" subtitle="Repository Management & Storage Monitoring" />

      {storage && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-panel rounded-lg border border-border p-4 md:col-span-1">
            <p className="mb-2 text-xs font-medium">Storage Gauge</p>
            <ReactECharts style={{ height: 160 }} option={{ series: [{ type: 'gauge', min: 0, max: 100, progress: { show: true }, detail: { formatter: '{value}%' }, data: [{ value: storage.usagePercent ?? 0 }] }] }} />
          </div>
          <div className="glass-panel rounded-lg border border-border p-4 md:col-span-2 grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-muted-foreground">Capacity</p><p className="text-lg font-semibold">{storage.totalGb} GB</p></div>
            <div><p className="text-muted-foreground">Used</p><p className="text-lg font-semibold">{storage.usedGb} GB</p></div>
            <div><p className="text-muted-foreground">Available</p><p className="text-lg font-semibold">{storage.availableGb} GB</p></div>
            <div><p className="text-muted-foreground">Compression</p><p className="text-lg font-semibold">{storage.compressionRatio}x</p></div>
            <div><p className="text-muted-foreground">Growth</p><p className="text-lg font-semibold">{storage.growthPercent}%</p></div>
            <div><p className="text-muted-foreground">Remaining Days</p><p className="text-lg font-semibold">{storage.remainingDays}</p></div>
          </div>
        </div>
      )}

      <PageToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        lastUpdated={new Date(dataUpdatedAt).toISOString()}
      />

      {!repos.length ? (
        <EmptyState icon={HardDrive} title="No Backup Repository" description="Tambahkan repository untuk menyimpan backup." actionLabel="Tambah Repository" onAction={() => createRepo.mutate({ name, repoType: 'supabase_storage', capacityGb: 50 })} />
      ) : (
        <EnterpriseTable
          rows={table.paginated}
          onRowClick={(r) => setSelectedId(String(r.id))}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          onSort={table.toggleSort}
          columns={[
            { key: 'name', label: 'Repository Name', sortable: true },
            { key: 'type', label: 'Type' },
            { key: 'provider', label: 'Provider' },
            { key: 'region', label: 'Region' },
            { key: 'capacityGb', label: 'Capacity (GB)' },
            { key: 'usedBytes', label: 'Used', render: (r) => formatBytes(Number(r.usedBytes)) },
            { key: 'availableBytes', label: 'Available', render: (r) => formatBytes(Number(r.availableBytes)) },
            { key: 'usagePercent', label: 'Usage %', render: (r) => `${r.usagePercent}%` },
            { key: 'encryption', label: 'Encryption' },
            { key: 'compression', label: 'Compression' },
            { key: 'latencyMs', label: 'Latency (ms)' },
            { key: 'health', label: 'Health', render: (r) => <StatusBadge status={String(r.health)} /> },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
            { key: 'lastSync', label: 'Last Sync', render: (r) => formatDate(String(r.lastSync)) },
            { key: 'createdAt', label: 'Created', render: (r) => formatDate(String(r.createdAt)) },
            { key: 'updatedAt', label: 'Updated', render: (r) => formatDate(String(r.updatedAt)) },
          ]}
        />
      )}

      <div className="glass-panel flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <Input className="h-8 max-w-xs text-xs" value={name} onChange={(e) => setName(e.target.value)} placeholder="Repository name" />
        <Button size="sm" onClick={() => createRepo.mutate({ name, repoType: 'supabase_storage', capacityGb: 50 })} disabled={createRepo.isPending}>Tambah Repository</Button>
      </div>

      <RepositoryDetailDrawer repoId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
