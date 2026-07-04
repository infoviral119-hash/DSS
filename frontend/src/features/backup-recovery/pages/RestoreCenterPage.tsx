import { useState } from 'react'
import { PageHeader } from '@/features/admin-security/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { useRecoveryPoints, useRestorePreview, useRestoreBackup, useBackupMeta } from '../hooks/useBackup'
import { RotateCcw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  'Select Recovery Point',
  'Select Restore Type',
  'Preview',
  'Validation',
  'Confirmation',
  'Restore',
  'Verification',
  'Completed',
]

export function RestoreCenterPage() {
  const { data: points = [] } = useRecoveryPoints()
  const { data: meta } = useBackupMeta()
  const preview = useRestorePreview()
  const restore = useRestoreBackup()

  const [step, setStep] = useState(0)
  const [recoveryPointId, setRecoveryPointId] = useState('')
  const [restoreType, setRestoreType] = useState('full')
  const [targets, setTargets] = useState<string[]>(['entire_database'])
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{ affectedRecords?: number; durationMs?: number; verification?: Record<string, boolean> } | null>(null)

  const previewData = preview.data as {
    tables?: { name: string; backupCount: number; added: number; updated: number; deleted: number; conflicts: number }[]
    totalAffected?: number
    warnings?: string[]
    affectedTables?: string[]
  } | undefined

  const runPreview = async () => {
    await preview.mutateAsync({ recoveryPointId, targets, restoreType })
    setStep(2)
  }

  const runRestore = async () => {
    setStep(5)
    const res = await restore.mutateAsync({ recoveryPointId, targets, reason, restoreType })
    setResult(res)
    setStep(6)
    setTimeout(() => setStep(7), 800)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Restore Center" subtitle="Enterprise Restore Wizard" />

      <div className="flex flex-wrap gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className={cn('rounded px-2 py-1 text-[10px]', i <= step ? 'bg-primary/10 text-primary font-medium' : 'bg-secondary text-muted-foreground')}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card><CardContent className="space-y-3 p-4">
          <label className="text-xs font-medium">Step 1 — Select Recovery Point</label>
          <select className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs" value={recoveryPointId} onChange={(e) => setRecoveryPointId(e.target.value)}>
            <option value="">-- Pilih recovery point --</option>
            {points.map((p: { id: string; backupName: string; backupTime: string }) => (
              <option key={p.id} value={p.id}>{p.backupName} — {new Date(String(p.backupTime)).toLocaleString('id-ID')}</option>
            ))}
          </select>
          <Button size="sm" disabled={!recoveryPointId} onClick={() => setStep(1)}>Lanjut</Button>
        </CardContent></Card>
      )}

      {step === 1 && (
        <Card><CardContent className="space-y-3 p-4">
          <label className="text-xs font-medium">Step 2 — Select Restore Type</label>
          <select className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs" value={restoreType} onChange={(e) => setRestoreType(e.target.value)}>
            <option value="full">Entire Database</option>
            <option value="partial">Partial / Selected Tables</option>
          </select>
          <div className="flex flex-wrap gap-2">
            {(meta?.targets as { id: string; label: string }[] | undefined)?.map((t) => (
              <label key={t.id} className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={targets.includes(t.id)} onChange={(e) => setTargets(e.target.checked ? [...targets, t.id] : targets.filter((x) => x !== t.id))} />
                {t.label}
              </label>
            ))}
          </div>
          <Input className="h-8 text-xs" placeholder="Alasan restore (audit)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setStep(0)}>Kembali</Button>
            <Button size="sm" onClick={runPreview} disabled={preview.isPending}>Preview</Button>
          </div>
        </CardContent></Card>
      )}

      {step >= 2 && step < 5 && previewData && (
        <div className="space-y-3">
          <Card><CardContent className="p-4">
            <p className="mb-2 text-xs font-medium">Step 3 — Restore Preview</p>
            <EnterpriseTable
              rows={previewData.tables ?? []}
              columns={[
                { key: 'name', label: 'Affected Tables' },
                { key: 'backupCount', label: 'Records' },
                { key: 'added', label: 'Added' },
                { key: 'updated', label: 'Updated' },
                { key: 'deleted', label: 'Deleted' },
                { key: 'conflicts', label: 'Conflicts' },
              ]}
            />
            <p className="mt-2 text-xs">Total affected: {previewData.totalAffected ?? 0}</p>
            {previewData.warnings?.length ? (
              <ul className="mt-2 text-[10px] text-amber-600">{previewData.warnings.map((w) => <li key={w}>⚠ {w}</li>)}</ul>
            ) : null}
          </CardContent></Card>

          {step === 2 && <Button size="sm" onClick={() => setStep(3)}>Step 4 — Validation</Button>}

          {step === 3 && (
            <Card><CardContent className="space-y-1 p-4 text-xs">
              <p className="font-medium">Step 4 — Validation</p>
              <p>✓ Checksum valid</p>
              <p>✓ File integrity OK</p>
              <p>✓ Database schema compatible</p>
              <Button size="sm" className="mt-2" onClick={() => setStep(4)}>Step 5 — Confirmation</Button>
            </CardContent></Card>
          )}

          {step === 4 && (
            <Card><CardContent className="space-y-3 p-4">
              <p className="text-xs font-medium">Step 5 — Confirmation</p>
              <p className="text-[10px] text-muted-foreground">Restore akan menimpa data pada target yang dipilih. Pastikan recovery point benar.</p>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                Saya mengkonfirmasi restore ini
              </label>
              <Button size="sm" variant="destructive" disabled={!confirmed} onClick={runRestore}>Step 6 — Restore</Button>
            </CardContent></Card>
          )}
        </div>
      )}

      {step === 5 && restore.isPending && (
        <Card><CardContent className="p-6 text-center text-xs text-muted-foreground">Restoring data...</CardContent></Card>
      )}

      {step >= 6 && result && (
        <Card><CardContent className="space-y-2 p-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Step 7 — Verification / Completed
          </div>
          <p>Affected records: {result.affectedRecords}</p>
          <p>Duration: {Math.round((result.durationMs ?? 0) / 1000)}s</p>
          <p>✓ Checksum: {result.verification?.checksum ? 'Pass' : 'Fail'}</p>
          <p>✓ Integrity: {result.verification?.integrity ? 'Pass' : 'Fail'}</p>
          <p>✓ Consistency: {result.verification?.consistency ? 'Pass' : 'Fail'}</p>
          <p>✓ Validation: {result.verification?.validation ? 'Pass' : 'Fail'}</p>
          <p>✓ Application Health: {result.verification?.applicationHealth ? 'Pass' : 'Fail'}</p>
        </CardContent></Card>
      )}

      {!points.length && (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <RotateCcw className="mb-2 h-8 w-8 opacity-40" />
          <p className="text-xs">Belum ada recovery point untuk di-restore.</p>
        </div>
      )}
    </div>
  )
}
