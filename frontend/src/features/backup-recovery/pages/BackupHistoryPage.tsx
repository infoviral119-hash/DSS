import { PageHeader } from '@/features/admin-security/components/PageHeader'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { PageToolbar } from '../shared/components/PageToolbar'
import { StatusBadge } from '../shared/components/StatusBadge'
import { EmptyState } from '../shared/components/EmptyState'
import { useTableState } from '../shared/hooks/useTableState'
import { useBackupHistory } from '../hooks/useBackup'
import { formatBytes, formatDate, exportCsv } from '../shared/utils/format'
import { History } from 'lucide-react'
import { TableSkeleton } from '../shared/components/SkeletonBlock'

export function BackupHistoryPage() {
  const { data: history = [], isLoading, refetch, isFetching, dataUpdatedAt } = useBackupHistory()
  const table = useTableState(history as Record<string, unknown>[], ['backupName', 'job', 'repository', 'createdBy'], 10)

  const handleExport = () => {
    exportCsv(
      'backup-history.csv',
      ['Date', 'Backup Name', 'Job', 'Repository', 'Type', 'Duration', 'Size', 'Status', 'User'],
      table.filtered.map((h) => [
        String(h.date), String(h.backupName), String(h.job), String(h.repository),
        String(h.backupType), String(h.duration), String(h.backupSize), String(h.status), String(h.createdBy),
      ]),
    )
  }

  if (isLoading) return <TableSkeleton />

  return (
    <div className="space-y-4">
      <PageHeader title="Backup History" subtitle="Enterprise backup audit log" />

      <PageToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        statusFilter={table.statusFilter}
        onStatusFilterChange={table.setStatusFilter}
        statusOptions={[
          { value: 'all', label: 'Semua' },
          { value: 'completed', label: 'Success' },
          { value: 'failed', label: 'Failed' },
        ]}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        lastUpdated={new Date(dataUpdatedAt).toISOString()}
        onExport={handleExport}
      />

      {!history.length ? (
        <EmptyState icon={History} title="No Backup History" description="Riwayat backup akan muncul setelah job pertama dijalankan." />
      ) : (
        <EnterpriseTable
          rows={table.paginated}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          onSort={table.toggleSort}
          columns={[
            { key: 'date', label: 'Date', sortable: true, render: (r) => formatDate(String(r.date)) },
            { key: 'backupName', label: 'Backup Name' },
            { key: 'job', label: 'Job' },
            { key: 'repository', label: 'Repository' },
            { key: 'backupType', label: 'Backup Type' },
            { key: 'duration', label: 'Duration' },
            { key: 'backupSize', label: 'Size', render: (r) => formatBytes(Number(r.backupSize)) },
            { key: 'compression', label: 'Compression', render: (r) => `${r.compression}x` },
            { key: 'encryption', label: 'Encryption' },
            { key: 'createdBy', label: 'Created By' },
            { key: 'verification', label: 'Verification', render: (r) => <StatusBadge status={String(r.verification)} /> },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
          ]}
        />
      )}
    </div>
  )
}
