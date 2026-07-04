import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { applyCaseFilters, parseCaseFilters } from '../../common/case-filters';
import { buildIntelligence, type AiIntelligenceResponse } from './ai-intelligence.engine';
import { AiLlmService } from './ai-llm.service';

type Insight = {
  type: string;
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'success';
};

const EMPTY_INTEL = {
  generatedAt: new Date().toISOString(),
  totalCases: 0,
  aktif: 0,
  selesai: 0,
  completionRate: 0,
  decisionScore: 0,
  yoyGrowthPct: 0,
  executiveSummary: ['Tidak ada data untuk filter saat ini.'],
  narrative: '',
  executiveBrief: 'Tidak ada data.',
  roleInsight: '',
  insightCards: [],
  rootCause: { factors: [], confidence: 0 },
  riskMatrix: [],
  hotspotPrediction: [],
  priorities: [],
  recommendations: [],
  scenarios: [],
  actionPlan: [],
  timeline: [],
  correlations: [],
  anomalies: [],
  chartData: { trendByYear: [], trendByMonth: [], riskGauge: 0, priorityBars: [], jenisDistribution: [] },
};

@Injectable()
export class AiService {
  constructor(
    private supabase: SupabaseService,
    private llm: AiLlmService,
  ) {}

  private async loadCases(query: Record<string, string | undefined>) {
    const filters = parseCaseFilters(query);
    const db = this.supabase.db;
    if (!db) return [];

    const { data } = await db
      .from('cases')
      .select('tahun, tanggal, status, jenis_kelamin, usia, jenis_kekerasan, kabupaten, kecamatan, psikolog_nama, lama_pendampingan, kategori, outcome, catatan')
      .order('tanggal', { ascending: true });

    return applyCaseFilters(data ?? [], filters);
  }

  async getIntelligence(query: Record<string, string | undefined>): Promise<AiIntelligenceResponse & { llmAvailable: boolean }> {
    const cases = await this.loadCases(query);
    const role = query.role || 'direktur';
    if (!cases.length) return { ...EMPTY_INTEL, llmAvailable: this.llm.isEnabled() };
    const intel = buildIntelligence(cases, role);
    return { ...intel, llmAvailable: this.llm.isEnabled() };
  }

  async getLlmNarrative(query: Record<string, string | undefined>) {
    const cases = await this.loadCases(query);
    const role = query.role || 'direktur';
    if (!cases.length) {
      return { ...await this.llm.generateNarrative(EMPTY_INTEL as ReturnType<typeof buildIntelligence>, role), source: 'empty' };
    }
    const intel = buildIntelligence(cases, role);
    const llm = await this.llm.generateNarrative(intel, role);
    return { ...llm, source: 'hybrid', generatedAt: new Date().toISOString() };
  }

  async chat(query: Record<string, string | undefined>, message: string) {
    const cases = await this.loadCases(query);
    const role = query.role || 'direktur';
    const intel = cases.length ? buildIntelligence(cases, role) : (EMPTY_INTEL as ReturnType<typeof buildIntelligence>);
    return this.llm.chat(intel, role, message);
  }

  getLlmStatus() {
    return this.llm.getStatus();
  }

  async getInsights(query: Record<string, string | undefined>) {
    const intel = await this.getIntelligence(query);
    const insights: Insight[] = intel.insightCards.map((c) => ({
      type: c.category,
      title: c.title,
      content: c.content,
      severity: c.severity === 'critical' || c.severity === 'high' ? 'warning' : c.severity === 'low' ? 'success' : 'info',
    }));
    return { insights, generatedAt: intel.generatedAt, totalCases: intel.totalCases };
  }
}
