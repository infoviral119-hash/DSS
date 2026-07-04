import { DetailDrawer, DetailRow } from '../shared/components/DetailDrawer'
import { StatusBadge } from '../shared/components/StatusBadge'
import { ActivityTimeline } from '../shared/components/ActivityTimeline'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { useJobDetail } from '../hooks/useBackup'
import { formatDate, formatBytes } from '../shared/utils/format'
import { SkeletonBlock } from '../shared/components/SkeletonBlock'

export function JobDetailDrawer({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  const { data, isLoading } = useJobDetail(jobId)

  if (!jobId) return null

  const overview = isLoading ? <SkeletonBlock className="h-40 w-full" /> : (
    <div>
      <DetailRow label="Job Type" value={String(data?.jobType ?? '-')} />
      <DetailRow label="Status" value={<StatusBadge status={String(data?.status ?? 'idle')} />} />
      <DetailRow label="Repository" value={String(data?.repositoryName ?? '-')} />
      <DetailRow label="Compression" value={String(data?.compression ?? '-')} />
      <DetailRow label="Encryption" value={String(data?.encryption ?? '-')} />
      <DetailRow label="Progress" value={`${data?.progress ?? 0}%`} />
      <DetailRow label="Average Time" value={String(data?.averageTime ?? '-')} />
      <DetailRow label="Verification" value={String(data?.verification ?? '-')} />
      <DetailRow label="Created By" value={String(data?.createdBy ?? '-')} />
    </div>
  )

  return (
    <DetailDrawer
      open={Boolean(jobId)}
      onClose={onClose}
      title={String(data?.name ?? 'Backup Job')}
      subtitle={jobId ?? undefined}
      tabs={[
        { id: 'overview', label: 'Overview', content: overview },
        {
          id: 'history',
          label: 'Execution History',
          content: (
            <EnterpriseTable
              rows={(data?.executionHistory ?? []) as Record<string, unknown>[]}
              emptyTitle="No Execution History"
              emptyDescription="Job belum pernah dijalankan."
              columns={[
                { key: 'date', label: 'Date', render: (r) => formatDate(String(r.date)) },
                { key: 'duration', label: 'Duration (ms)' },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
                { key: 'size', label: 'Size', render: (r) => formatBytes(Number(r.size)) },
              ]}
            />
          ),
        },
        { id: 'logs', label: 'Logs', content: <ActivityTimeline items={data?.logs ?? []} /> },
        {
          id: 'config',
          label: 'Configuration',
          content: (
            <pre className="overflow-auto rounded bg-secondary/40 p-2 text-[10px]">{JSON.stringify({ targets: data?.targets, compression: data?.compression, encryption: data?.encryptionEnabled }, null, 2)}</pre>
          ),
        },
        {
          id: 'performance',
          label: 'Performance',
          content: (
            <div>
              <DetailRow label="Running Time" value={String(data?.runningTime ?? '-')} />
              <DetailRow label="Average Time" value={String(data?.averageTime ?? '-')} />
              <DetailRow label="Retry Count" value={String(data?.retryCount ?? 3)} />
            </div>
          ),
        },
        { id: 'verification', label: 'Verification', content: <DetailRow label="Last Result" value={String(data?.verification ?? 'Pending')} /> },
      ]}
    />
  )
}
