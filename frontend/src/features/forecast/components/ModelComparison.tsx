import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModelComparisonRow } from '@/features/forecast/types/forecast'

const STATUS_ICON: Record<string, string> = {
  best: '⭐ Best',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  unavailable: 'ML Service',
}

export function ModelComparison({ rows }: { rows: ModelComparisonRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Model Comparison</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-3">Model</th>
              <th className="pb-2 pr-3">Accuracy</th>
              <th className="pb-2 pr-3">MAPE</th>
              <th className="pb-2 pr-3">RMSE</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.filter((r) => r.available || r.status === 'unavailable').map((r) => (
              <tr key={r.id} className={`border-b border-border/50 ${r.status === 'best' ? 'bg-primary/5' : ''}`}>
                <td className="py-2 pr-3 font-medium">{r.name}</td>
                <td className="py-2 pr-3">{r.available ? `${r.metrics.accuracy}%` : '—'}</td>
                <td className="py-2 pr-3">{r.available ? r.metrics.mape : '—'}</td>
                <td className="py-2 pr-3">{r.available ? r.metrics.rmse : '—'}</td>
                <td className="py-2">{STATUS_ICON[r.status] ?? r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
