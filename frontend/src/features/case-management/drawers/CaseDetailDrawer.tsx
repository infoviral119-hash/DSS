import { DetailDrawer, DetailRow } from '@/features/backup-recovery/shared/components/DetailDrawer'
import { StatusBadge } from '@/features/backup-recovery/shared/components/StatusBadge'
import { ActivityTimeline } from '@/features/backup-recovery/shared/components/ActivityTimeline'
import { useCaseDetail } from '../hooks/useCaseManagement'
import { RISK_COLORS } from '../constants/columns'
import { cn } from '@/lib/utils'
import { SkeletonBlock } from '@/features/backup-recovery/shared/components/SkeletonBlock'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function CaseDetailDrawer({ caseId, onClose }: { caseId: string | null; onClose: () => void }) {
  const { data, isLoading } = useCaseDetail(caseId)
  const navigate = useNavigate()

  if (!caseId) return null

  const riskClass = RISK_COLORS[String(data?.overview?.riskScore ?? 'Low')] ?? ''

  const overview = isLoading ? <SkeletonBlock className="h-40" /> : (
    <div>
      <DetailRow label="Nomor Register" value={data?.overview?.register} />
      <DetailRow label="Tanggal" value={data?.overview?.tanggal} />
      <DetailRow label="Status" value={<StatusBadge status={String(data?.overview?.status)} />} />
      <DetailRow label="Risk Score" value={<span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', riskClass)}>{data?.overview?.riskScore}</span>} />
      <DetailRow label="Wilayah" value={data?.overview?.wilayah} />
      <DetailRow label="Petugas" value={data?.overview?.petugas} />
      <DetailRow label="Ringkasan" value={data?.overview?.ringkasan} />
      {data?.raw?.latitude && data?.raw?.longitude && (
        <Button size="sm" variant="outline" className="mt-2 gap-1 text-xs" onClick={() => { onClose(); navigate(`/gis?case=${caseId}`) }}>
          <MapPin className="h-3 w-3" /> Buka di GIS
        </Button>
      )}
    </div>
  )

  const section = (obj: Record<string, unknown> | undefined) => (
    <div>{obj && Object.entries(obj).map(([k, v]) => <DetailRow key={k} label={k.replace(/([A-Z])/g, ' $1')} value={String(v ?? '-')} />)}</div>
  )

  return (
    <DetailDrawer
      open={Boolean(caseId)}
      onClose={onClose}
      title={String(data?.overview?.register ?? 'Detail Kasus')}
      subtitle={String(data?.korban?.nama ?? '')}
      tabs={[
        { id: 'overview', label: 'Overview', content: overview },
        { id: 'korban', label: 'Korban', content: section(data?.korban) },
        { id: 'pelaku', label: 'Pelaku', content: section(data?.pelaku) },
        { id: 'kejadian', label: 'Kejadian', content: section(data?.kejadian) },
        { id: 'pendampingan', label: 'Pendampingan', content: section(data?.pendampingan) },
        { id: 'konseling', label: 'Konseling', content: section(data?.konseling) },
        { id: 'rujukan', label: 'Rujukan', content: section(data?.rujukan) },
        {
          id: 'lampiran',
          label: 'Lampiran',
          content: (data?.attachments?.length ?? 0) > 0 ? (
            <ul className="space-y-2">{data.attachments.map((a: { id: string; file_name: string; mime_type: string }) => (
              <li key={a.id} className="rounded border border-border p-2 text-[10px]">{a.file_name} · {a.mime_type ?? 'file'}</li>
            ))}</ul>
          ) : <p className="text-xs text-muted-foreground">Belum ada lampiran.</p>,
        },
        {
          id: 'timeline',
          label: 'Timeline',
          content: <ActivityTimeline items={(data?.timeline ?? []).map((t: { title: string; description: string; date: string; eventType: string }) => ({
            stage: t.eventType, message: `${t.title} — ${t.description}`, createdAt: t.date,
          }))} />,
        },
        {
          id: 'audit',
          label: 'Audit Trail',
          content: (
            <div className="space-y-2">{(data?.auditTrail ?? []).map((a: { user: string; date: string; column: string; oldValue: string; newValue: string }, i: number) => (
              <div key={i} className="rounded border border-border/50 p-2 text-[10px]">
                <p className="font-medium">{a.column} · {a.user}</p>
                <p className="text-muted-foreground">{new Date(a.date).toLocaleString('id-ID')}</p>
                <p>{a.oldValue} → {a.newValue}</p>
              </div>
            ))}</div>
          ),
        },
        {
          id: 'ai',
          label: 'AI Insight',
          content: data?.aiInsight ? (
            <div className="space-y-2 text-xs">
              <p>Kemiripan dengan <strong>{data.aiInsight.similarCases}</strong> kasus sebelumnya.</p>
              <p>Probabilitas selesai: <strong>{data.aiInsight.completionProbability}%</strong></p>
              <p>Estimasi penyelesaian: <strong>{data.aiInsight.estimatedDays} hari</strong></p>
              <p className="rounded bg-primary/5 p-2 text-[10px]">Rekomendasi: {data.aiInsight.recommendation}</p>
            </div>
          ) : <SkeletonBlock className="h-20" />,
        },
      ]}
    />
  )
}
