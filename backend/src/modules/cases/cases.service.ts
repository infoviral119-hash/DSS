import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';

import { applyCaseFilters, parseCaseFilters } from '../../common/case-filters';

import { countColor, geocodeIfMissing, isLikelyWrongCoords, resolveCoords } from '../../common/id-coords';

import { normalizeKabupaten } from '../../common/wilayah-labels';

import {

  applyRowScope,

  maskCaseRecord,

  type SecurityContext,

} from '../../common/data-security';

import type { AuthUser } from '../auth/auth.service';



@Injectable()

export class CasesService {

  private revealCache = new Map<string, Set<string>>();



  constructor(private supabase: SupabaseService) {}



  private toSecurityContext(user?: AuthUser | null): SecurityContext | null {

    if (!user) return null;

    return {

      ...user,

      dataScope: (user.dataScope as SecurityContext['dataScope']) ?? undefined,

      scopeRegion: user.scopeRegion,

      canRevealPii: user.canRevealPii,

    };

  }



  private async fetchCases() {

    const db = this.supabase.db;

    if (!db) return { cases: [], connected: false };



    const { data, error } = await db

      .from('cases')

      .select(

        'id, nomor_register, tanggal, nama_korban, jenis_kelamin, usia, status, jenis_kekerasan, kategori, kabupaten, kecamatan, kelurahan, psikolog_nama, tahun, latitude, longitude, outcome, status_pendampingan, provinsi, alamat, catatan',

      )

      .order('tanggal', { ascending: false });



    if (error || !data) return { cases: [], connected: true, error: error?.message };

    return { cases: data, connected: true };

  }



  private processCases(raw: Record<string, unknown>[], user?: AuthUser | null) {

    const ctx = this.toSecurityContext(user);

    const scoped = applyRowScope(raw, ctx);

    const cacheKey = user?.id ?? 'anon';

    const revealed = this.revealCache.get(cacheKey) ?? new Set<string>();

    return scoped.map((c) => {
      const caseId = String(c.id);
      const fields = new Set<string>();
      for (const key of revealed) {
        if (key.startsWith(`${caseId}:`)) fields.add(key.split(':').slice(1).join(':'));
      }
      return maskCaseRecord(c, ctx, fields);
    });

  }



  async revealField(user: AuthUser, caseId: string, field: string) {

    const cacheKey = user.id;

    const set = this.revealCache.get(cacheKey) ?? new Set<string>();

    set.add(`${caseId}:${field}`);

    this.revealCache.set(cacheKey, set);

    return { ok: true, caseId, field };

  }



  async getFilteredCases(filtersInput: Record<string, string | undefined> = {}, user?: AuthUser | null) {

    const filters = parseCaseFilters(filtersInput);

    const { cases: raw, connected } = await this.fetchCases();

    if (!connected) return { cases: [], connected: false };

    const filtered = applyCaseFilters(raw, filters);

    return { cases: this.processCases(filtered, user), connected: true };

  }



  async getStats(filtersInput: Record<string, string | undefined> = {}, user?: AuthUser | null) {

    const filters = parseCaseFilters(filtersInput);

    const { cases: raw, connected, error } = await this.fetchCases();



    if (!connected) {

      return { total: 0, aktif: 0, selesai: 0, byYear: {}, connected: false };

    }



    const ctx = this.toSecurityContext(user);

    const cases = applyCaseFilters(applyRowScope(raw, ctx), filters);

    const byYear: Record<number, number> = {};

    let aktif = 0;

    let selesai = 0;



    for (const c of cases) {

      const year = (c.tahun as number) ?? new Date(String(c.tanggal)).getFullYear();

      byYear[year] = (byYear[year] ?? 0) + 1;

      if (c.status === 'Selesai') selesai++;

      else aktif++;

    }



    return { total: cases.length, aktif, selesai, byYear, connected: true, error };

  }



  async findAll(filtersInput: Record<string, string | undefined> = {}, user?: AuthUser | null) {

    const filters = parseCaseFilters(filtersInput);

    const { cases: raw, connected } = await this.fetchCases();

    if (!connected) return { data: [], total: 0 };



    const ctx = this.toSecurityContext(user);

    const filtered = applyCaseFilters(applyRowScope(raw, ctx), filters);

    const processed = this.processCases(filtered, user);

    const limit = filters.limit ?? 100;

    return { data: processed.slice(0, limit), total: processed.length };

  }



