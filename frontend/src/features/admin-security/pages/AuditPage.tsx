import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader, exportCsv } from '../components/PageHeader'
import { SecurityTable } from '../components/SecurityTable'
import { KpiGrid } from '../components/KpiGrid'
import { useAuditTrail, useSecurityCenter } from '../hooks/useSecurity'
import { ShieldAlert, Shield, Lock, UserX } from 'lucide-react'

export function AuditTrailPage() {
  const { data: audit = [] } = useAuditTrail()

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle="Complete activity log — create, update, delete, export, API"
        onExport={() => exportCsv('audit-trail.csv', audit)}
      />
      <SecurityTable
        rows={audit}
        columns={[
          { key: 'action', label: 'Action' },
          { key: 'entityType', label: 'Entity' },
          { key: 'entityId', label: 'Entity ID', render: (r) => r.entityId ? String(r.entityId).slice(0, 8) : '-' },
          { key: 'userId', label: 'User', render: (r) => r.userId ? String(r.userId).slice(0, 8) : '-' },
          { key: 'ip', label: 'IP' },
          { key: 'browser', label: 'Browser' },
          { key: 'createdAt', label: 'Time', render: (r) => r.createdAt ? new Date(String(r.createdAt)).toLocaleString('id-ID') : '-' },
        ]}
      />
    </div>
  )
}

export function SecurityCenterPage() {
  const { data } = useSecurityCenter()

  const gaugeOption = {
    series: [{
      type: 'gauge', min: 0, max: 100,
      detail: { formatter: '{value}' },
      data: [{ value: data?.securityScore ?? 0 }],
    }],
  }

  return (
    <div>
      <PageHeader title="Security Center" subtitle="Threat monitoring & security posture" />
      <KpiGrid items={[
        { label: 'Security Score', value: data?.securityScore ?? 0, icon: Shield },
        { label: 'Failed Login', value: data?.failedLogin ?? 0, icon: ShieldAlert, tone: 'warning' },
        { label: 'Locked Users', value: data?.lockedUser ?? 0, icon: Lock, tone: 'danger' },
        { label: 'Inactive Users', value: data?.inactiveUser ?? 0, icon: UserX },
      ]} />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Security Score</CardTitle></CardHeader>
          <CardContent><ReactECharts option={gaugeOption} style={{ height: 200 }} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Security Events</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {(data?.events ?? []).map((e: { id: string; severity: string; message: string; createdAt: string }) => (
                <div key={e.id} className="rounded border border-border px-2 py-1.5 text-xs">
                  <span className="font-medium uppercase text-muted-foreground">{e.severity}</span>
                  <p>{e.message}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(e.createdAt).toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AuditReportPage() {
  return <AuditTrailPage />
}
