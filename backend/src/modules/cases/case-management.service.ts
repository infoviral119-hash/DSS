import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CasesService } from './cases.service';
import { applyCaseFilters, parseCaseFilters, countByField } from '../../common/case-filters';
import { applyRowScope, type SecurityContext } from '../../common/data-security';
import type { AuthUser } from '../auth/auth.service';
import {
  computeDataQuality,
  computeRiskScore,
  detectDuplicates,
  expandedSearch,
} from './case-management.utils';
import { buildCaseDetail, mapCaseListRow } from './case-detail.mapper';

type CaseRow = Record<string, unknown>;

@Injectable()
export class CaseManagementService {
  constructor(
    private supabase: SupabaseService,
    private casesService: CasesService,
  ) {}

  private get db() {
    const db = this.supabase.db;
    if (!db) throw new Error('Database offline');
    return db;
  }

  private toCtx(user?: AuthUser | null): SecurityContext | null {
    if (!user) return null;
    return {
      ...user,
      dataScope: (user.dataScope as SecurityContext['dataScope']) ?? undefined,
      scopeRegion: user.scopeRegion,
      canRevealPii: user.canRevealPii,
    };
  }

  private async fetchAllCases() {
    const { data, error } = await this.db
      .from('cases')
      .select('*')
      .order('tanggal', { ascending: false });
    if (error || !data) return [];
    return data as CaseRow[];
  }

  private async getScopedCases(query: Record<string, string | undefined>, user?: AuthUser | null) {
    const filters = parseCaseFilters(query);
    const ctx = this.toCtx(user);
    let cases = applyRowScope(await this.fetchAllCases(), ctx);

    if (filters.search) {
      const q = filters.search;
      cases = cases.filter((c) => expandedSearch(c, q));
      delete (filters as { search?: string }).search;
    }

    if (query.riskScore) {
      cases = cases.filter((c) => computeRiskScore(c) === query.riskScore);
    }

    cases = applyCaseFilters(cases, filters);
    return { cases, filters };
  }

  async getKpis(query: Record<string, string | undefined>, user?: AuthUser | null) {
    const { cases } = await this.getScopedCases(query, user);
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let aktif = 0;
    let selesai = 0;
    let baruBulanIni = 0;
    let totalUsia = 0;
    let usiaCount = 0;
    const kabSet = new Set<string>();
    const psikologSet = new Set<string>();
    let konselingCount = 0;

    for (const c of cases) {
      if (c.status === 'Selesai') selesai++;
      else aktif++;
      const d = new Date(String(c.tanggal));
      if (d.getMonth() === month && d.getFullYear() === year) baruBulanIni++;
      if (c.usia != null) { totalUsia += Number(c.usia); usiaCount++; }
      if (c.kabupaten) kabSet.add(String(c.kabupaten));
      if (c.psikolog_nama) psikologSet.add(String(c.psikolog_nama));
      if (String(c.catatan ?? '').toLowerCase().includes('konseling')) konselingCount++;
    }

    const quality = computeDataQuality(cases);
    const trend = this.monthlyTrend(cases);

    return {
      totalKasus: cases.length,
      kasusAktif: aktif,
      kasusSelesai: selesai,
      kasusBaruBulanIni: baruBulanIni,
      rataRataUsia: usiaCount ? Math.round(totalUsia / usiaCount) : 0,
      jumlahKabupaten: kabSet.size,
      psikologAktif: psikologSet.size,
      jumlahKonseling: konselingCount,
      dataQualityScore: quality.score,
      trend,
    };
  }

  private monthlyTrend(cases: CaseRow[]) {
    const map = new Map<string, number>();
    for (const c of cases) {
      const key = String(c.tanggal ?? '').slice(0, 7);
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v);
  }

