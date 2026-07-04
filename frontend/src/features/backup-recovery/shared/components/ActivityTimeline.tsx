import { cn } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'

const STAGE_ICONS: Record<string, string> = {
  started: '●',
  compress: '◆',
  encrypt: '◆',
  upload: '▲',
  verify: '✓',
  completed: '✓',
  failed: '✕',
}

export function ActivityTimeline({
  items,
}: {
  items: { stage: string; message: string; createdAt?: string; level?: string }[]
}) {
  if (!items.length) {
    return <p className="text-xs text-muted-foreground">Belum ada aktivitas.</p>
  }

  return (
    <div className="relative space-y-3 border-l-2 border-primary/20 pl-4">
      {items.map((item, i) => (
        <div key={`${item.stage}-${i}`} className="relative">
          <span className={cn(
            'absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px]',
            item.level === 'error' ? 'bg-red-500 text-white' : i === items.length - 1 ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground',
          )}>
            {STAGE_ICONS[item.stage] ?? '○'}
          </span>
          <p className="text-xs font-medium capitalize">{item.stage.replace(/_/g, ' ')}</p>
          <p className="text-[10px] text-muted-foreground">{item.message}</p>
          {item.createdAt && (
            <p className="text-[10px] text-muted-foreground/70">{new Date(item.createdAt).toLocaleString('id-ID')}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export function RecoveryTimeline({
  points,
  onSelect,
}: {
  points: { id: string; backupName: string; backupTime: string; status: string }[]
  onSelect?: (id: string) => void
}) {
  if (!points.length) return null

  return (
    <div className="relative border-l-2 border-primary/30 pl-5 space-y-6">
      {points.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect?.(p.id)}
          className="relative block w-full text-left transition-opacity hover:opacity-80"
        >
          <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
          <p className="text-xs font-semibold">{new Date(p.backupTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
          <p className="text-[10px] text-muted-foreground">{new Date(p.backupTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
          <StatusBadge status={p.status} />
          <p className="mt-1 truncate text-[10px]">{p.backupName}</p>
        </button>
      ))}
    </div>
  )
}
