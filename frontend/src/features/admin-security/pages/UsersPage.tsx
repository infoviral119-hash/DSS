import { useMemo, useState } from 'react'
import { PageHeader, exportCsv } from '../components/PageHeader'
import { SecurityTable } from '../components/SecurityTable'
import { useSecurityUsers, useUpdateUser } from '../hooks/useSecurity'
import type { SecurityUser } from '../types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TABS = ['Profile', 'Role', 'Permission', 'Login History', 'Audit Trail', 'Sessions', 'Devices', 'API Access', 'Activity']

export function UsersPage() {
  const { data: users = [], isLoading } = useSecurityUsers()
  const updateUser = useUpdateUser()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SecurityUser | null>(null)
  const [tab, setTab] = useState('Profile')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (users as SecurityUser[]).filter(
      (u) => !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.includes(q),
    )
  }, [users, search])

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Enterprise identity & access control"
        search={search}
        onSearchChange={setSearch}
        onExport={() => exportCsv('users.csv', filtered as unknown as Record<string, unknown>[])}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat users...</p>
      ) : (
        <SecurityTable<SecurityUser & Record<string, unknown>>
          rows={filtered as (SecurityUser & Record<string, unknown>)[]}
          onRowClick={(row) => { setSelected(row as SecurityUser); setTab('Profile') }}
          columns={[
            {
              key: 'fullName',
              label: 'Nama',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {r.fullName?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p className="font-medium">{r.fullName}</p>
                    <p className="text-[10px] text-muted-foreground">{r.email}</p>
                  </div>
                </div>
              ),
            },
            { key: 'username', label: 'Username' },
            { key: 'role', label: 'Role' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <span className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-medium',
                  r.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600',
                )}>
                  {r.status}
                </span>
              ),
            },
            {
              key: 'mfaEnabled',
              label: 'MFA',
              render: (r) => (r.mfaEnabled ? '✓' : '-'),
            },
            {
              key: 'lastLogin',
              label: 'Last Login',
              render: (r) => r.lastLogin ? new Date(String(r.lastLogin)).toLocaleString('id-ID') : '-',
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                    onClick={() => updateUser.mutate({ id: r.id, patch: { status: r.status === 'active' ? 'disabled' : 'active' } })}>
                    {r.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{selected.fullName}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Tutup</Button>
            </div>
            <div className="mb-3 flex flex-wrap gap-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded px-2 py-1 text-[10px]',
                    tab === t ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === 'Profile' && (
              <dl className="space-y-2 text-xs">
                <div><dt className="text-muted-foreground">Email</dt><dd>{selected.email}</dd></div>
                <div><dt className="text-muted-foreground">Username</dt><dd>{selected.username}</dd></div>
                <div><dt className="text-muted-foreground">Employee ID</dt><dd>{selected.employeeId ?? '-'}</dd></div>
                <div><dt className="text-muted-foreground">Role</dt><dd>{selected.role}</dd></div>
                <div><dt className="text-muted-foreground">Status</dt><dd>{selected.status}</dd></div>
                <div><dt className="text-muted-foreground">MFA</dt><dd>{selected.mfaEnabled ? 'Enabled' : 'Disabled'}</dd></div>
                <div><dt className="text-muted-foreground">Data Scope</dt><dd>{selected.dataScope ?? 'national'}</dd></div>
                <div><dt className="text-muted-foreground">Scope Region</dt><dd>{selected.scopeRegion ?? '-'}</dd></div>
              </dl>
            )}
            {tab !== 'Profile' && (
              <p className="text-xs text-muted-foreground">Data {tab} — terhubung ke audit & session log.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
