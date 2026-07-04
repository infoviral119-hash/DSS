import type { Env } from './shared'
import { dbClient } from './shared'
import { applyCaseFilters, countByField, parseCaseFilters } from './case-filters'
import { generateNarrative, chatLlm, getLlmStatus, isLlmEnabled } from './ai-llm'

type CaseRow = Record<string, unknown>

async function loadCases(env: Env, query: Record<string, string | undefined>) {
  const filters = parseCaseFilters(query)
  const db = dbClient(env)
  const { data } = await db
    .from('cases')
    .select('tahun, tanggal, status, jenis_kelamin, usia, jenis_kekerasan, kabupaten, kecamatan, psikolog_nama, lama_pendampingan, kategori, outcome, catatan')
    .order('tanggal', { ascending: true })
  return applyCaseFilters(data ?? [], filters)
}

function buildIntelligence(cases: CaseRow[], role: string) {
  const total = cases.length
  const aktif = cases.filter((c) => c.status !== 'Selesai').length
  const selesai = cases.filter((c) => c.status === 'Selesai').length
  const completionRate = total > 0 ? Math.round((selesai / total) * 100) : 0
  const byYear = new Map<number, number>()
  const byMonth = new Map<string, number>()
  for (const c of cases) {
    const y = (c.tahun as number) ?? new Date(String(c.tanggal)).getFullYear()
    byYear.set(y, (byYear.get(y) ?? 0) + 1)
    const m = String(c.tanggal).slice(0, 7)
    byMonth.set(m, (byMonth.get(m) ?? 0) + 1)
  }
  const years = [...byYear.keys()].sort()
  const yoyGrowthPct = years.length >= 2
    ? Math.round(((byYear.get(years[years.length - 1])! - byYear.get(years[years.length - 2])!) / Math.max(byYear.get(years[years.length - 2])!, 1)) * 100)
    : 0
  const topKab = countByField(cases, 'kabupaten', 5)
  const topJenis = countByField(cases, 'jenis_kekerasan', 5)
  const decisionScore = Math.min(100, Math.round(completionRate * 0.4 + (100 - Math.min(aktif / Math.max(total, 1) * 100, 100)) * 0.3 + Math.min(yoyGrowthPct + 50, 100) * 0.3))
  const executiveSummary = [
    `Total ${total} kasus, ${aktif} aktif, ${selesai} selesai (${completionRate}%).`,
    topKab[0] ? `Wilayah prioritas: ${topKab[0].name} (${topKab[0].count} kasus).` : '',
    topJenis[0] ? `Dominasi jenis: ${topJenis[0].name}.` : '',
  ].filter(Boolean)
  const insightCards = [
    { id: 'trend-1', category: 'trend' as const, title: 'Tren Kasus', content: `Pertumbuhan YoY ${yoyGrowthPct}%`, severity: yoyGrowthPct > 15 ? 'high' as const : 'medium' as const, confidence: 75 },
    { id: 'risk-1', category: 'risk' as const, title: 'Kasus Aktif', content: `${aktif} kasus masih berjalan`, severity: aktif > total * 0.5 ? 'high' as const : 'medium' as const, confidence: 80 },
    { id: 'rec-1', category: 'recommendation' as const, title: 'Rekomendasi', content: completionRate < 70 ? 'Percepat penyelesaian kasus aktif' : 'Pertahankan kinerja penyelesaian', severity: 'medium' as const, confidence: 70 },
  ]
  return {
    generatedAt: new Date().toISOString(),
    totalCases: total, aktif, selesai, completionRate, decisionScore, yoyGrowthPct,
    executiveSummary,
    narrative: executiveSummary.join(' '),
    executiveBrief: executiveSummary[0] ?? '',
    roleInsight: role === 'direktur' ? `Skor keputusan: ${decisionScore}/100` : `Fokus operasional: ${aktif} kasus aktif`,
    insightCards,
    rootCause: { factors: topJenis.slice(0, 3).map((j) => ({ text: j.name, confidence: 70 })), confidence: 70 },
    riskMatrix: topKab.slice(0, 3).map((k) => ({ name: k.name, score: Math.min(100, k.count * 5), level: k.count > 10 ? 'high' : 'medium', factors: ['volume kasus'] })),
    hotspotPrediction: topKab.slice(0, 3).map((k) => ({ name: k.name, growthPct: yoyGrowthPct })),
    priorities: topKab.map((k, i) => ({ rank: i + 1, name: k.name, score: k.count, caseCount: k.count, trendPct: yoyGrowthPct, completionRate, explain: ['volume tinggi'] })),
    recommendations: [{ title: 'Prioritas Wilayah', actions: [`Fokus di ${topKab[0]?.name ?? 'wilayah utama'}`], priority: 'high' as const, confidence: 75, why: ['volume tertinggi'] }],
    scenarios: [{ label: 'Baseline', before: String(total), after: String(Math.round(total * 1.05)), delta: '+5%' }],
    actionPlan: [{ phase: '30 hari', items: ['Review kasus aktif', 'Koordinasi psikolog'] }],
    timeline: years.map((y) => ({ year: y, label: String(y), count: byYear.get(y)! })),
    correlations: [],
    anomalies: [],
    chartData: {
      trendByYear: years.map((y) => ({ year: y, count: byYear.get(y)! })),
      trendByMonth: [...byMonth.entries()].sort().slice(-12).map(([month, count]) => ({ month, count })),
      riskGauge: decisionScore,
      priorityBars: topKab.map((k) => ({ name: k.name, score: k.count })),
      jenisDistribution: topJenis.map((j) => ({ name: j.name, value: j.count })),
    },
  }
}

