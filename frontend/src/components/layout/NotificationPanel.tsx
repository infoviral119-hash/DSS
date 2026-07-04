import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface NotificationRow {
  id: string
  title: string
  message: string
  category: string
  read: boolean
  createdAt: string
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: count = 0 } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => (await api.get('/api/security/notifications/unread-count')).data,
    refetchInterval: 30000,
  })

  const { data: items = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/api/security/notifications')).data as NotificationRow[],
    enabled: open,
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/api/security/notifications/${id}/read`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const markAll = useMutation({
    mutationFn: async () => (await api.post('/api/security/notifications/read-all')).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const tone = (cat: string) => {
    if (cat === 'critical') return 'border-red-500/30 bg-red-500/5'
    if (cat === 'warning') return 'border-amber-500/30 bg-amber-500/5'
    return 'border-border'
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} className="relative">
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-medium">Notifikasi</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => markAll.mutate()}>Read all</Button>
                <button type="button" onClick={() => setOpen(false)}><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {items.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">Tidak ada notifikasi</p>
              ) : items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && markRead.mutate(n.id)}
                  className={cn('mb-1 w-full rounded border p-2 text-left text-xs', tone(n.category), !n.read && 'font-medium')}
                >
                  <p>{n.title}</p>
                  <p className="text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString('id-ID')}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
