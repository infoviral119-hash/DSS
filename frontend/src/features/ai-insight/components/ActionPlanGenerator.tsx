import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ActionPlanGenerator({ plan }: { plan: { phase: string; items: string[] }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Action Plan</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {plan.map((p) => (
          <div key={p.phase} className="rounded-lg bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold text-primary">{p.phase}</p>
            <ul className="space-y-1">
              {p.items.map((item) => (
                <li key={item} className="text-xs text-muted-foreground">• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
