import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import ReactECharts from 'echarts-for-react'

export interface KpiCardItem {
  label: string
  value: string | number
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'danger'
  progress?: number
  sparkline?: number[]
  badge?: string
}

const toneClass = {
  default: 'text-primary',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
}

export const KpiCard = memo(function KpiCard({ item }: { item: KpiCardItem }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-0.5 truncate text-lg font-semibold">{item.value}</p>
            {item.badge && (
              <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[9px]">{item.badge}</span>
            )}
          </div>
          {item.icon && (
            <div className={cn('rounded-md bg-secondary/60 p-2', toneClass[item.tone ?? 'default'])}>
              <item.icon className="h-4 w-4" />
            </div>
          )}
        </div>
        {item.progress != null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn('h-full rounded-full transition-all', item.tone === 'danger' ? 'bg-red-500' : item.tone === 'warning' ? 'bg-amber-500' : 'bg-primary')}
              style={{ width: `${Math.min(100, item.progress)}%` }}
            />
          </div>
        )}
        {item.sparkline && item.sparkline.length > 1 && (
          <ReactECharts
            style={{ height: 32, width: '100%', marginTop: 4 }}
            option={{
              grid: { left: 0, right: 0, top: 2, bottom: 2 },
              xAxis: { show: false, type: 'category', data: item.sparkline.map((_, i) => i) },
              yAxis: { show: false },
              series: [{ type: 'line', data: item.sparkline, smooth: true, symbol: 'none', lineStyle: { width: 1.5, color: '#0078d4' }, areaStyle: { opacity: 0.08 } }],
            }}
          />
        )}
      </CardContent>
    </Card>
  )
})

export function KpiGrid({ items }: { items: KpiCardItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <KpiCard key={item.label} item={item} />
      ))}
    </div>
  )
}
