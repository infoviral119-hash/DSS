import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { applyCaseFilters, countByField, parseCaseFilters } from '../../common/case-filters';
import { isDirujuk, normalizeProsesPenerimaan } from '../../common/pendampingan-labels';

type CaseRow = Record<string, unknown>;
export type TreeNode = { name: string; value?: number; children?: TreeNode[] };

@Injectable()
export class AnalyticsChartsService {
  constructor(private supabase: SupabaseService) {}

  private async loadCases(filtersInput: Record<string, string | undefined>) {
    const filters = parseCaseFilters(filtersInput);
    const db = this.supabase.db;
    if (!db) return { cases: [] as CaseRow[], connected: false };

    const { data, error } = await db
      .from('cases')
      .select('tahun, tanggal, status, jenis_kelamin, usia, jenis_kekerasan, kabupaten, kecamatan, kategori, outcome, catatan, lama_pendampingan, status_pendampingan')
      .order('tanggal', { ascending: true });

    if (error || !data) return { cases: [] as CaseRow[], connected: true, error: error?.message };
    return { cases: applyCaseFilters(data as CaseRow[], filters), connected: true };
  }

  async getPareto(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const sorted = countByField(cases, 'jenis_kekerasan', 30);
    const total = sorted.reduce((s, i) => s + i.count, 0);
    let cumulative = 0;

    const items = sorted.map((item) => {
      cumulative += item.count;
      return {
        name: item.name,
        count: item.count,
        cumulativePct: total ? Math.round((cumulative / total) * 1000) / 10 : 0,
      };
    });

    return { connected, total, items };
  }

  private buildKabJenisStatusTree(cases: CaseRow[]): TreeNode {
    const root: TreeNode = { name: 'Kasus', children: [] };
    const map = new Map<string, Map<string, Map<string, number>>>();

    for (const c of cases) {
      const kab = String(c.kabupaten || 'Tidak diketahui');
      const jk = String(c.jenis_kekerasan || 'Tidak diketahui');
      const st = String(c.status || 'Tidak diketahui');
      if (!map.has(kab)) map.set(kab, new Map());
      const jm = map.get(kab)!;
      if (!jm.has(jk)) jm.set(jk, new Map());
      const sm = jm.get(jk)!;
      sm.set(st, (sm.get(st) ?? 0) + 1);
    }

    for (const [kab, jm] of map) {
      const kabNode: TreeNode = { name: kab, children: [] };
      for (const [jk, sm] of jm) {
        const jkNode: TreeNode = { name: jk, children: [] };
        for (const [st, count] of sm) {
          jkNode.children!.push({ name: st, value: count });
        }
        jkNode.value = jkNode.children!.reduce((s, n) => s + (n.value ?? 0), 0);
        kabNode.children!.push(jkNode);
      }
      kabNode.value = kabNode.children!.reduce((s, n) => s + (n.value ?? 0), 0);
      root.children!.push(kabNode);
    }

    return root;
  }

  async getTreemap(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    return { connected, tree: this.buildKabJenisStatusTree(cases) };
  }

  private buildSunburstTree(cases: CaseRow[]): TreeNode {
    const root: TreeNode = { name: 'Kasus', children: [] };
    const map = new Map<string, Map<string, Map<string, Map<string, number>>>>();

    for (const c of cases) {
      const kab = String(c.kabupaten || 'Tidak diketahui');
      const jk = String(c.jenis_kekerasan || 'Tidak diketahui');
      const g = String(c.jenis_kelamin || 'Tidak diketahui');
      const st = String(c.status || 'Tidak diketahui');
      if (!map.has(kab)) map.set(kab, new Map());
      const jm = map.get(kab)!;
      if (!jm.has(jk)) jm.set(jk, new Map());
      const gm = jm.get(jk)!;
      if (!gm.has(g)) gm.set(g, new Map());
      const sm = gm.get(g)!;
      sm.set(st, (sm.get(st) ?? 0) + 1);
    }

    for (const [kab, jm] of map) {
      const kabNode: TreeNode = { name: kab, children: [] };
      for (const [jk, gm] of jm) {
        const jkNode: TreeNode = { name: jk, children: [] };
        for (const [g, sm] of gm) {
          const gNode: TreeNode = { name: g, children: [] };
          for (const [st, count] of sm) {
            gNode.children!.push({ name: st, value: count });
          }
          gNode.value = gNode.children!.reduce((s, n) => s + (n.value ?? 0), 0);
          jkNode.children!.push(gNode);
        }
        jkNode.value = jkNode.children!.reduce((s, n) => s + (n.value ?? 0), 0);
        kabNode.children!.push(jkNode);
      }
      kabNode.value = kabNode.children!.reduce((s, n) => s + (n.value ?? 0), 0);
      root.children!.push(kabNode);
    }

    return root;
  }

  async getSunburst(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    return { connected, tree: this.buildSunburstTree(cases) };
  }

