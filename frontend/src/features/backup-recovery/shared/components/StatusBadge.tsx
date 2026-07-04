import { memo } from 'react'
import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  healthy: 'bg-emerald-500/10 text-emerald-600',
  online: 'bg-emerald-500/10 text-emerald-600',
  available: 'bg-emerald-500/10 text-emerald-600',
  excellent: 'bg-emerald-500/10 text-emerald-600',
  idle: 'bg-sky-500/10 text-sky-600',
  running: 'bg-blue-500/10 text-blue-600',
  queued: 'bg-violet-500/10 text-violet-600',
  paused: 'bg-amber-500/10 text-amber-600',
  warning: 'bg-amber-500/10 text-amber-600',
  failed: 'bg-red-500/10 text-red-600',
  critical: 'bg-red-500/10 text-red-600',
  offline: 'bg-red-500/10 text-red-600',
  cancelled: 'bg-zinc-500/10 text-zinc-600',
  disabled: 'bg-zinc-500/10 text-zinc-600',
}

export const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, '_')
  const tone = Object.entries(STATUS_MAP).find(([k]) => key.includes(k))?.[1] ?? 'bg-secondary text-muted-foreground'
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', tone)}>
      {status}
    </span>
  )
})