  async list(query: Record<string, string | undefined>, user?: AuthUser | null) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(10, Number(query.pageSize ?? 25)));
    const sortBy = query.sortBy ?? 'tanggal';
    const sortDir = query.sortDir === 'asc' ? 1 : -1;

    const { cases } = await this.getScopedCases(query, user);
    const dupMap = detectDuplicates(cases);
    const processed = await this.casesService.findAll(query, user);
    const maskedMap = new Map((processed.data as CaseRow[]).map((c) => [String(c.id), c]));

    let rows = cases.map((c) => {
      const masked = maskedMap.get(String(c.id)) ?? c;
      return mapCaseListRow(masked, dupMap.get(String(c.id)));
    });

    rows.sort((a, b) => {
      const av = a[sortBy as keyof typeof a];
      const bv = b[sortBy as keyof typeof b];
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
      return sortDir * cmp;
    });

    const total = rows.length;
    const data = rows.slice((page - 1) * pageSize, page * pageSize);

    return { data, total, page, pageSize };
  }

  async getDetail(id: string, user?: AuthUser | null) {
    const { data: raw } = await this.db.from('cases').select('*').eq('id', id).single();
    if (!raw) throw new Error('Kasus tidak ditemukan');

    const processed = await this.casesService.findAll({}, user);
    const masked = (processed.data as CaseRow[]).find((c) => String(c.id) === id) ?? raw;

    const { data: attachments } = await this.db
      .from('case_attachments')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: false });

    const detail = buildCaseDetail(masked);
    return {
      ...detail,
      attachments: attachments ?? [],
      auditTrail: [
        { user: 'System', date: raw.created_at, column: 'create', oldValue: '-', newValue: 'Kasus dibuat' },
        { user: 'System', date: raw.updated_at, column: 'update', oldValue: '-', newValue: 'Data diperbarui' },
      ],
    };
  }

  async getQuality(query: Record<string, string | undefined>, user?: AuthUser | null) {
    const { cases } = await this.getScopedCases(query, user);
    return computeDataQuality(cases);
  }

  async getQuickAnalytics(query: Record<string, string | undefined>, user?: AuthUser | null) {
    const { cases } = await this.getScopedCases(query, user);
    return {
      jenisKekerasan: countByField(cases, 'jenis_kekerasan', 8),
      gender: countByField(cases, 'jenis_kelamin', 5),
      kabupaten: countByField(cases, 'kabupaten', 8),
      status: countByField(cases, 'status', 5),
      usia: this.usiaBuckets(cases),
      psikolog: countByField(cases, 'psikolog_nama', 8),
    };
  }

  private usiaBuckets(cases: CaseRow[]) {
    const buckets = { '<18': 0, '18-30': 0, '31-45': 0, '46+': 0, 'Unknown': 0 };
    for (const c of cases) {
      const u = c.usia as number | null;
      if (u == null) buckets.Unknown++;
      else if (u < 18) buckets['<18']++;
      else if (u <= 30) buckets['18-30']++;
      else if (u <= 45) buckets['31-45']++;
      else buckets['46+']++;
    }
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }

  async getSavedFilters(userId: string) {
    const { data } = await this.db.from('case_saved_filters').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    return data ?? [];
  }

  async saveFilter(userId: string, name: string, filters: Record<string, unknown>) {
    const { data, error } = await this.db.from('case_saved_filters').insert({ user_id: userId, name, filters }).select('*').single();
    if (error) throw error;
    await this.logActivity(userId, null, 'filter.save', { name });
    return data;
  }

  async deleteSavedFilter(userId: string, id: string) {
    await this.db.from('case_saved_filters').delete().eq('id', id).eq('user_id', userId);
    return { ok: true };
  }

  async getPreferences(userId: string) {
    const { data } = await this.db.from('case_user_preferences').select('*').eq('user_id', userId).maybeSingle();
    return data ?? { visible_columns: [], column_order: [] };
  }

  async savePreferences(userId: string, visibleColumns: string[], columnOrder: string[]) {
    const { data, error } = await this.db.from('case_user_preferences').upsert({
      user_id: userId,
      visible_columns: visibleColumns,
      column_order: columnOrder,
      updated_at: new Date().toISOString(),
    }).select('*').single();
    if (error) throw error;
    return data;
  }

  async exportCases(body: { ids?: string[]; format?: string; scope?: string }, query: Record<string, string | undefined>, user: AuthUser) {
    const { cases } = await this.getScopedCases(query, user);
    let rows = cases;
    if (body.ids?.length) rows = cases.filter((c) => body.ids!.includes(String(c.id)));

    const csv = [
      'Register,Tanggal,Korban,Usia,Gender,Jenis,Kabupaten,Status,Risk',
      ...rows.map((c) => [
        c.nomor_register, c.tanggal, c.nama_korban, c.usia, c.jenis_kelamin,
        c.jenis_kekerasan, c.kabupaten, c.status, computeRiskScore(c),
      ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    await this.db.from('case_export_history').insert({
      user_id: user.id,
      export_type: body.scope ?? 'filtered',
      format: body.format ?? 'csv',
      row_count: rows.length,
      filters: query,
    });
    await this.logActivity(user.id, null, 'export', { rows: rows.length, format: body.format });

    return { content: csv, rowCount: rows.length, format: 'csv' };
  }

  async bulkAction(body: { action: string; ids: string[] }, user: AuthUser) {
    await this.logActivity(user.id, null, `bulk.${body.action}`, { ids: body.ids, count: body.ids.length });
    if (body.action === 'tag' && body.ids.length) {
      for (const id of body.ids) {
        await this.db.from('case_tag').upsert({ case_id: id, tag: 'reviewed', created_by: user.id }, { onConflict: 'case_id,tag' });
      }
    }
    return { ok: true, action: body.action, count: body.ids.length };
  }

  private async logActivity(userId: string, caseId: string | null, action: string, metadata: Record<string, unknown>) {
    await this.db.from('case_activity').insert({ user_id: userId, case_id: caseId, action, metadata });
  }
}
