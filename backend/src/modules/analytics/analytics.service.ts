import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { applyCaseFilters, countByField, parseCaseFilters } from '../../common/case-filters';
import { isDirujuk, normalizeKonselingMode, normalizePendidikan, normalizeProsesPenerimaan } from '../../common/pendampingan-labels';

type CaseRow = Record<string, unknown>;

@Injectable()
export class AnalyticsService {
  constructor(private supabase: SupabaseService) {}

  private async loadCases(filtersInput: Record<string, string | undefined>): Promise<{
    cases: CaseRow[];
    connected: boolean;
    error?: string;
  }> {
    const filters = parseCaseFilters(filtersInput);
    const db = this.supabase.db;
    if (!db) return { cases: [], connected: false };

    const { data, error } = await db
      .from('cases')
      .select('tahun, tanggal, status, jenis_kelamin, usia, jenis_kekerasan, kabupaten, kecamatan, kategori, outcome, status_pendampingan, pendidikan, catatan')
      .order('tanggal', { ascending: true });

    if (error || !data) return { cases: [], connected: true, error: error?.message };
    return { cases: applyCaseFilters(data as CaseRow[], filters), connected: true };
  }

  async getTrends(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const byYear: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    for (const c of cases) {
      const year = String((c.tahun as number) ?? new Date(String(c.tanggal)).getFullYear());
      byYear[year] = (byYear[year] ?? 0) + 1;
      const month = String(c.tanggal).slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + 1;
    }

    const labels = Object.keys(byYear).sort();
    return {
      connected,
      yearly: labels.map((l) => byYear[l]),
      labels,
      monthly: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count })),
    };
  }

  async getDemographics(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const gender: Record<string, number> = {};
    const ageGroups: Record<string, number> = {};

    for (const c of cases) {
      const g = String(c.jenis_kelamin || 'Tidak diketahui');
      gender[g] = (gender[g] ?? 0) + 1;

      const usia = (c.usia as number) ?? 0;
      let group = 'Tidak diketahui';
      if (usia <= 12) group = '0-12';
      else if (usia <= 17) group = '13-17';
      else if (usia <= 25) group = '18-25';
      else if (usia <= 40) group = '26-40';
      else if (usia > 40) group = '40+';
      ageGroups[group] = (ageGroups[group] ?? 0) + 1;
    }

    return { connected, gender, ageGroups };
  }

  private buildPendampinganStats(cases: CaseRow[]) {
    let dirujuk = 0;
    let tidakDirujuk = 0;
    const konseling: Record<string, number> = {};
    const penerimaan: Record<string, number> = {};
    const pendidikan: Record<string, number> = {};

    for (const c of cases) {
      const catatan = String(c.catatan ?? '');
      const outcome = String(c.outcome ?? '');

      if (isDirujuk(catatan, outcome)) dirujuk++;
      else tidakDirujuk++;

      const mode = normalizeKonselingMode(String(c.status_pendampingan ?? ''), catatan);
      konseling[mode] = (konseling[mode] ?? 0) + 1;

      const channel = normalizeProsesPenerimaan(catatan);
      penerimaan[channel] = (penerimaan[channel] ?? 0) + 1;

      const edu = normalizePendidikan(String(c.pendidikan ?? ''));
      pendidikan[edu] = (pendidikan[edu] ?? 0) + 1;
    }

    return {
      dirujuk: { dirujuk, tidakDirujuk, total: cases.length },
      konseling,
      penerimaan,
      pendidikan,
    };
  }

  async getOverview(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const total = cases.length;
    const selesai = cases.filter((c) => c.status === 'Selesai').length;
    const completionRate = total ? Math.round((selesai / total) * 100) : 0;

    return {
      connected,
      total,
      selesai,
      aktif: total - selesai,
      completionRate,
      topKecamatan: countByField(cases, 'kecamatan', 8),
      topKabupaten: countByField(cases, 'kabupaten', 6),
      topJenisKekerasan: countByField(cases, 'jenis_kekerasan', 8),
      topKategori: countByField(cases, 'kategori', 6),
      pendampingan: this.buildPendampinganStats(cases),
    };
  }

  async getPendampingan(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    return { connected, ...this.buildPendampinganStats(cases) };
  }

  async getForecast(query: Record<string, string | undefined>, months = 6) {
    const { cases, connected } = await this.loadCases(query);
    const byMonth: Record<string, number> = {};

    for (const c of cases) {
      const month = String(c.tanggal).slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + 1;
    }

    const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
    const values = sorted.map(([, count]) => count);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    const lastMonths = sorted.slice(-6);
    let trend = 0;
    if (lastMonths.length >= 2) {
      trend = (lastMonths[lastMonths.length - 1][1] - lastMonths[0][1]) / (lastMonths.length - 1);
    }

    const lastDate = sorted.length ? new Date(`${sorted[sorted.length - 1][0]}-01`) : new Date();
    const predictions: { month: string; predicted: number; lower: number; upper: number }[] = [];

    for (let i = 1; i <= months; i++) {
      const d = new Date(lastDate);
      d.setMonth(d.getMonth() + i);
      const month = d.toISOString().slice(0, 7);
      const predicted = Math.max(0, Math.round(avg + trend * i));
      predictions.push({
        month,
        predicted,
        lower: Math.max(0, Math.round(predicted * 0.8)),
        upper: Math.round(predicted * 1.2),
      });
    }

    return {
      connected,
      historical: sorted.map(([month, count]) => ({ month, count })),
      predictions,
      model: 'moving-average-trend',
    };
  }
}
