import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CasesService } from '../cases/cases.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AiService } from '../ai/ai.service';
import { GisService } from '../gis/gis.service';
import { ForecastService } from '../forecast/forecast.service';
import { buildPrintHtml, buildReportIntelligence, periodLabelFromQuery } from './report.engine';
import { addReportHistory, listReportHistory } from './report-history.store';
import {
  addAudit,
  bumpShareAccess,
  calcNextRun,
  createShareLink,
  deleteSchedule,
  getApproval,
  getShareByToken,
  hashPassword,
  listAudit,
  listLayouts,
  listSchedules,
  listVersions,
  saveApproval,
  saveLayout,
  saveSchedule,
  saveVersion,
} from './report-store';
import { ReportMailService } from './report-mail.service';

@Injectable()
export class ReportsService {
  constructor(
    private casesService: CasesService,
    private analyticsService: AnalyticsService,
    private aiService: AiService,
    private gisService: GisService,
    private forecastService: ForecastService,
    private mailService: ReportMailService,
  ) {}

  private async loadGisBundle(query: Record<string, string | undefined>) {
    const [stats, map, insights] = await Promise.all([
      this.gisService.getStats(query).catch(() => ({})),
      this.gisService.getMapData(query).catch(() => ({})),
      this.gisService.getInsights(query).catch(() => ({ insights: [] })),
    ]);
    const mapData = map as {
      total?: number;
      withGps?: number;
      points?: unknown[];
      kabupatenStats?: { name: string; count: number; aktif: number; selesai: number }[];
      clusters?: unknown[];
    };
    return {
      total: mapData.total ?? (stats as { totalMarker?: number }).totalMarker ?? 0,
      withGps: mapData.withGps ?? (stats as { gpsValid?: number }).gpsValid ?? 0,
      coverage: (stats as { coverage?: number }).coverage ?? 0,
      points: (mapData.points ?? []).slice(0, 200),
      kabupatenStats: mapData.kabupatenStats ?? [],
      clusters: mapData.clusters ?? [],
      insights: (insights as { insights?: string[] }).insights ?? [],
      topKabupaten: (mapData.kabupatenStats ?? []).slice(0, 8),
    };
  }

  async getIntelligence(query: Record<string, string | undefined>, createdBy?: string): Promise<Record<string, unknown>> {
    const reportId = query.reportId;
    const approval = reportId ? getApproval(reportId) : undefined;
    const versions = reportId ? listVersions(reportId) : [];
    const version = versions[0]?.version ?? query.version ?? '1.0';

    const [overview, trends, demographics, ai, gisStats, forecastRaw] = await Promise.all([
      this.analyticsService.getOverview(query),
      this.analyticsService.getTrends(query),
      this.analyticsService.getDemographics(query),
      this.aiService.getIntelligence(query),
      this.loadGisBundle(query),
      this.forecastService.getIntelligence({ ...query, horizon: '6', model: 'auto' }).catch(() => null),
    ]);

    const forecast = forecastRaw && !('insufficient' in forecastRaw && forecastRaw.insufficient)
      ? {
        model: (forecastRaw as { modelName?: string }).modelName,
        nextMonth: (forecastRaw as { nextMonth?: unknown }).nextMonth,
        nextQuarter: (forecastRaw as { nextQuarter?: number }).nextQuarter,
        metrics: (forecastRaw as { metrics?: unknown }).metrics,
        trendClass: (forecastRaw as { trendClass?: string }).trendClass,
        narrative: (forecastRaw as { narrative?: string }).narrative,
        series: (forecastRaw as { series?: unknown[] }).series?.slice(-9),
        confidenceLevel: (forecastRaw as { confidenceLevel?: number }).confidenceLevel,
      }
      : undefined;

    const report = buildReportIntelligence({
      query,
      overview,
      trends,
      demographics,
      ai,
      gisStats,
      forecast,
      createdBy,
      approval: approval ? {
        status: approval.status,
        reviewer: approval.reviewer,
        reviewedAt: approval.reviewedAt,
        note: approval.note,
        history: approval.history,
      } : undefined,
      version,
    });

    addAudit({
      action: 'view',
      user: createdBy ?? 'system',
      reportId: String(report.reportId),
      at: new Date().toISOString(),
    });

    return { ...report, versionHistory: versions.slice(0, 10) };
  }

