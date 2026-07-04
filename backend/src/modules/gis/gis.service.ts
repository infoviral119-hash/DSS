import { Injectable } from '@nestjs/common';
import { CasesService } from '../cases/cases.service';
import { countColor, resolveCoords } from '../../common/id-coords';
import { normalizeKabupaten } from '../../common/wilayah-labels';
import { getBoundaryGeoJson } from './data/boundaries';
import { PUBLIC_SERVICES } from './data/services';

@Injectable()
export class GisService {
  constructor(private readonly casesService: CasesService) {}

  private async loadFilteredCases(filtersInput: Record<string, string | undefined>) {
    return this.casesService.getFilteredCases(filtersInput);
  }

  async getMapData(filtersInput: Record<string, string | undefined> = {}) {
    const { cases, connected } = await this.loadFilteredCases(filtersInput);
    if (!connected) {
      return {
        connected: false,
        points: [],
        clusters: [],
        kabupatenStats: [],
        kecamatanStats: [],
        total: 0,
        withGps: 0,
        withoutGps: 0,
      };
    }

    const points = cases
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => ({
        id: c.id,
        lat: c.latitude as number,
        lng: c.longitude as number,
        nomorRegister: c.nomor_register,
        namaKorban: c.nama_korban,
        jenisKekerasan: c.jenis_kekerasan,
        jenisKelamin: c.jenis_kelamin,
        status: c.status,
        tanggal: c.tanggal,
        kabupaten: c.kabupaten,
        kecamatan: c.kecamatan,
        provinsi: c.provinsi,
      }));

    const kabMap = new Map<string, { name: string; count: number; aktif: number; selesai: number }>();
    const kecMap = new Map<string, { name: string; kabupaten: string; count: number }>();

    for (const c of cases) {
      const kab = String(c.kabupaten || 'Tidak diketahui');
      const kec = String(c.kecamatan || 'Tidak diketahui');
      const kabEntry = kabMap.get(kab) ?? { name: kab, count: 0, aktif: 0, selesai: 0 };
      kabEntry.count++;
      if (c.status === 'Selesai') kabEntry.selesai++;
      else kabEntry.aktif++;
      kabMap.set(kab, kabEntry);

      const kecKey = `${kab}|${kec}`;
      const kecEntry = kecMap.get(kecKey) ?? { name: kec, kabupaten: kab, count: 0 };
      kecEntry.count++;
      kecMap.set(kecKey, kecEntry);
    }

    const kabupatenStats = [...kabMap.values()].sort((a, b) => b.count - a.count);
    const kecamatanStats = [...kecMap.values()].sort((a, b) => b.count - a.count);
    const maxCount = kabupatenStats[0]?.count ?? 1;

    const clusterMap = new Map<string, { name: string; count: number; kabupaten: string }>();
    for (const k of kabupatenStats) {
      clusterMap.set(k.name, { name: k.name, count: k.count, kabupaten: normalizeKabupaten(k.name) || k.name });
    }

    const clusters = [...clusterMap.values()]
      .map((c) => {
        const prov = cases.find((x) => String(x.kabupaten) === c.name)?.provinsi as string | undefined;
        const resolved = resolveCoords(undefined, c.kabupaten || c.name, prov ?? 'Jawa Barat', c.name);
        if (!resolved) return null;
        const [lat, lng] = resolved;
        return { ...c, lat, lng, color: countColor(c.count, maxCount) };
      })
      .filter(Boolean);

    const provinsiSet = new Set(cases.map((c) => c.provinsi).filter(Boolean));

    return {
      connected: true,
      points,
      clusters,
      kabupatenStats,
      kecamatanStats: kecamatanStats.slice(0, 30),
      total: cases.length,
      withGps: points.length,
      withoutGps: cases.length - points.length,
      aktif: cases.filter((c) => c.status !== 'Selesai').length,
      selesai: cases.filter((c) => c.status === 'Selesai').length,
      provinsiCount: provinsiSet.size,
      kabupatenCount: kabMap.size,
      completionRate: cases.length > 0
        ? Math.round((cases.filter((c) => c.status === 'Selesai').length / cases.length) * 100)
        : 0,
    };
  }

  getBoundaries(level: 'provinsi' | 'kabupaten' | 'kecamatan'): ReturnType<typeof getBoundaryGeoJson> {
    return getBoundaryGeoJson(level);
  }

  getServices() {
    return PUBLIC_SERVICES;
  }

  async getInsights(filtersInput: Record<string, string | undefined> = {}) {
    const data = await this.getMapData(filtersInput);
    const insights: string[] = [];

    if (!data.connected || data.total === 0) {
      return { insights: ['Tidak ada data kasus untuk filter saat ini.'] };
    }

    const topKab = data.kabupatenStats[0];
    if (topKab) {
      insights.push(`${topKab.name}: ${topKab.count} kasus — wilayah prioritas tertinggi.`);
      const pctAktif = topKab.count > 0 ? Math.round((topKab.aktif / topKab.count) * 100) : 0;
      if (pctAktif > 40) insights.push(`${topKab.name}: ${pctAktif}% kasus masih aktif — perlu perhatian.`);
    }

    const topKec = data.kecamatanStats[0];
    if (topKec) insights.push(`Hotspot kecamatan: ${topKec.name} (${topKec.kabupaten}) — ${topKec.count} kasus.`);

    const jenisMap = new Map<string, number>();
    for (const p of data.points) {
      const j = String(p.jenisKekerasan || 'Lainnya');
      jenisMap.set(j, (jenisMap.get(j) ?? 0) + 1);
    }
    const topJenis = [...jenisMap.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topJenis) insights.push(`Dominasi jenis kekerasan: ${topJenis[0]} (${topJenis[1]} kasus GPS).`);

    const gpsPct = data.total > 0 ? Math.round((data.withGps / data.total) * 100) : 0;
    insights.push(`Coverage GPS: ${gpsPct}% (${data.withGps}/${data.total} kasus).`);
    if (gpsPct < 50) insights.push('Disarankan geocode ulang untuk meningkatkan akurasi spasial.');

    const psi = PUBLIC_SERVICES.filter((s) => s.category === 'psikolog');
    if (psi.length > 0 && topKab) {
      insights.push(`Radius layanan psikolog terdekat perlu diverifikasi di wilayah ${topKab.name}.`);
      insights.push('Disarankan menambah layanan pendamping jika jarak > 8 km.');
    }

    if ((data.completionRate ?? 0) < 70) {
      insights.push(`Tingkat penyelesaian ${data.completionRate}% — di bawah target 70%.`);
    }

    return { insights };
  }

  async getStats(filtersInput: Record<string, string | undefined> = {}) {
    const data = await this.getMapData(filtersInput);
    return {
      totalMarker: data.total,
      gpsValid: data.withGps,
      gpsInvalid: data.withoutGps,
      kabupaten: data.kabupatenCount,
      provinsi: data.provinsiCount,
      aktif: data.aktif,
      selesai: data.selesai,
      completionRate: data.completionRate,
      coverage: data.total > 0 ? Math.round((data.withGps / data.total) * 100) : 0,
    };
  }
}
