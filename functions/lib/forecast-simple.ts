import type { Env } from './shared'
import { dbClient } from './shared'
import { applyCaseFilters, parseCaseFilters } from './case-filters'
import { runForecastEngine, forecastByRegions, extractMonthlySeries } from './forecast-engine'
import { getMlStatus, runMlForecast } from './forecast-ml.client'

const ML_MODELS = new Set(['prophet', 'random_forest', 'xgboost', 'lstm', 'hybrid'])

async function loadCases(env: Env, query: Record<string, string | undefined>) {
  const filters = parseCaseFilters(query)
  const db = dbClient(env)
  const { data } = await db
    .from('cases')
    .select('tanggal, tahun, kabupaten, kecamatan, provinsi, jenis_kekerasan, jenis_kelamin, status')
    .order('tanggal', { ascending: true })
  return { cases: applyCaseFilters(data ?? [], filters), connected: Boolean(data) }
}

export async function getMlStatusHandler(env: Env) {
  return getMlStatus(env)
}

export async function getIntelligence(env: Env, query: Record<string, string | undefined>) {
  const { cases, connected } = await loadCases(env, query)
  if (!connected) return { connected: false, insufficient: true, message: 'Database tidak terhubung' }

  const horizon = Math.min(24, Math.max(1, Number(query.horizon) || 6))
  const confidence = [80, 90, 95, 99].includes(Number(query.confidence)) ? Number(query.confidence) : 95
  const model = query.model || 'auto'
  const dimension = query.dimension || 'global'
  const dimensionValue = query.dimensionValue || undefined

  const { labels, values } = extractMonthlySeries(cases, dimension, dimensionValue)
  const holdout = Math.min(6, Math.max(2, Math.floor(values.length / 4)))

  const mlModelParam = ML_MODELS.has(model) || model === 'auto' ? model : 'auto'
  let mlResult = values.length >= 3
    ? await runMlForecast(env, { labels, values, horizon, confidence, model: mlModelParam, holdout })
    : { available: false as const }

  const engineInput = { cases, horizon, confidence, model, dimension, dimensionValue }
  let result = runForecastEngine(engineInput, mlResult)

  const picked = String((result as { model?: string }).model ?? '')
  if (model === 'auto' && ML_MODELS.has(picked) && mlResult.available && mlResult.model !== picked) {
    mlResult = await runMlForecast(env, { labels, values, horizon, confidence, model: picked, holdout })
    result = runForecastEngine(engineInput, mlResult)
  }

  const regional = forecastByRegions(cases, Math.min(horizon, 3))
  const mlStatus = await getMlStatus(env)

  return { ...result, regional, mlService: mlStatus }
}
