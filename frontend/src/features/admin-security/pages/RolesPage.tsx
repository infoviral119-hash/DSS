import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { SecurityTable } from '../components/SecurityTable'
import { useSecurityRoles, useRolePermissions, usePermissions } from '../hooks/useSecurity'
import { cn } from '@/lib/utils'

export function RolesPage() {
  const { data: roles = [] } = useSecurityRoles()
  const [selected, setSelected] = useState('')
  const { data: matrix = [] } = useRolePermissions(selected)

  return (
    <div>
      <PageHeader title="Role Management" subtitle="Role Based Access Control (RBAC)" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SecurityTable
          rows={roles}
          onRowClick={(r) => setSelected(String(r.slug))}
          columns={[
            { key: 'name', label: 'Role' },
            { key: 'slug', label: 'Slug' },
            { key: 'description', label: 'Description' },
            {
              key: 'isSystem',
              label: 'System',
              render: (r) => (r.isSystem ? 'Yes' : 'Custom'),
            },
          ]}
        />
        <div>
          <h3 className="mb-2 text-sm font-medium">
            Permission Matrix {selected && `— ${selected}`}
          </h3>
          {!selected ? (
            <p className="text-xs text-muted-foreground">Pilih role untuk melihat permission matrix.</p>
          ) : (
            <div className="glass-panel rounded-lg border border-border p-3">
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {matrix.map((p: { code: string; granted: boolean }) => (
                  <label key={p.code} className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={p.granted} readOnly className="rounded" />
                    <span className={cn(!p.granted && 'text-muted-foreground')}>{p.code}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PermissionsPage() {
  const { data: permissions = [] } = usePermissions()

  const modules = [...new Set((permissions as { module: string }[]).map((p) => p.module))]

  return (
    <div>
      <PageHeader title="Permission Management" subtitle="Granular permission control" />
      {modules.map((mod) => (
        <div key={String(mod)} className="mb-4">
          <h3 className="mb-2 text-sm font-medium">{String(mod)}</h3>
          <SecurityTable
            rows={(permissions as { module: string; code: string; action: string }[]).filter((p) => p.module === mod)}
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'action', label: 'Action' },
            ]}
          />
        </div>
      ))}
    </div>
  )
}
