import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export function ForecastNarrative({ narrative, explain }: { narrative: string; explain: string[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Forecast Narrative</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{narrative}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Explainable Forecast</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {explain.map((e) => (
              <li key={e} className="text-xs text-muted-foreground">• {e}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export function RecommendationEngine({ items }: { items: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">AI Recommendation</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {items.map((r) => (
            <li key={r} className="text-sm">• {r}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function ScenarioSimulator({ scenarios }: { scenarios: { label: string; before: string; after: string; delta: string }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Scenario Simulation</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {scenarios.map((s) => (
          <div key={s.label} className="rounded-lg border border-border p-3 text-center text-xs">
            <p className="font-medium">{s.label}</p>
            <p className="mt-2 text-lg font-bold">{s.before}</p>
            <p className="text-muted-foreground">↓</p>
            <p className="text-lg font-bold text-primary">{s.after}</p>
            <p className="mt-1 text-muted-foreground">{s.delta}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function EarlyWarning({ warnings }: { warnings: { message: string }[] }) {
  if (!warnings.length) return null
  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4" />
          Early Warning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {warnings.map((w) => (
          <p key={w.message} className="text-sm text-orange-900">⚠ {w.message}</p>
        ))}
      </CardContent>
    </Card>
  )
}

export function ForecastCalendar({ calendar }: { calendar: { month: string; predicted: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Forecast Calendar</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {calendar.map((c) => (
            <div key={c.month} className="rounded-lg bg-muted/40 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{c.month}</p>
              <p className="text-sm font-bold">{c.predicted}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function RegionalForecast({ regional }: { regional: { name: string; growthPct: number; forecast: number }[] }) {
  if (!regional?.length) return null
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Forecast by Kabupaten</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {regional.map((r) => (
          <div key={r.name} className="flex justify-between rounded bg-muted/30 px-2 py-1.5 text-xs">
            <span>{r.name}</span>
            <span className={r.growthPct > 15 ? 'font-semibold text-red-600' : ''}>
              {r.forecast} kasus · {r.growthPct > 0 ? '+' : ''}{r.growthPct}%
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
