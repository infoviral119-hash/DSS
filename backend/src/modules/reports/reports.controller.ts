import { Controller, Get, Post, Delete, Query, Res, Body, Req, Param } from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../auth/public.decorator';
import { CasesService } from '../cases/cases.service';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private casesService: CasesService,
    private reportsService: ReportsService,
  ) {}

  private buildCsv(data: Record<string, unknown>[]) {
    const headers = [
      'nomor_register', 'tanggal', 'nama_korban', 'jenis_kelamin', 'usia',
      'jenis_kekerasan', 'kabupaten', 'kecamatan', 'kelurahan', 'status',
      'psikolog_nama', 'tahun', 'kategori',
    ];
    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return '\uFEFF' + [headers.join(','), ...data.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
  }

  private userName(req: Request) {
    const user = (req as Request & { user?: { name?: string; email?: string } }).user;
    return user?.name ?? user?.email ?? 'operator';
  }

  @Get('intelligence')
  getIntelligence(@Query() query: Record<string, string | undefined>, @Req() req: Request) {
    return this.reportsService.getIntelligence(query, this.userName(req));
  }

  @Get('history')
  getHistory() {
    return this.reportsService.getHistory();
  }

  @Get('audit')
  getAudit() {
    return this.reportsService.getAudit();
  }

  @Post('history/log')
  logExport(
    @Body() body: { category?: string; format?: string; sizeKb?: number; reportId?: string },
    @Query() query: Record<string, string | undefined>,
    @Req() req: Request,
  ) {
    return this.reportsService.logExport({
      createdBy: this.userName(req),
      category: body.category ?? query.category ?? 'executive',
      format: body.format ?? 'pdf',
      period: this.reportsService.periodLabel(query),
      sizeKb: body.sizeKb ?? 0,
      reportId: body.reportId,
    });
  }

  @Get('schedules')
  listSchedules() {
    return this.reportsService.listSchedules();
  }

  @Post('schedules')
  createSchedule(
    @Body() body: {
      name: string;
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'yearly';
      category: string;
      format: string;
      email: string;
      filters?: Record<string, string>;
    },
    @Req() req: Request,
  ) {
    return this.reportsService.createSchedule({ ...body, filters: body.filters ?? {}, createdBy: this.userName(req) });
  }

  @Delete('schedules/:id')
  deleteSchedule(@Param('id') id: string, @Req() req: Request) {
    return this.reportsService.removeSchedule(id, this.userName(req));
  }

  @Post('schedules/:id/run')
  runSchedule(@Param('id') id: string, @Req() req: Request) {
    return this.reportsService.runSchedule(id, this.userName(req));
  }

  @Get('email-queue')
  emailQueue() {
    return this.reportsService.getEmailQueue();
  }

  @Get('layouts')
  listLayouts() {
    return this.reportsService.listLayouts();
  }

  @Post('layouts')
  saveLayout(@Body() body: { id?: string; name: string; widgets: string[] }, @Req() req: Request) {
    return this.reportsService.saveLayout({ ...body, createdBy: this.userName(req) });
  }

  @Get('versions/:reportId')
  getVersions(@Param('reportId') reportId: string) {
    return this.reportsService.getVersions(reportId);
  }

  @Post('versions/:reportId')
  saveVersion(
    @Param('reportId') reportId: string,
    @Body() body: { snapshot: Record<string, unknown>; note?: string },
    @Req() req: Request,
  ) {
    return this.reportsService.saveReportVersion(reportId, body.snapshot, this.userName(req), body.note);
  }

  @Post('approval/:reportId')
  updateApproval(
    @Param('reportId') reportId: string,
    @Body() body: { action: 'submit' | 'approve' | 'reject' | 'publish'; note?: string },
    @Req() req: Request,
  ) {
    return this.reportsService.updateApproval(reportId, body.action, this.userName(req), body.note);
  }

  @Post('share')
  createShare(
    @Body() body: {
      reportId: string;
      password?: string;
      permission: 'read' | 'edit';
      watermark: string;
      expiresInDays: number;
    },
    @Req() req: Request,
  ) {
    return this.reportsService.createShare({ ...body, createdBy: this.userName(req) });
  }

  @Public()
  @Get('share/:token')
  accessShare(@Param('token') token: string, @Query('password') password?: string) {
    return this.reportsService.accessShare(token, password);
  }

  @Get('export')
  async exportCsv(@Query() query: Record<string, string | undefined>, @Res() res: Response, @Req() req: Request) {
    const { data } = await this.casesService.findAll({ ...query, limit: '5000' });
    const csv = this.buildCsv(data);
    this.reportsService.logExport({
      createdBy: this.userName(req),
      category: query.category ?? 'case',
      format: 'csv',
      period: this.reportsService.periodLabel(query),
      sizeKb: Math.round(csv.length / 1024),
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-kasus-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('export/excel')
  async exportExcel(@Query() query: Record<string, string | undefined>, @Res() res: Response, @Req() req: Request) {
    const buf = await this.reportsService.exportExcel(query);
    this.reportsService.logExport({
      createdBy: this.userName(req),
      category: query.category ?? 'executive',
      format: 'excel',
      period: this.reportsService.periodLabel(query),
      sizeKb: Math.round(buf.length / 1024),
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-${Date.now()}.xlsx"`);
    res.send(buf);
  }

  @Get('export/json')
  async exportJson(@Query() query: Record<string, string | undefined>, @Res() res: Response, @Req() req: Request) {
    const json = await this.reportsService.exportJson(query);
    this.reportsService.logExport({
      createdBy: this.userName(req),
      category: query.category ?? 'executive',
      format: 'json',
      period: this.reportsService.periodLabel(query),
      sizeKb: Math.round(json.length / 1024),
    });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-${Date.now()}.json"`);
    res.send(json);
  }

  @Get('export/html')
  async exportHtml(@Query() query: Record<string, string | undefined>, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(await this.reportsService.exportHtml(query));
  }

  @Get('export/word')
  async exportWord(@Query() query: Record<string, string | undefined>, @Res() res: Response, @Req() req: Request) {
    const html = await this.reportsService.exportWord(query);
    this.reportsService.logExport({
      createdBy: this.userName(req),
      category: query.category ?? 'executive',
      format: 'word',
      period: this.reportsService.periodLabel(query),
      sizeKb: Math.round(html.length / 1024),
    });
    res.setHeader('Content-Type', 'application/msword; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-${Date.now()}.doc"`);
    res.send(html);
  }

  @Post('powerbi-sync')
  async syncPowerBiCsv() {
    const { data } = await this.casesService.findAll({ limit: '5000' });
    const csv = this.buildCsv(data);
    const filePath = path.resolve(process.cwd(), '..', 'doc', 'powerbi_cases.csv');
    fs.writeFileSync(filePath, csv);
    return { ok: true, rows: data.length, filePath };
  }

  @Get('summary')
  async summary(@Query() query: Record<string, string | undefined>) {
    const stats = await this.casesService.getStats(query);
    const { data } = await this.casesService.findAll({ ...query, limit: '1' });
    return { ...stats, exportable: true, sampleCount: data.length };
  }
}
