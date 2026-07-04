import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiIntelligenceResponse } from './ai-intelligence.engine';

export interface LlmNarrativeResult {
  enabled: boolean;
  provider: string;
  model: string;
  confidence: number;
  executiveSummary: string[];
  narrative: string;
  executiveBrief: string;
  strategicRecommendations: string[];
  riskAssessment: string;
  actionPriority: string;
  error?: string;
}

@Injectable()
export class AiLlmService {
  constructor(private config: ConfigService) {}

  isEnabled() {
    const key = this.config.get<string>('OPENAI_API_KEY') || this.config.get<string>('AI_API_KEY');
    const forced = this.config.get<string>('AI_LLM_ENABLED');
    if (forced === 'false') return false;
    return Boolean(key);
  }

  private getConfig() {
    const apiKey = this.config.get<string>('OPENAI_API_KEY') || this.config.get<string>('AI_API_KEY') || '';
    const baseUrl = (this.config.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = this.config.get<string>('AI_MODEL') || 'gpt-4o-mini';
    const provider = this.config.get<string>('AI_PROVIDER') || 'openai';
    return { apiKey, baseUrl, model, provider };
  }

  private buildContext(intel: AiIntelligenceResponse, role: string) {
    return {
      role,
      totalCases: intel.totalCases,
      aktif: intel.aktif,
      selesai: intel.selesai,
      completionRate: intel.completionRate,
      decisionScore: intel.decisionScore,
      yoyGrowthPct: intel.yoyGrowthPct,
      executiveSummary: intel.executiveSummary,
      narrative: intel.narrative,
      rootCause: intel.rootCause,
      topRisks: intel.riskMatrix.slice(0, 5),
      priorities: intel.priorities.slice(0, 5),
      hotspotPrediction: intel.hotspotPrediction,
      recommendations: intel.recommendations,
      scenarios: intel.scenarios,
      correlations: intel.correlations,
      anomalies: intel.anomalies,
      timeline: intel.timeline,
      jenisDistribution: intel.chartData.jenisDistribution.slice(0, 6),
    };
  }

  getStatus() {
    const { provider, model } = this.getConfig();
    return { enabled: this.isEnabled(), provider, model };
  }

  async generateNarrative(intel: AiIntelligenceResponse, role: string): Promise<LlmNarrativeResult> {
    const { apiKey, baseUrl, model, provider } = this.getConfig();
    if (!this.isEnabled()) {
      return {
        enabled: false,
        provider,
        model,
        confidence: 0,
        executiveSummary: intel.executiveSummary,
        narrative: intel.narrative,
        executiveBrief: intel.executiveBrief,
        strategicRecommendations: intel.recommendations.flatMap((r) => r.actions).slice(0, 5),
        riskAssessment: intel.riskMatrix[0]
          ? `Wilayah ${intel.riskMatrix[0].name} risk score ${intel.riskMatrix[0].score} (${intel.riskMatrix[0].level}).`
          : '',
        actionPriority: intel.priorities[0]?.name ?? '',
      };
    }

    const systemPrompt = `Anda adalah analis kebijakan Decision Support System untuk perlindungan perempuan dan anak di Indonesia.
Tugas: ubah data analitik menjadi narasi eksekutif Bahasa Indonesia yang jelas, transparan, dan actionable.
JANGAN mengarang angka di luar data yang diberikan. Setiap klaim harus merujuk data konteks.
Output HARUS JSON valid dengan struktur:
{
  "confidence": number (0-100),
  "executiveSummary": string[] (4-6 kalimat ringkas),
  "narrative": string (paragraf analisis 150-250 kata),
  "executiveBrief": string (laporan 1 halaman untuk pimpinan),
  "strategicRecommendations": string[] (5-8 rekomendasi konkret),
  "riskAssessment": string (2-3 kalimat),
  "actionPriority": string (wilayah/tindakan prioritas utama)
}`;

    const userPrompt = `Konteks analitik (rule-based engine):\n${JSON.stringify(this.buildContext(intel, role), null, 2)}\n\nBuat narasi decision intelligence untuk role: ${role}.`;

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LLM ${res.status}: ${errText.slice(0, 200)}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error('LLM response kosong');

      const parsed = JSON.parse(content) as Partial<LlmNarrativeResult>;
      return {
        enabled: true,
        provider,
        model,
        confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 80)),
        executiveSummary: parsed.executiveSummary?.length ? parsed.executiveSummary : intel.executiveSummary,
        narrative: parsed.narrative || intel.narrative,
        executiveBrief: parsed.executiveBrief || intel.executiveBrief,
        strategicRecommendations: parsed.strategicRecommendations?.length
          ? parsed.strategicRecommendations
          : intel.recommendations.flatMap((r) => r.actions).slice(0, 5),
        riskAssessment: parsed.riskAssessment || '',
        actionPriority: parsed.actionPriority || intel.priorities[0]?.name || '',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'LLM error';
      return {
        enabled: true,
        provider,
        model,
        confidence: intel.rootCause.confidence,
        executiveSummary: intel.executiveSummary,
        narrative: intel.narrative,
        executiveBrief: intel.executiveBrief,
        strategicRecommendations: intel.recommendations.flatMap((r) => r.actions).slice(0, 5),
        riskAssessment: '',
        actionPriority: intel.priorities[0]?.name ?? '',
        error: msg,
      };
    }
  }

  async chat(
    intel: AiIntelligenceResponse,
    role: string,
    message: string,
  ): Promise<{ reply: string; error?: string }> {
    const { apiKey, baseUrl, model } = this.getConfig();
    if (!this.isEnabled()) {
      return { reply: 'LLM belum dikonfigurasi. Set OPENAI_API_KEY di environment backend.', error: 'not_configured' };
    }

    const systemPrompt = `Anda adalah asisten Decision Intelligence e-Insight. Jawab dalam Bahasa Indonesia, ringkas dan berbasis data.
Konteks data saat ini:\n${JSON.stringify(this.buildContext(intel, role))}
Jangan mengarang angka. Jika data tidak cukup, katakan secara jujur.`;

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.5,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
        }),
      });

      if (!res.ok) throw new Error(`LLM ${res.status}`);
      const json = await res.json();
      const reply = json.choices?.[0]?.message?.content || 'Tidak ada respons.';
      return { reply };
    } catch (err) {
      return { reply: 'Gagal menghubungi LLM.', error: err instanceof Error ? err.message : 'error' };
    }
  }
}
