import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReportIntelligence } from '@/features/reports/types/report'

export function AIReport({ data }: { data: ReportIntelligence }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">AI Executive Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.aiSummary.map((line) => <p key={line}>{line}</p>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Report Narrative</CardTitle></CardHeader>
        <CardContent className="text-sm leading-relaxed">{data.narrative}</CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">AI Recommendation</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Prioritas Wilayah</p>
            <ul className="space-y-1 text-xs">
              {data.recommendations.priorities.map((p) => (
                <li key={p.name} className="rounded bg-muted/50 p-2">{p.name} — skor {p.score}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Rekomendasi</p>
            <ul className="space-y-1 text-xs">
              {data.recommendations.items.map((r) => (
                <li key={r.title} className="rounded bg-muted/50 p-2">
                  <strong>{r.title}</strong>: {r.actions?.join(', ')}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Risiko</p>
            <ul className="space-y-1 text-xs">
              {data.recommendations.risks.map((r) => (
                <li key={r.name} className="rounded bg-red-50 p-2 dark:bg-red-950/30">{r.name} ({r.level})</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Action Plan</p>
            <ul className="space-y-1 text-xs">
              {data.recommendations.actionPlan.map((a) => (
                <li key={a.step} className="rounded bg-muted/50 p-2">{a.step} · {a.owner}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function GISReport({ gis }: { gis: Record<string, unknown> }) {
  const topKab = (gis.topKabupaten as { name: string; count: number }[]) ?? []
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">GIS Report</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
        <div><p className="text-muted-foreground">Total Titik</p><p className="text-xl font-bold">{String(gis.total ?? 0)}</p></div>
        <div><p className="text-muted-foreground">Dengan GPS</p><p className="text-xl font-bold">{String(gis.withGps ?? 0)}</p></div>
        <div>
          <p className="mb-1 text-muted-foreground">Top Kabupaten</p>
          {topKab.slice(0, 5).map((k) => (
            <p key={k.name} className="text-xs">{k.name}: {k.count}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function ForecastReport({ forecast }: { forecast: Record<string, unknown> | null }) {
  if (!forecast) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Data forecast tidak tersedia untuk filter ini.</CardContent>
      </Card>
    )
  }
  const next = forecast.nextMonth as { month?: string; predicted?: number; lower?: number; upper?: number }
  const metrics = forecast.metrics as { accuracy?: number; mape?: number } | undefined
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Forecast Report</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-4 text-sm">
        <div><p className="text-muted-foreground">Model</p><p className="font-medium">{String(forecast.model ?? '-')}</p></div>
        <div><p className="text-muted-foreground">Next Month</p><p className="font-bold">{next?.predicted ?? '-'}</p></div>
        <div><p className="text-muted-foreground">Accuracy</p><p className="font-bold">{metrics?.accuracy ?? '-'}%</p></div>
        <div><p className="text-muted-foreground">Trend</p><p className="font-medium">{String(forecast.trendClass ?? '-')}</p></div>
        <p className="sm:col-span-4 text-xs text-muted-foreground">{String(forecast.narrative ?? '')}</p>
      </CardContent>
    </Card>
  )
}

export function ReportComparison({ comparison }: { comparison: ReportIntelligence['comparison'] }) {
  if (!comparison) return null
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Report Comparison — {comparison.label}</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-6 text-sm">
        <div><p className="text-muted-foreground">Sebelum</p><p className="text-2xl font-bold">{comparison.before}</p></div>
        <div><p className="text-muted-foreground">Sesudah</p><p className="text-2xl font-bold">{comparison.after}</p></div>
        <div>
          <p className="text-muted-foreground">Perubahan</p>
          <p className={`text-2xl font-bold ${comparison.deltaPct >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {comparison.deltaPct >= 0 ? '+' : ''}{comparison.deltaPct}%
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
