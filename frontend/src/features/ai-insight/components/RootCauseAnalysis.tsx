import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfidenceIndicator } from '@/features/ai-insight/components/ConfidenceIndicator'

export function RootCauseAnalysis({ factors, confidence }: {
  factors: { text: string; confidence: number }[]
  confidence: number
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Root Cause Analysis</CardTitle>
          <ConfidenceIndicator value={confidence} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">Kemungkinan dipengaruhi oleh:</p>
        <ul className="space-y-1.5">
          {factors.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="text-primary">•</span>
              <span>{f.text}</span>
              <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{f.confidence}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
