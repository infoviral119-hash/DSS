import { useState } from 'react'
import { PageHeader } from '@/features/admin-security/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { PageToolbar } from '../shared/components/PageToolbar'
import { StatusBadge } from '../shared/components/StatusBadge'
import { useTableState } from '../shared/hooks/useTableState'
import { JobDetailDrawer } from '../jobs/JobDetailDrawer'
import {
  useBackupJobs, useCreateBackupJob, useRunBackup, useUpdateBackupJob,
  useDeleteBackupJob, useCloneBackupJob,
} from '../hooks/useBackup'
import { Briefcase } from 'lucide-react'
import { EmptyState } from '../shared/components/EmptyState'
import { TableSkeleton } from '../shared/components/SkeletonBlock'

export function BackupJobsPage() {
  const { data: jobs = [], isLoading, refetch, isFetching, dataUpdatedAt } = useBackupJobs()
  const createJob = useCreateBackupJob()
  const runBackup = useRunBackup()
  const updateJob = useUpdateBackupJob()
  const deleteJob = useDeleteBackupJob()
  const cloneJob = useCloneBackupJob()
  const [name, setName] = useState('Daily Full Backup')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const table = useTableState(jobs as Record<string, unknown>[], ['name', 'backupType', 'repositoryName', 'createdBy'], 8)

  if (isLoading) return <TableSkeleton />

  return (
    <div className="space-y-4">
      <PageHeader title="Backup Jobs" subtitle="Enterprise Job Manager" />

      <div className="glass-panel flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-[10px] text-muted-foreground">Job Name</label>
          <Input className="h-8 text-xs" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => createJob.mutateAsync({ name, backupType: 'full', targets: ['entire_database'] })} disabled={createJob.isPending}>Buat Job</Button>
        <Button size="sm" variant="outline" onClick={() => runBackup.mutate({ name: 'Quick Manual Backup', targets: ['entire_database'] })} disabled={runBackup.isPending}>Run Now</Button>
      </div>

      <PageToolbar
        search={table.search}
        onSearchChange={(v) => { table.setSearch(v); table.setPage(1) }}
        searchPlaceholder="Cari job..."
        statusFilter={table.statusFilter}
        onStatusFilterChange={table.setStatusFilter}
        statusOptions={[
          { value: 'all', label: 'Semua Status' },
          { value: 'completed', label: 'Success' },
          { value: 'running', label: 'Running' },
          { value: 'failed', label: 'Failed' },
          { value: 'idle', label: 'Idle' },
        ]}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        lastUpdated={new Date(dataUpdatedAt).toISOString()}
      />

      {!jobs.length ? (
        <EmptyState icon={Briefcase} title="No Backup Jobs" description="Buat job backup pertama untuk memulai proteksi data." actionLabel="Buat Job" onAction={() => createJob.mutate({ name, backupType: 'full', targets: ['entire_database'] })} />
      ) : (
        <EnterpriseTable
          rows={table.paginated}
          onRowClick={(r) => setSelectedId(String(r.id))}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.toggleSort}
          emptyTitle="No Backup Jobs"
          emptyDescription="Tidak ada job yang cocok dengan filter."
          columns={[
            { key: 'name', label: 'Job Name', sortable: true },
            { key: 'jobType', label: 'Job Type' },
            { key: 'progress', label: 'Progress', render: (r) => (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${Number(r.progress ?? 0)}%` }} /></div>
                <span>{Number(r.progress ?? 0)}%</span>
              </div>
            ) },
            { key: 'runningTime', label: 'Running Time' },
            { key: 'averageTime', label: 'Avg Time' },
            { key: 'repositoryName', label: 'Repository' },
            { key: 'compression', label: 'Compression' },
            { key: 'encryption', label: 'Encryption' },
            { key: 'verification', label: 'Verification' },
            { key: 'createdBy', label: 'Created By' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" className="h-6 px-1.5 text-[9px]" onClick={() => runBackup.mutate({ jobId: String(r.id) })}>Run</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[9px]" onClick={() => updateJob.mutate({ id: String(r.id), enabled: false, lastStatus: 'paused' })}>Pause</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[9px]" onClick={() => updateJob.mutate({ id: String(r.id), enabled: true, lastStatus: 'idle' })}>Resume</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[9px]" onClick={() => cloneJob.mutate(String(r.id))}>Clone</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[9px] text-red-500" onClick={() => deleteJob.mutate(String(r.id))}>Delete</Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <JobDetailDrawer jobId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
