import type { PriorityItem, RecommendationItem } from '@/features/ai-insight/types/ai-insight'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge, ConfidenceIndicator } from '@/features/ai-insight/components/ConfidenceIndicator'

export function PriorityRanking({ items }: { items: PriorityItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Priority Ranking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((p) => (
          <div key={p.rank} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {p.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">{p.caseCount} kasus · trend {p.trendPct}% · selesai {p.completionRate}%</p>
            </div>
            <span className="text-sm font-bold">{p.score}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function RecommendationEngine({ items }: { items: RecommendationItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">AI Recommendation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((r, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{r.title}</p>
              <SeverityBadge severity={r.priority} />
            </div>
            <p className="mb-2 text-xs text-muted-foreground">Disarankan:</p>
            <ul className="mb-2 space-y-0.5">
              {r.actions.map((a) => (
                <li key={a} className="text-xs">• {a}</li>
              ))}
            </ul>
            <p className="mb-1 text-[10px] font-semibold text-muted-foreground">Mengapa?</p>
            <ul className="mb-2 space-y-0.5">
              {r.why.map((w) => (
                <li key={w} className="text-[10px] text-muted-foreground">• {w}</li>
              ))}
            </ul>
            <ConfidenceIndicator value={r.confidence} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