  getHistory() {
    return listReportHistory();
  }

  getAudit() {
    return listAudit();
  }

  logExport(input: { createdBy: string; category: string; format: string; period: string; sizeKb: number; reportId?: string }) {
    addAudit({
      action: 'export',
      user: input.createdBy,
      reportId: input.reportId,
      format: input.format,
      at: new Date().toISOString(),
      detail: input.period,
    });
    return addReportHistory({
      id: `HIS-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
      category: input.category,
      format: input.format,
      period: input.period,
      sizeKb: input.sizeKb,
      version: '1.0',
      status: 'draft',
    });
  }

  listSchedules() {
    return listSchedules();
  }

  createSchedule(input: {
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'yearly';
    category: string;
    format: string;
    email: string;
    filters: Record<string, string>;
    createdBy: string;
  }) {
    const item = saveSchedule({
      id: `SCH-${Date.now().toString(36)}`,
      ...input,
      enabled: true,
      nextRun: calcNextRun(input.frequency),
      createdAt: new Date().toISOString(),
    });
    addAudit({ action: 'schedule_create', user: input.createdBy, at: new Date().toISOString(), detail: item.name });
    return item;
  }

  removeSchedule(id: string, user: string) {
    deleteSchedule(id);
    addAudit({ action: 'schedule_delete', user, at: new Date().toISOString(), detail: id });
    return { ok: true };
  }

  async runSchedule(id: string, user: string) {
    const sch = listSchedules().find((s) => s.id === id);
    if (!sch) throw new NotFoundException('Jadwal tidak ditemukan');

    const report = await this.getIntelligence({ ...sch.filters, category: sch.category }, user);
    const html = buildPrintHtml(report);
    await this.mailService.sendReportEmail({
      to: sch.email,
      subject: `[e-Insight] ${sch.name}`,
      body: `Laporan ${sch.category} periode ${periodLabelFromQuery(sch.filters)}.\n\nRingkasan:\n${(report.executiveSummary as string[])?.join('\n')}`,
      reportUrl: `/laporan?category=${sch.category}`,
    });

    sch.lastRun = new Date().toISOString();
    sch.nextRun = calcNextRun(sch.frequency);
    saveSchedule(sch);

    addAudit({ action: 'schedule_run', user, reportId: String(report.reportId), at: new Date().toISOString() });
    return { ok: true, reportId: report.reportId, emailed: sch.email };
  }

  listLayouts() {
    return listLayouts();
  }

  saveLayout(input: { id?: string; name: string; widgets: string[]; createdBy: string }) {
    const now = new Date().toISOString();
    return saveLayout({
      id: input.id ?? `LAY-${Date.now().toString(36)}`,
      name: input.name,
      widgets: input.widgets,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  getVersions(reportId: string) {
    return listVersions(reportId);
  }

  saveReportVersion(reportId: string, snapshot: Record<string, unknown>, createdBy: string, note?: string) {
    const existing = listVersions(reportId);
    const nextVer = existing.length
      ? `v1.${existing.length}`
      : 'v1.0';
    const item = saveVersion({
      id: `VER-${Date.now().toString(36)}`,
      reportId,
      version: nextVer,
      snapshot,
      createdBy,
      createdAt: new Date().toISOString(),
      note,
    });
    addAudit({ action: 'version_save', user: createdBy, reportId, at: new Date().toISOString(), detail: nextVer });
    return item;
  }

  updateApproval(reportId: string, action: 'submit' | 'approve' | 'reject' | 'publish', user: string, note?: string) {
    const current = getApproval(reportId);
    const transitions: Record<string, { status: typeof current.status; note: string }> = {
      submit: { status: 'review', note: note ?? 'Diajukan untuk review' },
      approve: { status: 'approved', note: note ?? 'Disetujui' },
      reject: { status: 'draft', note: note ?? 'Dikembalikan ke draft' },
      publish: { status: 'published', note: note ?? 'Dipublikasikan' },
    };
    const next = transitions[action];
    if (!next) throw new NotFoundException('Aksi tidak valid');

    const record = {
      reportId,
      status: next.status,
      reviewer: ['approve', 'reject', 'publish'].includes(action) ? user : current.reviewer,
      reviewedAt: ['approve', 'reject', 'publish'].includes(action) ? new Date().toISOString() : current.reviewedAt,
      note: next.note,
      history: [
        ...(current.history ?? []),
        { status: next.status, by: user, at: new Date().toISOString(), note: next.note },
      ],
    };
    saveApproval(record);
    addAudit({ action: `approval_${action}`, user, reportId, at: new Date().toISOString() });
    return record;
  }

  createShare(input: {
    reportId: string;
    password?: string;
    permission: 'read' | 'edit';
    watermark: string;
    expiresInDays: number;
    createdBy: string;
  }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
    const link = createShareLink({
      reportId: input.reportId,
      passwordHash: input.password ? hashPassword(input.password) : undefined,
      permission: input.permission,
      watermark: input.watermark,
      expiresAt: expiresAt.toISOString(),
      createdBy: input.createdBy,
    });
    addAudit({ action: 'share_create', user: input.createdBy, reportId: input.reportId, at: new Date().toISOString() });
    return link;
  }

  async accessShare(token: string, password?: string) {
    const link = getShareByToken(token);
    if (!link) throw new NotFoundException('Link tidak ditemukan');
    if (new Date(link.expiresAt) < new Date()) throw new UnauthorizedException('Link kedaluwarsa');
    if (link.passwordHash && hashPassword(password ?? '') !== link.passwordHash) {
      throw new UnauthorizedException('Password salah');
    }
    bumpShareAccess(token);
    const report = await this.getIntelligence({ reportId: link.reportId, watermark: link.watermark }, 'share_guest');
    return { report, permission: link.permission, watermark: link.watermark, expiresAt: link.expiresAt };
  }

  getEmailQueue() {
    return this.mailService.getQueue();
  }

  async exportExcel(query: Record<string, string | undefined>) {
    const report = await this.getIntelligence(query);
    const rows = [
      ['e-Insight Report', String(report.reportId)],
      ['Periode', String(report.periodLabel)],
      ['Total', (report.kpi as { total: number }).total],
      ['Aktif', (report.kpi as { aktif: number }).aktif],
      ['Selesai', (report.kpi as { selesai: number }).selesai],
      ['Completion Rate', `${(report.kpi as { completionRate: number }).completionRate}%`],
      [],
      ['Kabupaten', 'Jumlah'],
      ...((report.tables as { kabupaten: { name: string; count: number }[] }).kabupaten ?? []).map((r) => [r.name, r.count]),
      [],
      ['Jenis Kekerasan', 'Jumlah'],
      ...((report.tables as { jenis: { name: string; count: number }[] }).jenis ?? []).map((r) => [r.name, r.count]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportJson(query: Record<string, string | undefined>) {
    const report = await this.getIntelligence(query);
    return JSON.stringify(report, null, 2);
  }

  async exportHtml(query: Record<string, string | undefined>) {
    const report = await this.getIntelligence(query);
    return buildPrintHtml(report);
  }

  async exportWord(query: Record<string, string | undefined>) {
    return this.exportHtml(query);
  }

  periodLabel(query: Record<string, string | undefined>) {
    return periodLabelFromQuery(query);
  }
}