  async getHeatmap(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const monthSet = new Set<string>();
    const jenisSet = new Set<string>();
    const grid = new Map<string, number>();

    for (const c of cases) {
      const month = String(c.tanggal).slice(0, 7);
      const jk = String(c.jenis_kekerasan || 'Tidak diketahui');
      monthSet.add(month);
      jenisSet.add(jk);
      const key = `${month}|${jk}`;
      grid.set(key, (grid.get(key) ?? 0) + 1);
    }

    const months = [...monthSet].sort();
    const jenis = [...jenisSet].sort();
    const data: [number, number, number][] = [];

    months.forEach((m, xi) => {
      jenis.forEach((j, yi) => {
        data.push([xi, yi, grid.get(`${m}|${j}`) ?? 0]);
      });
    });

    const max = data.reduce((m, [, , v]) => Math.max(m, v), 0);

    return { connected, months, jenis, data, max };
  }

  async getStackedArea(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const byMonth = new Map<string, { aktif: number; selesai: number; dirujuk: number }>();

    for (const c of cases) {
      const month = String(c.tanggal).slice(0, 7);
      const bucket = byMonth.get(month) ?? { aktif: 0, selesai: 0, dirujuk: 0 };
      if (isDirujuk(String(c.catatan ?? ''), String(c.outcome ?? ''))) bucket.dirujuk++;
      else if (c.status === 'Selesai') bucket.selesai++;
      else bucket.aktif++;
      byMonth.set(month, bucket);
    }

    const months = [...byMonth.keys()].sort();
    return {
      connected,
      months,
      aktif: months.map((m) => byMonth.get(m)!.aktif),
      selesai: months.map((m) => byMonth.get(m)!.selesai),
      dirujuk: months.map((m) => byMonth.get(m)!.dirujuk),
    };
  }

  async getSankey(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const links = new Map<string, number>();
    const nodeSet = new Set<string>();

    const addLink = (from: string, to: string, w = 1) => {
      nodeSet.add(from);
      nodeSet.add(to);
      const key = `${from}|${to}`;
      links.set(key, (links.get(key) ?? 0) + w);
    };

    for (const c of cases) {
      const src = normalizeProsesPenerimaan(String(c.catatan ?? ''));
      const jk = String(c.jenis_kekerasan || 'Tidak diketahui');
      const st = String(c.status || 'Tidak diketahui');
      const rujuk = isDirujuk(String(c.catatan ?? ''), String(c.outcome ?? '')) ? 'Dirujuk' : 'Tidak Dirujuk';
      addLink(`Sumber: ${src}`, jk);
      addLink(jk, st);
      addLink(st, rujuk);
    }

    const nodes = [...nodeSet].map((name) => ({ name }));
    const linkList = [...links.entries()].map(([key, value]) => {
      const [source, target] = key.split('|');
      return { source, target, value };
    });

    return { connected, nodes, links: linkList };
  }

  async getFunnel(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const total = cases.length;
    const aktif = cases.filter((c) => c.status === 'Aktif').length;
    const selesai = cases.filter((c) => c.status === 'Selesai').length;
    const dirujuk = cases.filter((c) => isDirujuk(String(c.catatan ?? ''), String(c.outcome ?? ''))).length;

    const stages = [
      { name: 'Laporan Masuk', value: total },
      { name: 'Verifikasi', value: Math.max(total - Math.round(total * 0.05), aktif + selesai) },
      { name: 'Pendampingan', value: aktif + selesai },
      { name: 'Proses Mediasi', value: Math.round(selesai * 0.6) },
      { name: 'Selesai', value: selesai },
      { name: 'Dirujuk', value: dirujuk },
    ];

    return { connected, stages, note: 'Mediasi diestimasi dari kasus selesai jika kolom pipeline belum ada' };
  }

  async getWaterfall(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const byMonth = new Map<string, number>();
    for (const c of cases) {
      const m = String(c.tanggal).slice(0, 7);
      byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
    }
    const months = [...byMonth.keys()].sort();
    const points: { name: string; value: number; isTotal?: boolean }[] = [];
    let total = 0;
    months.forEach((m, i) => {
      const count = byMonth.get(m) ?? 0;
      const prev = i > 0 ? (byMonth.get(months[i - 1]) ?? 0) : 0;
      const delta = i === 0 ? count : count - prev;
      points.push({ name: m, value: delta });
      total += count;
    });
    if (months.length) points.push({ name: 'Total', value: total, isTotal: true });
    return { connected, points };
  }

  async getScatter(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const points = cases
      .filter((c) => (c.usia as number) > 0)
      .map((c) => ({
        usia: c.usia as number,
        lama: (c.lama_pendampingan as number) ?? 0,
        jenis: String(c.jenis_kekerasan || 'Tidak diketahui'),
        pendampingan: (c.lama_pendampingan as number) ?? 1,
      }));
    return { connected, points };
  }

  async getBubble(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    const map = new Map<string, { usiaSum: number; count: number }>();
    for (const c of cases) {
      const kab = String(c.kabupaten || 'Tidak diketahui');
      const bucket = map.get(kab) ?? { usiaSum: 0, count: 0 };
      bucket.usiaSum += (c.usia as number) ?? 0;
      bucket.count++;
      map.set(kab, bucket);
    }
    const bubbles = [...map.entries()].map(([name, v]) => ({
      name,
      usiaAvg: v.count ? Math.round(v.usiaSum / v.count) : 0,
      count: v.count,
    }));
    return { connected, bubbles };
  }
}
