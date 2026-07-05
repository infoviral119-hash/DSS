import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAiIntelligence } from '@/features/ai-insight/hooks/useAiIntelligence'
import { ExecutiveSummary } from '@/features/ai-insight/components/ExecutiveSummary'
import { DecisionScore } from '@/features/ai-insight/components/DecisionScore'
import { InsightCards } from '@/features/ai-insight/components/InsightCards'
import { RootCauseAnalysis } from '@/features/ai-insight/components/RootCauseAnalysis'
import { RiskAnalysis } from '@/features/ai-insight/components/RiskAnalysis'
import { PriorityRanking, RecommendationEngine } from '@/features/ai-insight/components/RecommendationEngine'
import { NarrativeGenerator } from '@/features/ai-insight/components/NarrativeGenerator'
import { ScenarioSimulator } from '@/features/ai-insight/components/ScenarioSimulator'
import { ActionPlanGenerator } from '@/features/ai-insight/components/ActionPlanGenerator'
import { AiCharts } from '@/features/ai-insight/components/AiCharts'
import { CorrelationAnalysis, AnomalyDetector, AiTimeline, HotspotPrediction } from '@/features/ai-insight/components/CorrelationAnalysis'
import { ExecutiveBriefButton } from '@/features/ai-insight/components/ExecutiveBriefButton'
import { LlmNarrativePanel } from '@/features/ai-insight/components/LlmNarrativePanel'

export function AIInsightPage() {
  const { data, isLoading, isError } = useAiIntelligence()
  const [brief, setBrief] = useState('')

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Menganalisis data...
      </div>
    )
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Gagal memuat AI Insight. Pastikan backend berjalan.</p>
  }

  const exportBrief = brief || data.executiveBrief

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Decision Intelligence · {data.totalCases} kasus · {new Date(data.generatedAt).toLocaleString('id-ID')}
          {data.llmAvailable && <span className="ml-2 text-violet-600">· LLM aktif</span>}
        </p>
        <ExecutiveBriefButton brief={exportBrief} />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ExecutiveSummary lines={data.executiveSummary} />
        </div>
        <DecisionScore score={data.decisionScore} />
      </div>

      <InsightCards cards={data.insightCards} />

      <LlmNarrativePanel fallbackBrief={data.executiveBrief} llmAvailable={data.llmAvailable} onBriefUpgrade={setBrief} />

      <NarrativeGenerator narrative={data.narrative} roleInsight={data.roleInsight} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RootCauseAnalysis factors={data.rootCause.factors} confidence={data.rootCause.confidence} />
        <RiskAnalysis items={data.riskMatrix} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HotspotPrediction items={data.hotspotPrediction} />
        <PriorityRanking items={data.priorities} />
        <AiTimeline timeline={data.timeline} />
      </div>

      <AiCharts data={data.chartData} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecommendationEngine items={data.recommendations} />
        <ScenarioSimulator scenarios={data.scenarios} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CorrelationAnalysis items={data.correlations} />
        <AnomalyDetector items={data.anomalies} />
      </div>

      <ActionPlanGenerator plan={data.actionPlan} />
    </div>
  )
}
