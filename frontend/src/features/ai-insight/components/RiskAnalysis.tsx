import type { RiskItem } from '@/features/ai-insight/types/ai-insight'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge } from '@/features/ai-insight/components/ConfidenceIndicator'
import { riskLevelColor } from '@/features/ai-insight/utils/colors'

export function RiskAnalysis({ items }: { items: RiskItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">AI Risk Matrix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((r) => (
          <div key={r.name} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{r.name}</p>
              <SeverityBadge severity={r.level} />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground">Risk Score</span>
              <span className="text-lg font-bold" style={{ color: riskLevelColor(r.score) }}>{r.score}</span>
            </div>
            {r.factors.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {r.factors.map((f) => (
                  <li key={f} className="text-[10px] text-muted-foreground">• {f}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
