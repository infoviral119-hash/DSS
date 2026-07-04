import { Gauge } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { riskLevelColor } from '@/features/ai-insight/utils/colors'

export function DecisionScore({ score }: { score: number }) {
  const color = riskLevelColor(score)
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4" />
          Decision Score
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-3xl font-bold" style={{ color }}>{score}</p>
        <p className="text-xs text-muted-foreground">/ 100 — semakin tinggi semakin mendesak</p>
      </CardContent>
    </Card>
  )
}