const EMPTY = {
  generatedAt: new Date().toISOString(), totalCases: 0, aktif: 0, selesai: 0, completionRate: 0,
  decisionScore: 0, yoyGrowthPct: 0, executiveSummary: ['Tidak ada data untuk filter saat ini.'],
  narrative: '', executiveBrief: 'Tidak ada data.', roleInsight: '', insightCards: [],
  rootCause: { factors: [], confidence: 0 }, riskMatrix: [], hotspotPrediction: [], priorities: [],
  recommendations: [], scenarios: [], actionPlan: [], timeline: [], correlations: [], anomalies: [],
  chartData: { trendByYear: [], trendByMonth: [], riskGauge: 0, priorityBars: [], jenisDistribution: [] },
}

export async function getIntelligence(env: Env, query: Record<string, string | undefined>) {
  const cases = await loadCases(env, query)
  const role = query.role || 'direktur'
  const llmAvailable = isLlmEnabled(env)
  if (!cases.length) return { ...EMPTY, llmAvailable }
  return { ...buildIntelligence(cases, role), llmAvailable }
}

export async function getLlmNarrative(env: Env, query: Record<string, string | undefined>) {
  const cases = await loadCases(env, query)
  const role = query.role || 'direktur'
  const intel = cases.length ? buildIntelligence(cases, role) : EMPTY
  if (!cases.length) {
    return { ...await generateNarrative(env, intel, role), source: 'empty', generatedAt: new Date().toISOString() }
  }
  const llm = await generateNarrative(env, intel, role)
  return { ...llm, source: isLlmEnabled(env) ? 'hybrid' : 'rules', generatedAt: new Date().toISOString() }
}

export async function getLlmStatusHandler(env: Env) {
  return getLlmStatus(env)
}

export async function chat(env: Env, query: Record<string, string | undefined>, message: string) {
  const cases = await loadCases(env, query)
  const role = query.role || 'direktur'
  const intel = cases.length ? buildIntelligence(cases, role) : EMPTY
  if (isLlmEnabled(env)) {
    return { ...await chatLlm(env, intel, role, message), llmAvailable: true }
  }
  return {
    reply: `Berdasarkan ${intel.totalCases} kasus: ${intel.executiveBrief} Pertanyaan Anda: "${message}"`,
    source: 'rules',
    llmAvailable: false,
  }
}

export async function getInsights(env: Env, query: Record<string, string | undefined>) {
  const intel = await getIntelligence(env, query)
  return {
    insights: intel.insightCards.map((c) => ({
      type: c.category, title: c.title, content: c.content,
      severity: c.severity === 'high' || c.severity === 'critical' ? 'warning' : c.severity === 'low' ? 'success' : 'info',
    })),
    generatedAt: intel.generatedAt,
    totalCases: intel.totalCases,
  }
}
