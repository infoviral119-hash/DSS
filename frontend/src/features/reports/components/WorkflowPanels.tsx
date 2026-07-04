import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReportSchedules, useReportMutations, useReportAudit } from '@/features/reports/hooks/useReport'
import { Loader2, Play, Trash2 } from 'lucide-react'

const FREQ = ['daily', 'weekly', 'monthly', 'quarterly', 'semester', 'yearly'] as const

export function ScheduleManagerFull() {
  const { data, isLoading } = useReportSchedules()
  const { createSchedule, deleteSchedule, runSchedule } = useReportMutations()
  const [form, setForm] = useState({ name: '', email: '', frequency: 'weekly' as const, category: 'executive', format: 'pdf' })

  const submit = () => {
    if (!form.name || !form.email) return
    createSchedule.mutate({ ...form, filters: {} })
    setForm({ name: '', email: '', frequency: 'weekly', category: 'executive', format: 'pdf' })
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Scheduled Reports</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="rounded border px-2 py-1 text-xs" placeholder="Nama jadwal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded border px-2 py-1 text-xs" placeholder="Email tujuan" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="rounded border px-2 py-1 text-xs" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as typeof form.frequency })}>
            {FREQ.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={submit} disabled={createSchedule.isPending}>Buat Jadwal + Email</Button>

        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
          <div className="space-y-1">
            {(data ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground">{s.frequency} → {s.email} · next: {new Date(s.nextRun).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => runSchedule.mutate(s.id)}><Play className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteSchedule.mutate(s.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">Set REPORT_EMAIL_WEBHOOK di .env untuk kirim email otomatis</p>
      </CardContent>
    </Card>
  )
}

export function ApprovalWorkflow({ reportId, approval }: {
  reportId: string
  approval: { status: string; reviewer: string | null; note: string; history?: { status: string; by: string; at: string }[] }
}) {
  const { updateApproval } = useReportMutations()

  const actions = [
    { id: 'submit', label: 'Ajukan Review', show: approval.status === 'draft' },
    { id: 'approve', label: 'Setujui', show: approval.status === 'review' },
    { id: 'reject', label: 'Tolak', show: approval.status === 'review' },
    { id: 'publish', label: 'Publikasi', show: approval.status === 'approved' },
  ] as const

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Approval Workflow</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p>Status: <strong className="uppercase">{approval.status}</strong></p>
        {approval.reviewer && <p>Reviewer: {approval.reviewer}</p>}
        <div className="flex flex-wrap gap-1">
          {actions.filter((a) => a.show).map((a) => (
            <Button key={a.id} size="sm" variant="outline" onClick={() => updateApproval.mutate({ reportId, action: a.id })}>
              {a.label}
            </Button>
          ))}
        </div>
        {(approval.history ?? []).slice(-3).map((h, i) => (
          <p key={i} className="text-muted-foreground">{h.status} oleh {h.by} · {new Date(h.at).toLocaleString('id-ID')}</p>
        ))}
      </CardContent>
    </Card>
  )
}

export function DigitalSignature({ sig }: { sig?: { qrUrl: string; hash: string; verificationUrl: string; signedAt: string } }) {
  if (!sig) return null
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Digital Signature</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-4 text-xs">
        <img src={sig.qrUrl} alt="QR" className="h-20 w-20 rounded border" />
        <div>
          <p>Hash: <code>{sig.hash}</code></p>
          <p className="text-muted-foreground">Verifikasi: {sig.verificationUrl}</p>
          <p className="text-muted-foreground">Ditandatangani: {new Date(sig.signedAt).toLocaleString('id-ID')}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReportSharing({ reportId }: { reportId: string }) {
  const { createShare } = useReportMutations()
  const [result, setResult] = useState<{ token: string; expiresAt: string } | null>(null)
  const [password, setPassword] = useState('')
  const [days, setDays] = useState(7)

  const share = async () => {
    const res = await createShare.mutateAsync({
      reportId,
      password: password || undefined,
      permission: 'read',
      watermark: 'CONFIDENTIAL',
      expiresInDays: days,
    })
    setResult(res)
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Secure Report Sharing</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex flex-wrap gap-2">
          <input className="rounded border px-2 py-1" placeholder="Password (opsional)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="number" className="w-16 rounded border px-2 py-1" value={days} onChange={(e) => setDays(Number(e.target.value))} />
          <Button size="sm" onClick={share}>Buat Link</Button>
        </div>
        {result && (
          <p className="break-all rounded bg-muted p-2">
            Link: /api/reports/share/{result.token}
            <br />Kedaluwarsa: {new Date(result.expiresAt).toLocaleString('id-ID')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function VersionControl({ reportId, versions }: { reportId: string; versions?: { version: string; createdBy: string; createdAt: string; note?: string }[] }) {
  const { saveVersion } = useReportMutations()

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Version Control</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <Button size="sm" onClick={() => saveVersion.mutate({ reportId, snapshot: { savedAt: new Date().toISOString() }, note: 'Snapshot manual' })}>
          Simpan Versi Baru
        </Button>
        {(versions ?? []).map((v) => (
          <p key={v.version} className="rounded bg-muted/50 p-2">
            <strong>{v.version}</strong> · {v.createdBy} · {new Date(v.createdAt).toLocaleString('id-ID')}
            {v.note && <span className="text-muted-foreground"> — {v.note}</span>}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}

export function AuditTrail() {
  const { data, isLoading } = useReportAudit()

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Audit Trail</CardTitle></CardHeader>
      <CardContent className="max-h-48 overflow-auto text-xs">
        {isLoading ? <p>Memuat...</p> : (data ?? []).map((a) => (
          <p key={a.id} className="border-b border-border/50 py-1">
            <strong>{a.action}</strong> · {a.user} · {new Date(a.at).toLocaleString('id-ID')}
            {a.reportId && ` · ${a.reportId}`}
            {a.format && ` · ${a.format}`}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}
