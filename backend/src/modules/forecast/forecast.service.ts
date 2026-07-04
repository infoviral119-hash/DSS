import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { applyCaseFilters, parseCaseFilters } from '../../common/case-filters';
import { runForecastEngine, forecastByRegions, extractMonthlySeries } from './forecast.engine';
import { ForecastMlClient } from './forecast-ml.client';

const ML_MODELS = new Set(['prophet', 'random_forest', 'xgboost', 'lstm', 'hybrid']);

@Injectable()
export class ForecastService {
  constructor(
    private supabase: SupabaseService,
    private mlClient: ForecastMlClient,
  ) {}

  private async loadCases(query: Record<string, string | undefined>) {
    const filters = parseCaseFilters(query);
    const db = this.supabase.db;
    if (!db) return { cases: [], connected: false };

    const { data } = await db
      .from('cases')
      .select('tanggal, tahun, kabupaten, kecamatan, provinsi, jenis_kekerasan, jenis_kelamin, status')
      .order('tanggal', { ascending: true });

    return { cases: applyCaseFilters(data ?? [], filters), connected: true };
  }

  async getMlStatus() {
    return this.mlClient.getStatus();
  }

  async getIntelligence(query: Record<string, string | undefined>) {
    const { cases, connected } = await this.loadCases(query);
    if (!connected) return { connected: false, insufficient: true, message: 'Database tidak terhubung' };

    const horizon = Math.min(24, Math.max(1, Number(query.horizon) || 6));
    const confidence = [80, 90, 95, 99].includes(Number(query.confidence)) ? Number(query.confidence) : 95;
    const model = query.model || 'auto';
    const dimension = query.dimension || 'global';
    const dimensionValue = query.dimensionValue || undefined;

    const { labels, values } = extractMonthlySeries(cases, dimension, dimensionValue);
    const holdout = Math.min(6, Math.max(2, Math.floor(values.length / 4)));

    const mlModelParam = ML_MODELS.has(model) || model === 'auto' ? model : 'auto';
    let mlResult = values.length >= 3
      ? await this.mlClient.runForecast({ labels, values, horizon, confidence, model: mlModelParam, holdout })
      : { available: false };

    const engineInput = { cases, horizon, confidence, model, dimension, dimensionValue };
    let result = runForecastEngine(engineInput, mlResult);

    const picked = String((result as { model?: string }).model ?? '');
    if (model === 'auto' && ML_MODELS.has(picked) && mlResult.available && mlResult.model !== picked) {
      mlResult = await this.mlClient.runForecast({
        labels, values, horizon, confidence, model: picked, holdout,
      });
      result = runForecastEngine(engineInput, mlResult);
    }

    const regional = forecastByRegions(cases, Math.min(horizon, 3));
    const mlStatus = await this.mlClient.getStatus();

    return { ...result, regional, mlService: mlStatus };
  }
}
