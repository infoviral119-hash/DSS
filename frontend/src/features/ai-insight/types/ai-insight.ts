export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface InsightCard {
  id: string
  category: 'trend' | 'root_cause' | 'risk' | 'prediction' | 'recommendation' | 'priority'
  title: string
  content: string
  severity: Severity
  confidence: number
  problem?: string
  analysis?: string
  risk?: string
  recommendation?: string
}

export interface RiskItem {
  name: string
  score: number
  level: Severity
  factors: string[]
}

export interface PriorityItem {
  rank: number
  name: string
  score: number
  caseCount: number
  trendPct: number
  completionRate: number
  explain: string[]
}

export interface RecommendationItem {
  title: string
  actions: string[]
  priority: Severity
  confidence: number
  why: string[]
}

export interface ScenarioItem {
  label: string
  before: string
  after: string
  delta: string
}

export interface CorrelationItem {
  label: string
  correlation: number
  description: string
}

export interface AnomalyItem {
  period: string
  count: number
  expected: number
  severity: Severity
  description: string
}

export interface LlmNarrativeResult {
  enabled: boolean
  provider: string
  model: string
  confidence: number
  executiveSummary: string[]
  narrative: string
  executiveBrief: string
  strategicRecommendations: string[]
  riskAssessment: string
  actionPriority: string
  error?: string
  source?: string
  generatedAt?: string
}

export interface AiIntelligenceResponse {
  generatedAt: string
  totalCases: number
  aktif: number
  selesai: number
  completionRate: number
  decisionScore: number
  yoyGrowthPct: number
  executiveSummary: string[]
  narrative: string
  executiveBrief: string
  roleInsight: string
  insightCards: InsightCard[]
  rootCause: { factors: { text: string; confidence: number }[]; confidence: number }
  riskMatrix: RiskItem[]
  hotspotPrediction: { name: string; growthPct: number }[]
  priorities: PriorityItem[]
  recommendations: RecommendationItem[]
  scenarios: ScenarioItem[]
  actionPlan: { phase: string; items: string[] }[]
  timeline: { year: number; label: string; count: number }[]
  correlations: CorrelationItem[]
  anomalies: AnomalyItem[]
  chartData: {
    trendByYear: { year: number; count: number }[]
    trendByMonth: { month: string; count: number }[]
    riskGauge: number
    priorityBars: { name: string; score: number }[]
    jenisDistribution: { name: string; value: number }[]
  }
  llmAvailable?: boolean
}
