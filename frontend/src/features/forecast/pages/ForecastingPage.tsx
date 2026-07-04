import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useForecastIntelligence, type ForecastParams } from '@/features/forecast/hooks/useForecast'
import { ForecastSummary } from '@/features/forecast/components/ForecastSummary'
import { ForecastChart } from '@/features/forecast/components/ForecastChart'
import { ForecastMetrics, ForecastQualityGauge } from '@/features/forecast/components/ForecastMetrics'
import { ModelSelector } from '@/features/forecast/components/ModelSelector'
import { ModelComparison } from '@/features/forecast/components/ModelComparison'
import { ResidualAnalysis, FeatureImportance } from '@/features/forecast/components/ResidualAnalysis'
import {
  ForecastNarrative, RecommendationEngine, ScenarioSimulator,
  EarlyWarning, ForecastCalendar, RegionalForecast,
} from '@/features/forecast/components/ForecastNarrative'
import { ExportPanel } from '@/features/forecast/components/ExportPanel'

export function ForecastingPage() {
  const [params, setParams] = useState<ForecastParams>({
    model: 'auto',
    horizon: 6,
    confidence: 95,
    dimension: 'global',
  })

  const { data, isLoading, isError } = useForecastIntelligence(params)

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Menghitung forecast...
      </div>
    )
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Gagal memuat forecast. Pastikan backend berjalan.</p>
  }

  if (data.insufficient) {
    return <p className="text-sm text-amber-700">{data.message ?? 'Data tidak cukup untuk forecast.'}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Forecast Intelligence · {data.modelName} · {new Date(data.generatedAt).toLocaleString('id-ID')}
          {data.mlService?.connected ? ' · ML Service aktif' : ' · ML Service offline'}
        </p>
        <ExportPanel data={data} />
      </div>

      <ModelSelector params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} mlService={data.mlService} />

      <ForecastSummary data={data} />

      <EarlyWarning warnings={data.earlyWarnings} />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ForecastChart series={data.series} />
        </div>
        <ForecastQualityGauge score={data.forecastQuality.score} label={data.forecastQuality.label} />
      </div>

      <ForecastMetrics metrics={data.metrics} />

      <ModelComparison rows={data.comparison} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RegionalForecast regional={data.regional ?? []} />
        <ForecastCalendar calendar={data.calendar} />
      </div>

      <ForecastNarrative narrative={data.narrative} explain={data.explain} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecommendationEngine items={data.recommendations} />
        <ScenarioSimulator scenarios={data.scenarios} />
      </div>

      <ResidualAnalysis residuals={data.residuals} />

      <FeatureImportance items={data.featureImportance} />
    </div>
  )
}
