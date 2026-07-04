import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModelMetrics } from '@/features/forecast/types/forecast'

function metricColor(key: string, value: number) {
  if (key === 'mape' || key === 'rmse' || key === 'mae') {
    if (value <= 5) return '#16A34A'
    if (value <= 12) return '#F59E0B'
    return '#DC2626'
  }
  if (key === 'accuracy' || key === 'r2') {
    if (value >= 90) return '#16A34A'
    if (value >= 75) return '#F59E0B'
    return '#DC2626'
  }
  return '#2563EB'
}

export function ForecastMetrics({ metrics }: { metrics: ModelMetrics }) {
  const items = [
    { key: 'mape', label: 'MAPE', suffix: '%' },
    { key: 'mae', label: 'MAE', suffix: '' },
    { key: 'rmse', label: 'RMSE', suffix: '' },
    { key: 'accuracy', label: 'Accuracy', suffix: '%' },
    { key: 'r2', label: 'R²', suffix: '' },
    { key: 'bias', label: 'Bias', suffix: '' },
  ] as const

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Forecast Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {items.map(({ key, label, suffix }) => {
            const val = metrics[key]
            return (
              <div key={key} className="rounded-lg border border-border p-2 text-center">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-lg font-bold" style={{ color: metricColor(key, val) }}>
                  {val}{suffix}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ForecastQualityGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 90 ? '#16A34A' : score >= 75 ? '#F59E0B' : '#DC2626'
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Forecast Quality</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-3xl font-bold" style={{ color }}>{score}</p>
        <p className="text-sm text-muted-foreground">/100 — {label}</p>
      </CardContent>
    </Card>
  )
}
