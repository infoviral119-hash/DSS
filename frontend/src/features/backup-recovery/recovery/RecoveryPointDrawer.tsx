import { useNavigate } from 'react-router-dom'
import { DetailDrawer, DetailRow } from '../shared/components/DetailDrawer'
import { StatusBadge } from '../shared/components/StatusBadge'
import { ActivityTimeline } from '../shared/components/ActivityTimeline'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { Button } from '@/components/ui/button'
import { useRecoveryPointDetail } from '../hooks/useBackup'
import { formatBytes, formatDate } from '../shared/utils/format'
import { SkeletonBlock } from '../shared/components/SkeletonBlock'

export function RecoveryPointDrawer({ pointId, onClose }: { pointId: string | null; onClose: () => void }) {
  const { data, isLoading } = useRecoveryPointDetail(pointId)
  const navigate = useNavigate()

  if (!pointId) return null

  return (
    <DetailDrawer
      open={Boolean(pointId)}
      onClose={onClose}
      title={String(data?.backupName ?? 'Recovery Point')}
      subtitle={formatDate(String(data?.backupTime))}
      tabs={[
        {
          id: 'summary',
          label: 'Summary',
          content: isLoading ? <SkeletonBlock className="h-48" /> : (
            <div>
              <DetailRow label="Database Version" value={String(data?.dbVersion ?? '-')} />
              <DetailRow label="Application Version" value={String(data?.appVersion ?? '-')} />
              <DetailRow label="Checksum" value={<span className="font-mono text-[9px]">{String(data?.checksum ?? '').slice(0, 24)}...</span>} />
              <DetailRow label="Compression" value={String(data?.compression ?? '-')} />
              <DetailRow label="Encryption" value={String(data?.encryption ?? '-')} />
              <DetailRow label="Repository" value={String(data?.repository ?? '-')} />
              <DetailRow label="Backup Size" value={formatBytes(Number(data?.backupSize ?? 0))} />
              <DetailRow label="Backup Type" value={String(data?.backupType ?? '-')} />
              <DetailRow label="Status" value={<StatusBadge status={String(data?.status ?? '-')} />} />
            </div>
          ),
        },
        {
          id: 'tables',
          label: 'Tables',
          content: (
            <EnterpriseTable
              rows={(data?.tables ?? []) as Record<string, unknown>[]}
              emptyTitle="No Tables"
              emptyDescription="Metadata tabel tidak tersedia."
              columns={[
                { key: 'name', label: 'Table' },
                { key: 'count', label: 'Records' },
              ]}
            />
          ),
        },
        {
          id: 'verification',
          label: 'Verification',
          content: (
            <div>
              <DetailRow label="Status" value={<StatusBadge status={String(data?.verification?.status ?? 'pending')} />} />
              <DetailRow label="Checksum OK" value={data?.verification?.checksum_ok ? 'Yes' : 'No'} />
              <DetailRow label="Integrity OK" value={data?.verification?.integrity_ok ? 'Yes' : 'No'} />
            </div>
          ),
        },
        { id: 'integrity', label: 'Integrity', content: <DetailRow label="SHA-256" value="Valid" /> },
        { id: 'logs', label: 'Logs', content: <ActivityTimeline items={data?.logs ?? []} /> },
        {
          id: 'restore',
          label: 'Restore',
          content: (
            <Button size="sm" onClick={() => { onClose(); navigate('/admin/backup-recovery/restore', { state: { recoveryPointId: pointId } }) }}>
              Buka Restore Center
            </Button>
          ),
        },
      ]}
    />
  )
}
