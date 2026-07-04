import type { InsightCard } from '@/features/ai-insight/types/ai-insight'
import { Card, CardContent } from '@/components/ui/card'
import { SeverityBadge, ConfidenceIndicator } from '@/features/ai-insight/components/ConfidenceIndicator'
import { TrendingUp, Search, AlertTriangle, LineChart, Lightbulb, Flag } from 'lucide-react'

const ICONS = {
  trend: TrendingUp,
  root_cause: Search,
  risk: AlertTriangle,
  prediction: LineChart,
  recommendation: Lightbulb,
  priority: Flag,
}

const LABELS: Record<string, string> = {
  trend: 'Trend',
  root_cause: 'Root Cause',
  risk: 'Risk',
  prediction: 'Prediction',
  recommendation: 'Recommendation',
  priority: 'Priority',
}

export function InsightCards({ cards }: { cards: InsightCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = ICONS[card.category] ?? TrendingUp
        return (
          <Card key={card.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">{LABELS[card.category]}</span>
                </div>
                <SeverityBadge severity={card.severity} />
              </div>
              <p className="font-medium text-sm">{card.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.content}</p>
              <div className="mt-3 flex items-center justify-between">
                <ConfidenceIndicator value={card.confidence} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
