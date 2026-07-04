import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  tabs,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  tabs?: Tab[]
  children?: React.ReactNode
}) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id ?? '')

  if (!open) return null

  const activeContent = tabs?.find((t) => t.id === activeTab)?.content ?? children

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[min(40vw,560px)] min-w-[300px] flex-col border-l border-border bg-background shadow-2xl"
        role="dialog"
        aria-label={title}
      >
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">{title}</h2>
              {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} className="rounded p-1 hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
          {tabs && tabs.length > 0 && (
            <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'shrink-0 rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors',
                    activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/60',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-xs">{activeContent}</div>
      </aside>
    </>
  )
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
