import type { ScenarioItem } from '@/features/ai-insight/types/ai-insight'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown } from 'lucide-react'

export function ScenarioSimulator({ scenarios }: { scenarios: ScenarioItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Decision Scenario (What-if)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {scenarios.map((s) => (
          <div key={s.label} className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs font-medium">{s.label}</p>
            <p className="mt-2 text-lg font-bold">{s.before}</p>
            <ArrowDown className="mx-auto my-1 h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold text-primary">{s.after}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{s.delta}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
