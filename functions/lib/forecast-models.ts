export interface SeriesFit {
  fitted: number[];
  forecast: number[];
}

export interface ModelMetrics {
  mape: number;
  mae: number;
  rmse: number;
  r2: number;
  accuracy: number;
  bias: number;
  aic?: number;
  bic?: number;
}

export function computeMetrics(actual: number[], predicted: number[]): ModelMetrics {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return { mape: 0, mae: 0, rmse: 0, r2: 0, accuracy: 0, bias: 0 };

  let se = 0;
  let ae = 0;
  let apeSum = 0;
  let apeN = 0;
  let bias = 0;
  const yMean = actual.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    const e = actual[i] - predicted[i];
    se += e * e;
    ae += Math.abs(e);
    bias += e;
    if (actual[i] !== 0) {
      apeSum += Math.abs(e / actual[i]);
      apeN++;
    }
    ssRes += e * e;
    ssTot += (actual[i] - yMean) ** 2;
  }

  const mae = ae / n;
  const rmse = Math.sqrt(se / n);
  const mape = apeN ? (apeSum / apeN) * 100 : 0;
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const accuracy = Math.max(0, Math.min(100, 100 - mape));

  return {
    mape: Math.round(mape * 10) / 10,
    mae: Math.round(mae * 10) / 10,
    rmse: Math.round(rmse * 10) / 10,
    r2: Math.round(r2 * 1000) / 1000,
    accuracy: Math.round(accuracy * 10) / 10,
    bias: Math.round((bias / n) * 10) / 10,
  };
}

function padForecast(fitted: number[], values: number[], horizon: number): SeriesFit {
  const last = fitted.length ? fitted[fitted.length - 1] : values[values.length - 1] ?? 0;
  const forecast = Array.from({ length: horizon }, () => Math.max(0, Math.round(last)));
  return { fitted, forecast };
}

export function movingAverage(values: number[], window: number, horizon: number): SeriesFit {
  const w = Math.min(window, values.length);
  const fitted: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - w + 1);
    const slice = values.slice(start, i + 1);
    fitted.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  const last = fitted[fitted.length - 1] ?? 0;
  const trend = values.length >= 2 ? (values[values.length - 1] - values[0]) / (values.length - 1) : 0;
  const forecast = Array.from({ length: horizon }, (_, i) => Math.max(0, Math.round(last + trend * (i + 1))));
  return { fitted, forecast };
}

export function weightedMovingAverage(values: number[], horizon: number): SeriesFit {
  const w = Math.min(6, values.length);
  const fitted: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - w + 1);
    const slice = values.slice(start, i + 1);
    let ws = 0;
    let wt = 0;
    slice.forEach((v, j) => {
      const weight = j + 1;
      ws += v * weight;
      wt += weight;
    });
    fitted.push(wt ? ws / wt : 0);
  }
  const last = fitted[fitted.length - 1] ?? 0;
  const forecast = Array.from({ length: horizon }, (_, i) => Math.max(0, Math.round(last * (1 + 0.02 * (i + 1)))));
  return { fitted, forecast };
}

export function ses(values: number[], alpha = 0.3, horizon: number): SeriesFit {
  const fitted: number[] = [values[0] ?? 0];
  for (let i = 1; i < values.length; i++) {
    fitted.push(alpha * values[i] + (1 - alpha) * fitted[i - 1]);
  }
  const last = fitted[fitted.length - 1] ?? 0;
  return { fitted, forecast: Array.from({ length: horizon }, () => Math.max(0, Math.round(last))) };
}

export function holt(values: number[], alpha = 0.3, beta = 0.1, horizon: number): SeriesFit {
  if (!values.length) return { fitted: [], forecast: [] };
  let level = values[0];
  let trend = values.length > 1 ? values[1] - values[0] : 0;
  const fitted: number[] = [level];
  for (let i = 1; i < values.length; i++) {
    const prevLevel = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(level);
  }
  const forecast = Array.from({ length: horizon }, (_, i) => Math.max(0, Math.round(level + trend * (i + 1))));
  return { fitted, forecast };
}

