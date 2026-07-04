import type { Env } from './shared'
import type { ModelMetrics } from './forecast-models'

export interface MlModelComparison {
  id: string
  name: string
  metrics: ModelMetrics
  status: string
  available: boolean
}

export interface MlForecastResult {
  available: boolean
  message?: string
  model?: string
  modelName?: string
  fitted?: number[]
  forecast?: number[]
  lower?: number[]
  upper?: number[]
  metrics?: ModelMetrics
  featureImportance?: { name: string; value: number }[]
  comparison?: MlModelComparison[]
}

function mlBaseUrl(env: Env) {
  return env.ML_SERVICE_URL?.replace(/\/$/, '') || ''
}

export async function getMlStatus(env: Env) {
  const base = mlBaseUrl(env)
  if (!base) return { connected: false, models: {} as Record<string, boolean>, message: 'ML_SERVICE_URL belum dikonfigurasi' }
  try {
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return { connected: false, models: {} as Record<string, boolean> }
    const data = await res.json() as { models?: Record<string, boolean> }
    return { connected: true, models: data.models ?? {} }
  } catch {
    return { connected: false, models: {} as Record<string, boolean>, message: 'ML service tidak dapat dijangkau' }
  }
}

export async function runMlForecast(
  env: Env,
  input: { labels: string[]; values: number[]; horizon: number; confidence: number; model: string; holdout?: number },
): Promise<MlForecastResult> {
  const base = mlBaseUrl(env)
  if (!base) return { available: false, message: 'ML_SERVICE_URL belum dikonfigurasi' }
  try {
    const res = await fetch(`${base}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        labels: input.labels,
        values: input.values,
        horizon: input.horizon,
        confidence: input.confidence,
        model: ['prophet', 'random_forest', 'xgboost', 'lstm', 'hybrid', 'auto'].includes(input.model) ? input.model : 'auto',
        holdout: input.holdout ?? 6,
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) return { available: false, message: 'ML service tidak merespons' }
    const data = await res.json() as MlForecastResult & { available?: boolean; message?: string }
    if (!data.available) return { available: false, message: data.message ?? 'ML service unavailable' }
    return {
      available: true,
      model: data.model,
      modelName: data.modelName,
      fitted: data.fitted,
      forecast: data.forecast,
      lower: data.lower,
      upper: data.upper,
      metrics: data.metrics,
      featureImportance: data.featureImportance,
      comparison: data.comparison,
    }
  } catch {
    return { available: false, message: 'ML service tidak berjalan' }
  }
}
