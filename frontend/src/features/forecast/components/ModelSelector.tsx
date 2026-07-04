import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MODEL_OPTIONS, HORIZON_OPTIONS, CONFIDENCE_OPTIONS, DIMENSION_OPTIONS } from '@/features/forecast/types/forecast'
import type { ForecastParams } from '@/features/forecast/hooks/useForecast'

interface ModelSelectorProps {
  params: ForecastParams
  onChange: (p: Partial<ForecastParams>) => void
  mlService?: { connected: boolean; models?: Record<string, boolean> }
}

function isModelAvailable(id: string, mlService?: { connected: boolean; models?: Record<string, boolean> }) {
  const opt = MODEL_OPTIONS.find((m) => m.id === id)
  if (!opt?.available) return false
  if (['prophet', 'random_forest', 'xgboost', 'lstm', 'hybrid'].includes(id)) {
    if (!mlService?.connected) return false
    if (id === 'prophet' && mlService.models?.prophet === false) return false
  }
  return true
}

export function ModelSelector({ params, onChange, mlService }: ModelSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Model & Parameter</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Model</span>
          <select
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={params.model}
            onChange={(e) => onChange({ model: e.target.value })}
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id} disabled={!isModelAvailable(m.id, mlService)}>
                {m.name}
                {!isModelAvailable(m.id, mlService) && m.id !== 'auto' ? ' (offline)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Horizon</span>
          <select
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={params.horizon}
            onChange={(e) => onChange({ horizon: Number(e.target.value) })}
          >
            {HORIZON_OPTIONS.map((h) => (
              <option key={h} value={h}>{h} bulan</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Confidence Interval</span>
          <select
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={params.confidence}
            onChange={(e) => onChange({ confidence: Number(e.target.value) })}
          >
            {CONFIDENCE_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}%</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Dimensi</span>
          <select
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={params.dimension}
            onChange={(e) => onChange({ dimension: e.target.value, dimensionValue: undefined })}
          >
            {DIMENSION_OPTIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </label>
      </CardContent>
    </Card>
  )
}