export function holtWinters(values: number[], seasonLen: number, horizon: number): SeriesFit {
  if (values.length < seasonLen * 2) return holt(values, 0.3, 0.1, horizon);
  const alpha = 0.3;
  const beta = 0.1;
  const gamma = 0.2;
  const seasons: number[] = [];
  for (let i = 0; i < seasonLen; i++) {
    seasons.push(values[i] || 1);
  }
  let level = values[0];
  let trend = 0;
  const fitted: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const s = seasons[i % seasonLen];
    const val = values[i];
    const lastLevel = level;
    level = alpha * (val / Math.max(s, 0.01)) + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
    seasons[i % seasonLen] = gamma * (val / Math.max(level, 0.01)) + (1 - gamma) * s;
    fitted.push(level * s);
  }
  const forecast: number[] = [];
  for (let i = 0; i < horizon; i++) {
    const s = seasons[(values.length + i) % seasonLen];
    forecast.push(Math.max(0, Math.round((level + trend * (i + 1)) * s)));
  }
  return { fitted, forecast };
}

export function arima(values: number[], horizon: number): SeriesFit {
  if (values.length < 3) return movingAverage(values, 3, horizon);
  const diff: number[] = [];
  for (let i = 1; i < values.length; i++) diff.push(values[i] - values[i - 1]);
  const mean = diff.reduce((a, b) => a + b, 0) / diff.length;
  let num = 0;
  let den = 0;
  for (let i = 1; i < diff.length; i++) {
    num += (diff[i] - mean) * (diff[i - 1] - mean);
    den += (diff[i - 1] - mean) ** 2;
  }
  const phi = den ? num / den : 0;
  const fitted: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    const pred = values[i - 1] + phi * (values[i - 1] - (values[i - 2] ?? values[i - 1]));
    fitted.push(pred);
  }
  let last = values[values.length - 1];
  let prev = values[values.length - 2] ?? last;
  const forecast: number[] = [];
  for (let i = 0; i < horizon; i++) {
    const next = last + phi * (last - prev);
    forecast.push(Math.max(0, Math.round(next)));
    prev = last;
    last = next;
  }
  return { fitted, forecast };
}

export function sarima(values: number[], horizon: number): SeriesFit {
  const season = Math.min(12, Math.max(4, Math.floor(values.length / 3)));
  return holtWinters(values, season, horizon);
}

export function linearRegression(values: number[], horizon: number): SeriesFit {
  const n = values.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (values[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den ? num / den : 0;
  const intercept = yMean - slope * xMean;
  const fitted = xs.map((x) => intercept + slope * x);
  const forecast = Array.from({ length: horizon }, (_, i) =>
    Math.max(0, Math.round(intercept + slope * (n + i))),
  );
  return { fitted, forecast };
}

export function polynomialRegression(values: number[], horizon: number): SeriesFit {
  const n = values.length;
  if (n < 4) return linearRegression(values, horizon);
  const xs = Array.from({ length: n }, (_, i) => i);
  const fitted = xs.map((x) => {
    const t = x / Math.max(n - 1, 1);
    return values[0] + (values[n - 1] - values[0]) * t + (values[Math.floor(n / 2)] - values[0]) * t * (1 - t) * 2;
  });
  const forecast = Array.from({ length: horizon }, (_, i) => {
    const x = n + i;
    const t = x / (n + horizon - 1);
    return Math.max(0, Math.round(values[0] + (values[n - 1] - values[0]) * t));
  });
  return { fitted, forecast };
}

export function runModel(id: string, values: number[], horizon: number): SeriesFit {
  switch (id) {
    case 'moving_average': return movingAverage(values, 3, horizon);
    case 'wma': return weightedMovingAverage(values, horizon);
    case 'ses': return ses(values, 0.35, horizon);
    case 'des': return holt(values, 0.35, 0.15, horizon);
    case 'holt': return holt(values, 0.3, 0.1, horizon);
    case 'holt_winters': return holtWinters(values, 12, horizon);
    case 'arima': return arima(values, horizon);
    case 'sarima': return sarima(values, horizon);
    case 'linear_regression': return linearRegression(values, horizon);
    case 'polynomial_regression': return polynomialRegression(values, horizon);
    default: return padForecast([], values, horizon);
  }
}

export function zScore(confidence: number) {
  if (confidence >= 99) return 2.576;
  if (confidence >= 95) return 1.96;
  if (confidence >= 90) return 1.645;
  return 1.28;
}

export function statusFromMape(mape: number): 'excellent' | 'good' | 'fair' {
  if (mape <= 5) return 'excellent';
  if (mape <= 12) return 'good';
  return 'fair';
}
