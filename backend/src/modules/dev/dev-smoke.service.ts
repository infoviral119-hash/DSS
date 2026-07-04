import { Injectable } from '@nestjs/common';
import { CasesService } from '../cases/cases.service';
import { ForecastService } from '../forecast/forecast.service';
import { ReportsService } from '../reports/reports.service';
import { AiService } from '../ai/ai.service';
import { GisService } from '../gis/gis.service';
import { ForecastMlClient } from '../forecast/forecast-ml.client';
import { ReportMailService } from '../reports/report-mail.service';

@Injectable()
export class DevSmokeService {
  constructor(
    private cases: CasesService,
    private forecast: ForecastService,
    private reports: ReportsService,
    private ai: AiService,
    private gis: GisService,
    private ml: ForecastMlClient,
    private mail: ReportMailService,
  ) {}

  async run() {
    const checks: { name: string; ok: boolean; detail?: unknown; error?: string }[] = [];

    const run = async (name: string, fn: () => Promise<unknown>) => {
      try {
        const detail = await fn();
        checks.push({ name, ok: true, detail });
      } catch (err) {
        checks.push({ name, ok: false, error: String(err) });
      }
    };

    await run('cases.stats', async () => this.cases.getStats({}));
    await run('analytics.overview', async () => {
      const s = await this.cases.getStats({});
      return { total: s.total, connected: s.connected };
    });
    await run('forecast.intelligence', async () => {
      const d = await this.forecast.getIntelligence({ model: 'auto', horizon: '6' });
      if ((d as { insufficient?: boolean }).insufficient && !(d as { series?: unknown[] }).series?.length) {
        throw new Error((d as { message?: string }).message ?? 'insufficient');
      }
      return { model: (d as { modelName?: string }).modelName, ml: (d as { mlService?: unknown }).mlService };
    });
    await run('forecast.lstm', async () => {
      const d = await this.forecast.getIntelligence({ model: 'lstm', horizon: '3' });
      if ((d as { insufficient?: boolean }).insufficient) throw new Error((d as { message?: string }).message);
      return { model: (d as { model?: string }).model };
    });
    await run('forecast.hybrid', async () => {
      const d = await this.forecast.getIntelligence({ model: 'hybrid', horizon: '3' });
      if ((d as { insufficient?: boolean }).insufficient) throw new Error((d as { message?: string }).message);
      return { model: (d as { model?: string }).model };
    });
    await run('reports.intelligence', async () => {
      const d = await this.reports.getIntelligence({ category: 'executive' }, 'smoke');
      return { reportId: d.reportId, kpi: (d.kpi as { total: number }).total };
    });
    await run('ai.intelligence', async () => {
      const d = await this.ai.getIntelligence({ role: 'direktur' });
      return { score: d.decisionScore, cards: d.insightCards?.length ?? 0 };
    });
    await run('gis.stats', async () => this.gis.getStats({}));
    await run('ml.status', async () => this.ml.getStatus());
    await run('email.webhook', async () => {
      const q = await this.mail.sendReportEmail({
        to: 'smoke@e-insight.local',
        subject: '[Smoke] Laporan Test',
        body: 'E2E dev smoke test',
        reportUrl: '/laporan',
      });
      return { status: q.status, id: q.id };
    });
    await run('reports.schedule', async () => {
      const sch = this.reports.createSchedule({
        name: 'Smoke Weekly',
        frequency: 'weekly',
        category: 'executive',
        format: 'pdf',
        email: 'smoke@e-insight.local',
        filters: {},
        createdBy: 'smoke',
      });
      const run = await this.reports.runSchedule(sch.id, 'smoke');
      this.reports.removeSchedule(sch.id, 'smoke');
      return run;
    });

    const passed = checks.filter((c) => c.ok).length;
    return {
      summary: { passed, total: checks.length, allOk: passed === checks.length },
      checks,
      at: new Date().toISOString(),
    };
  }
}
