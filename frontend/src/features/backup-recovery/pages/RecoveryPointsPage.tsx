import { useState } from 'react'
import { PageHeader } from '@/features/admin-security/components/PageHeader'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { PageToolbar } from '../shared/components/PageToolbar'
import { StatusBadge } from '../shared/components/StatusBadge'
import { RecoveryTimeline } from '../shared/components/ActivityTimeline'
import { EmptyState } from '../shared/components/EmptyState'
import { useTableState } from '../shared/hooks/useTableState'
import { RecoveryPointDrawer } from '../recovery/RecoveryPointDrawer'
import { useRecoveryPoints } from '../hooks/useBackup'
import { formatBytes, formatDate } from '../shared/utils/format'
import { Clock } from 'lucide-react'
import { TableSkeleton } from '../shared/components/SkeletonBlock'

export function RecoveryPointsPage() {
  const { data: points = [], isLoading, refetch, isFetching, dataUpdatedAt } = useRecoveryPoints()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const table = useTableState(points as Record<string, unknown>[], ['backupName', 'repository', 'jobName'], 10)

  if (isLoading) return <TableSkeleton />

  return (
    <div className="space-y-4">
      <PageHeader title="Recovery Points" subtitle="Timeline & detail recovery point" />

      <PageToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        lastUpdated={new Date(dataUpdatedAt).toISOString()}
      />

      {!points.length ? (
        <EmptyState icon={Clock} title="No Recovery Point" description="Recovery point dibuat otomatis setelah backup berhasil." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="glass-panel rounded-lg border border-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Timeline</p>
            <RecoveryTimeline points={points} onSelect={setSelectedId} />
          </div>
          <EnterpriseTable
            rows={table.paginated}
            onRowClick={(r) => setSelectedId(String(r.id))}
            page={table.page}
            totalPages={table.totalPages}
            onPageChange={table.setPage}
            onSort={table.toggleSort}
            columns={[
              { key: 'backupName', label: 'Backup Name', sortable: true },
              { key: 'backupTime', label: 'Time', render: (r) => formatDate(String(r.backupTime)) },
              { key: 'backupType', label: 'Type' },
              { key: 'repository', label: 'Repository' },
              { key: 'checksum', label: 'Checksum', render: (r) => `${String(r.checksum).slice(0, 10)}...` },
              { key: 'encryption', label: 'Encryption' },
              { key: 'backupSize', label: 'Size', render: (r) => formatBytes(Number(r.backupSize)) },
              { key: 'dbVersion', label: 'DB Version' },
              { key: 'appVersion', label: 'App Version' },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
            ]}
          />
        </div>
      )}

      <RecoveryPointDrawer pointId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
