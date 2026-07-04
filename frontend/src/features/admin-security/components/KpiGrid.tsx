import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KpiItem {
  label: string
  value: string | number
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

export function KpiGrid({ items }: { items: KpiItem[] }) {
  const toneClass = {
    default: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-3 p-4">
            {item.icon && (
              <div className={cn('rounded-md bg-secondary/60 p-2', toneClass[item.tone ?? 'default'])}>
                <item.icon className="h-4 w-4" />
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="text-xl font-semibold">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
