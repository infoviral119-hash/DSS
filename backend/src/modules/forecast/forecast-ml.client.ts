import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ModelMetrics } from './forecast-models';

export interface MlModelComparison {
  id: string;
  name: string;
  metrics: ModelMetrics;
  status: string;
  available: boolean;
}

export interface MlForecastResult {
  available: boolean;
  message?: string;
  model?: string;
  modelName?: string;
  fitted?: number[];
  forecast?: number[];
  lower?: number[];
  upper?: number[];
  metrics?: ModelMetrics;
  featureImportance?: { name: string; value: number }[];
  comparison?: MlModelComparison[];
}

@Injectable()
export class ForecastMlClient {
  private readonly logger = new Logger(ForecastMlClient.name);

  constructor(private config: ConfigService) {}

  private get baseUrl() {
    return this.config.get<string>('ML_SERVICE_URL') || 'http://localhost:8000';
  }

  async getStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return { connected: false, models: {} };
      const data = await res.json();
      return { connected: true, models: data.models ?? {} };
    } catch {
      return { connected: false, models: {} };
    }
  }

  async runForecast(input: {
    labels: string[];
    values: number[];
    horizon: number;
    confidence: number;
    model: string;
    holdout?: number;
  }): Promise<MlForecastResult> {
    try {
      const res = await fetch(`${this.baseUrl}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labels: input.labels,
          values: input.values,
          horizon: input.horizon,
          confidence: input.confidence,
          model: ['prophet', 'random_forest', 'xgboost', 'lstm', 'hybrid', 'auto'].includes(input.model)
            ? input.model
            : 'auto',
          holdout: input.holdout ?? 6,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        this.logger.warn(`ML service error: ${res.status}`);
        return { available: false, message: 'ML service tidak merespons' };
      }

      const data = await res.json();
      if (!data.available) {
        return { available: false, message: data.message ?? 'ML service unavailable' };
      }

      return {
        available: true,
        model: data.model,
        modelName: data.modelName,
        fitted: data.fitted,
        forecast: data.forecast,
        lower: data.lower,
        upper: data.upper,
        metrics: data.metrics,
        featureImportance: data.featureImportance,
        comparison: data.comparison,
      };
    } catch (err) {
      this.logger.warn(`ML service unreachable: ${err}`);
      return { available: false, message: 'ML service tidak berjalan' };
    }
  }
}
