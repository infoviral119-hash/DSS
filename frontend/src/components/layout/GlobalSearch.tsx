import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SearchHit {
  id: string
  label: string
  sub?: string
  type: string
}

interface SearchResult {
  users: SearchHit[]
  roles: SearchHit[]
  permissions: SearchHit[]
  audit: SearchHit[]
  sessions: SearchHit[]
  organizations: SearchHit[]
}

const TYPE_ROUTES: Record<string, (id: string) => string> = {
  user: () => '/admin/users',
  role: () => '/admin/roles',
  permission: () => '/admin/permissions',
  audit: () => '/admin/audit',
  session: () => '/admin/sessions',
  organization: () => '/admin/organizations',
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQ('')
      setDebounced('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250)
    return () => clearTimeout(t)
  }, [q])

  const { data } = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: async () => (await api.get('/api/security/search', { params: { q: debounced } })).data as SearchResult,
    enabled: debounced.length >= 2,
  })

  if (!open) return null

  const groups = data
    ? [
        { title: 'Users', items: data.users },
        { title: 'Roles', items: data.roles },
        { title: 'Permissions', items: data.permissions },
        { title: 'Audit', items: data.audit },
        { title: 'Sessions', items: data.sessions },
        { title: 'Organizations', items: data.organizations },
      ].filter((g) => g.items.length > 0)
    : []

  const go = (hit: SearchHit) => {
    const route = TYPE_ROUTES[hit.type]?.(hit.id) ?? '/admin'
    navigate(route)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-border bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari user, role, audit, session..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {debounced.length < 2 ? (
            <p className="px-2 py-4 text-xs text-muted-foreground">Ketik minimal 2 karakter...</p>
          ) : groups.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted-foreground">Tidak ada hasil</p>
          ) : groups.map((g) => (
            <div key={g.title} className="mb-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{g.title}</p>
              {g.items.map((hit) => (
                <button
                  key={`${hit.type}-${hit.id}`}
                  type="button"
                  onClick={() => go(hit)}
                  className={cn('flex w-full flex-col rounded px-2 py-1.5 text-left text-xs hover:bg-secondary/60')}
                >
                  <span className="font-medium">{hit.label}</span>
                  {hit.sub && <span className="text-muted-foreground">{hit.sub}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