  async getMapPoints(filtersInput: Record<string, string | undefined> = {}, user?: AuthUser | null) {

    const filters = parseCaseFilters(filtersInput);

    const { cases: raw, connected } = await this.fetchCases();

    if (!connected) return { points: [], clusters: [], total: 0, withGps: 0 };



    const ctx = this.toSecurityContext(user);

    const cases = applyCaseFilters(applyRowScope(raw, ctx), filters);

    const withCoords = cases

      .filter((c) => c.latitude != null && c.longitude != null)

      .map((c) => ({

        id: c.id,

        lat: c.latitude as number,

        lng: c.longitude as number,

        label: String(c.nama_korban ?? ''),

        kecamatan: c.kecamatan,

        jenisKekerasan: c.jenis_kekerasan,

      }));



    const clusterMap = new Map<string, { name: string; count: number; kabupaten: string }>();

    for (const c of cases) {

      const key = String(c.kabupaten || c.kecamatan || 'Tidak diketahui');

      const existing = clusterMap.get(key);

      if (existing) existing.count++;

      else clusterMap.set(key, { name: key, count: 1, kabupaten: normalizeKabupaten(String(c.kabupaten || '')) || String(c.kabupaten || '') });

    }



    const clustersRaw = [...clusterMap.values()].sort((a, b) => b.count - a.count);

    const maxCount = clustersRaw[0]?.count ?? 1;

    const clusters = clustersRaw

      .map((c) => {

        const resolved = resolveCoords(undefined, c.kabupaten || c.name, 'Jawa Barat', c.name);

        if (!resolved) return null;

        const [lat, lng] = resolved;

        return { ...c, lat, lng, color: countColor(c.count, maxCount) };

      })

      .filter(Boolean) as { name: string; count: number; kabupaten: string; lat: number; lng: number; color: string }[];



    return { points: withCoords, clusters, total: cases.length, withGps: withCoords.length };

  }



  async getFilterOptions(user?: AuthUser | null) {

    const { cases: raw, connected } = await this.fetchCases();

    if (!connected) return { kabupaten: [], jenisKekerasan: [], status: [] };



    const ctx = this.toSecurityContext(user);

    const scoped = applyRowScope(raw, ctx);



    const uniq = (field: string) =>

      [...new Set(scoped.map((c) => (c as Record<string, unknown>)[field]).filter(Boolean))].sort() as string[];



    return {

      kabupaten: uniq('kabupaten'),

      jenisKekerasan: uniq('jenis_kekerasan'),

      status: uniq('status'),

    };

  }



  async geocodeBackfill(force = false) {

    const db = this.supabase.db;

    const { cases: raw, connected } = await this.fetchCases();

    if (!connected || !db) return { ok: false, updated: 0, skipped: 0, cleared: 0, message: 'Database tidak terhubung' };



    let updated = 0;

    let skipped = 0;

    let cleared = 0;



    for (const c of raw) {

      const kab = String(c.kabupaten || '');

      const prov = String(c.provinsi || '');

      const wrong = isLikelyWrongCoords(kab, prov, c.latitude as number | null, c.longitude as number | null);

      const hasGps = c.latitude != null && c.longitude != null && !wrong;



      if (hasGps && !force) {

        skipped++;

        continue;

      }



      const coords = geocodeIfMissing(

        String(c.kecamatan || ''),

        kab,

        prov,

        wrong ? null : (c.latitude as number | null),

        wrong ? null : (c.longitude as number | null),

        String(c.id),

      );



      if (coords.latitude == null || coords.longitude == null) {

        if (c.latitude != null || c.longitude != null) {

          await db.from('cases').update({ latitude: null, longitude: null }).eq('id', c.id);

          cleared++;

        } else {

          skipped++;

        }

        continue;

      }



      const { error } = await db

        .from('cases')

        .update({ latitude: coords.latitude, longitude: coords.longitude })

        .eq('id', c.id);



      if (error) skipped++;

      else updated++;

    }



    return { ok: true, updated, skipped, cleared, total: raw.length };

  }

}


