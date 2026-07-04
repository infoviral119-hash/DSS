import { PageHeader, exportCsv } from '../components/PageHeader'
import { SecurityTable } from '../components/SecurityTable'
import { useSessions, useTerminateSession, useLoginHistory } from '../hooks/useSecurity'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SessionsPage() {
  const { data: sessions = [] } = useSessions()
  const terminate = useTerminateSession()

  return (
    <div>
      <PageHeader
        title="Active Sessions"
        subtitle="Monitor & terminate user sessions"
        onExport={() => exportCsv('sessions.csv', sessions)}
      />
      <SecurityTable
        rows={sessions}
        columns={[
          { key: 'userId', label: 'User ID', render: (r) => String(r.userId).slice(0, 8) },
          { key: 'device', label: 'Device' },
          { key: 'browser', label: 'Browser' },
          { key: 'os', label: 'OS' },
          { key: 'ipAddress', label: 'IP' },
          { key: 'location', label: 'Location', render: (r) => String(r.location ?? '-') },
          { key: 'loginAt', label: 'Login', render: (r) => new Date(String(r.loginAt)).toLocaleString('id-ID') },
          {
            key: 'status',
            label: 'Status',
            render: (r) => (
              <span className={cn(
                'rounded px-1.5 py-0.5 text-[10px]',
                r.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600',
              )}>
                {String(r.status)}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (r) => r.status === 'active' ? (
              <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                onClick={() => terminate.mutate(String(r.id))}>
                Terminate
              </Button>
            ) : null,
          },
        ]}
      />
    </div>
  )
}

export function LoginHistoryPage() {
  const { data: history = [] } = useLoginHistory()

  return (
    <div>
      <PageHeader
        title="Login History"
        subtitle="Success, failed, MFA & device verification events"
        onExport={() => exportCsv('login-history.csv', history)}
      />
      <SecurityTable
        rows={history}
        columns={[
          { key: 'email', label: 'User' },
          { key: 'eventType', label: 'Event' },
          {
            key: 'success',
            label: 'Status',
            render: (r) => (
              <span className={r.success ? 'text-emerald-600' : 'text-red-600'}>
                {r.success ? 'Success' : 'Failed'}
              </span>
            ),
          },
          { key: 'ipAddress', label: 'IP' },
          { key: 'browser', label: 'Browser' },
          { key: 'device', label: 'Device' },
          { key: 'createdAt', label: 'Time', render: (r) => new Date(String(r.createdAt)).toLocaleString('id-ID') },
        ]}
      />
    </div>
  )
}
