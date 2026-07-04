import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge } from '@/features/ai-insight/components/ConfidenceIndicator'
import type { AnomalyItem, CorrelationItem } from '@/features/ai-insight/types/ai-insight'

export function CorrelationAnalysis({ items }: { items: CorrelationItem[] }) {
  if (!items.length) return null
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">AI Correlation</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((c) => (
          <div key={c.label} className="rounded-lg border border-border p-3">
            <div className="flex justify-between gap-2">
              <p className="text-sm font-medium">{c.label}</p>
              <span className="text-sm font-bold text-primary">{c.correlation}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function AnomalyDetector({ items }: { items: AnomalyItem[] }) {
  if (!items.length) return null
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Anomaly Detection</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((a) => (
          <div key={a.period} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{a.period}</p>
              <SeverityBadge severity={a.severity} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function AiTimeline({ timeline }: { timeline: { year: number; label: string; count: number }[] }) {
  if (!timeline.length) return null
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">AI Timeline</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {timeline.map((t, i) => (
            <div key={t.year} className="flex items-center gap-2">
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <p className="text-xs font-bold">{t.year}</p>
                <p className="text-[10px] text-muted-foreground">{t.label}</p>
                <p className="text-sm font-semibold">{t.count}</p>
              </div>
              {i < timeline.length - 1 && <span className="text-muted-foreground">↓</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function HotspotPrediction({ items }: { items: { name: string; growthPct: number }[] }) {
  if (!items.length) return null
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Hotspot Prediction</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">Semester berikutnya (estimasi)</p>
        {items.map((h) => (
          <div key={h.name} className="flex justify-between rounded bg-muted/40 px-3 py-2 text-sm">
            <span>{h.name}</span>
            <span className="font-semibold text-red-600">↑ {h.growthPct}%</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
