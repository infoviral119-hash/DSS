import { PageHeader } from '@/features/admin-security/components/PageHeader'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { PageToolbar } from '../shared/components/PageToolbar'
import { StatusBadge } from '../shared/components/StatusBadge'
import { EmptyState } from '../shared/components/EmptyState'
import { useTableState } from '../shared/hooks/useTableState'
import { useRestoreHistory } from '../hooks/useBackup'
import { formatDate, exportCsv } from '../shared/utils/format'
import { Archive } from 'lucide-react'
import { TableSkeleton } from '../shared/components/SkeletonBlock'

export function RestoreHistoryPage() {
  const { data: history = [], isLoading, refetch, isFetching, dataUpdatedAt } = useRestoreHistory()
  const table = useTableState(history as Record<string, unknown>[], ['restoreBy', 'restorePoint', 'reason'], 10)

  const handleExport = () => {
    exportCsv(
      'restore-history.csv',
      ['Date', 'User', 'Restore Point', 'Type', 'Duration', 'Records', 'Status', 'Reason', 'Approval'],
      table.filtered.map((r) => [
        String(r.createdAt), String(r.restoreBy), String(r.restorePoint), String(r.restoreType),
        String(r.duration), String(r.affectedRecords), String(r.status), String(r.reason ?? ''), String(r.approval),
      ]),
    )
  }

  if (isLoading) return <TableSkeleton />

  return (
    <div className="space-y-4">
      <PageHeader title="Restore History" subtitle="Audit trail pemulihan data" />

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
        <EmptyState icon={Archive} title="No Restore History" description="Riwayat restore akan tercatat otomatis saat pemulihan dijalankan." />
      ) : (
        <EnterpriseTable
          rows={table.paginated}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          onSort={table.toggleSort}
          columns={[
            { key: 'createdAt', label: 'Date', render: (r) => formatDate(String(r.createdAt)) },
            { key: 'restoreBy', label: 'Restore By', sortable: true },
            { key: 'restorePoint', label: 'Restore Point' },
            { key: 'restoreType', label: 'Restore Type' },
            { key: 'duration', label: 'Duration' },
            { key: 'affectedRecords', label: 'Affected Records' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
            { key: 'reason', label: 'Reason' },
            { key: 'approval', label: 'Approval', render: (r) => <StatusBadge status={String(r.approval)} /> },
          ]}
        />
      )}
    </div>
  )
}
