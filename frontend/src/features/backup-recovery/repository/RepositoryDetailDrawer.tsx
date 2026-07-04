import ReactECharts from 'echarts-for-react'
import { DetailDrawer, DetailRow } from '../shared/components/DetailDrawer'
import { StatusBadge } from '../shared/components/StatusBadge'
import { ActivityTimeline } from '../shared/components/ActivityTimeline'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { useRepositoryDetail } from '../hooks/useBackup'
import { formatBytes, formatDate } from '../shared/utils/format'
import { SkeletonBlock } from '../shared/components/SkeletonBlock'

export function RepositoryDetailDrawer({ repoId, onClose }: { repoId: string | null; onClose: () => void }) {
  const { data, isLoading } = useRepositoryDetail(repoId)

  if (!repoId) return null

  const storageGauge = (
    <ReactECharts
      style={{ height: 180 }}
      option={{
        series: [{
          type: 'gauge',
          min: 0,
          max: 100,
          progress: { show: true },
          detail: { formatter: '{value}%', fontSize: 16 },
          data: [{ value: data?.usagePercent ?? 0 }],
        }],
      }}
    />
  )

  return (
    <DetailDrawer
      open={Boolean(repoId)}
      onClose={onClose}
      title={String(data?.name ?? 'Repository')}
      subtitle={`${data?.provider ?? '-'} · ${data?.region ?? '-'}`}
      tabs={[
        {
          id: 'overview',
          label: 'Overview',
          content: isLoading ? <SkeletonBlock className="h-40" /> : (
            <div>
              <DetailRow label="Type" value={String(data?.type ?? '-')} />
              <DetailRow label="Health" value={<StatusBadge status={String(data?.health ?? '-')} />} />
              <DetailRow label="Status" value={<StatusBadge status={String(data?.status ?? '-')} />} />
              <DetailRow label="Capacity" value={`${data?.capacityGb ?? 0} GB`} />
              <DetailRow label="Used" value={formatBytes(Number(data?.usedBytes ?? 0))} />
              <DetailRow label="Available" value={formatBytes(Number(data?.availableBytes ?? 0))} />
              <DetailRow label="Last Sync" value={formatDate(String(data?.lastSync))} />
            </div>
          ),
        },
        { id: 'config', label: 'Configuration', content: <pre className="text-[10px]">{JSON.stringify({ provider: data?.provider, region: data?.region }, null, 2)}</pre> },
        {
          id: 'storage',
          label: 'Storage',
          content: (
            <div className="space-y-3">
              {storageGauge}
              <DetailRow label="Compression Ratio" value={`${data?.storage?.compressionRatio ?? 2.5}x`} />
              <DetailRow label="Growth" value={`${data?.storage?.growthPercent ?? 0}%`} />
              <DetailRow label="Remaining Days" value={`${data?.storage?.remainingDays ?? '-'} hari`} />
            </div>
          ),
        },
        { id: 'encryption', label: 'Encryption', content: <DetailRow label="Algorithm" value={String(data?.encryption ?? 'AES-256')} /> },
        { id: 'health', label: 'Health', content: <DetailRow label="Score" value={<StatusBadge status={String(data?.health ?? 'Healthy')} />} /> },
        { id: 'logs', label: 'Logs', content: <ActivityTimeline items={data?.logs ?? []} /> },
        {
          id: 'history',
          label: 'Backup History',
          content: (
            <EnterpriseTable
              rows={(data?.backupHistory ?? []) as Record<string, unknown>[]}
              emptyTitle="No Backup History"
              emptyDescription="Belum ada backup di repository ini."
              columns={[
                { key: 'date', label: 'Date', render: (r) => formatDate(String(r.date)) },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
                { key: 'size', label: 'Size', render: (r) => formatBytes(Number(r.size)) },
              ]}
            />
          ),
        },
        { id: 'settings', label: 'Settings', content: <DetailRow label="Default" value={data?.isDefault ? 'Yes' : 'No'} /> },
      ]}
    />
  )
}
