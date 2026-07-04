import {
  computeMetrics,
  runModel,
  zScore,
  statusFromMape,
  type ModelMetrics,
} from './forecast-models';
import type { MlForecastResult } from './forecast-ml.client';

type CaseRow = Record<string, unknown>;

const ML_MODELS = ['prophet', 'random_forest', 'xgboost', 'lstm', 'hybrid'] as const;

const MODEL_NAMES: Record<string, string> = {
  moving_average: 'Moving Average',
  wma: 'Weighted Moving Average',
  ses: 'Simple Exponential Smoothing',
  des: 'Double Exponential Smoothing',
  holt: 'Holt',
  holt_winters: 'Holt-Winters',
  arima: 'ARIMA',
  sarima: 'SARIMA',
  linear_regression: 'Linear Regression',
  polynomial_regression: 'Polynomial Regression',
  prophet: 'Prophet',
  random_forest: 'Random Forest Regression',
  xgboost: 'XGBoost Regression',
  lstm: 'LSTM',
  hybrid: 'Hybrid Forecast',
};

const AVAILABLE_MODELS = Object.keys(MODEL_NAMES).filter(
  (id) => !ML_MODELS.includes(id as (typeof ML_MODELS)[number]),
);

export interface ForecastEngineInput {
  cases: CaseRow[];
  horizon: number;
  confidence: number;
  model: string;
  dimension: string;
  dimensionValue?: string;
}

function monthKey(d: string) {
  return String(d).slice(0, 7);
}

function buildMonthlySeries(cases: CaseRow[], dimension: string, dimensionValue?: string) {
  const byMonth: Record<string, number> = {};
  for (const c of cases) {
    if (dimension !== 'global' && dimensionValue) {
      const val = String(c[dimension] || '');
      if (val !== dimensionValue) continue;
    }
    const m = monthKey(String(c.tanggal));
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  }
  const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
  return { labels: sorted.map(([m]) => m), values: sorted.map(([, v]) => v) };
}

export function extractMonthlySeries(cases: CaseRow[], dimension: string, dimensionValue?: string) {
  return buildMonthlySeries(cases, dimension, dimensionValue);
}

function classifyTrend(values: number[]) {
  if (values.length < 3) return 'Stable';
  const n = values.length;
  const slope = (values[n - 1] - values[0]) / (n - 1);
  const avg = values.reduce((a, b) => a + b, 0) / n;
  const pct = avg ? (slope / avg) * 100 : 0;
  if (pct > 8) return 'Strong Uptrend';
  if (pct > 3) return 'Moderate Uptrend';
  if (pct < -8) return 'Strong Downtrend';
  if (pct < -3) return 'Moderate Downtrend';
  return 'Stable';
}

function detectSeasonality(labels: string[], values: number[]) {
  if (values.length < 12) return { detected: false };
  const byMonthNum: Record<number, number[]> = {};
  labels.forEach((l, i) => {
    const m = parseInt(l.slice(5, 7), 10);
    if (!byMonthNum[m]) byMonthNum[m] = [];
    byMonthNum[m].push(values[i]);
  });
  const avgs = Object.entries(byMonthNum).map(([m, arr]) => ({
    m: Number(m),
    avg: arr.reduce((a, b) => a + b, 0) / arr.length,
  }));
  avgs.sort((a, b) => b.avg - a.avg);
  const top = avgs[0];
  const globalAvg = values.reduce((a, b) => a + b, 0) / values.length;
  if (top && top.avg > globalAvg * 1.25) {
    const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return { detected: true, pattern: `Pola muncul setiap ${months[top.m]}.` };
  }
  return { detected: false };
}

function addMonths(label: string, offset: number) {
  const d = new Date(`${label}-01`);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

export function runForecastEngine(input: ForecastEngineInput, mlResult?: MlForecastResult) {
  const { cases, horizon, confidence, dimension, dimensionValue } = input;
  let model = input.model === 'auto' ? '' : input.model;

  const { labels, values } = buildMonthlySeries(cases, dimension, dimensionValue);

  if (values.length < 3) {
    return {
      connected: true,
      insufficient: true,
      message: 'Data historis minimal 3 bulan diperlukan untuk forecast.',
      series: labels.map((month, i) => ({ month, actual: values[i] })),
    };
  }

  const mlRequested = ML_MODELS.includes(model as (typeof ML_MODELS)[number]);
  if (mlRequested && (!mlResult?.available || !mlResult.fitted)) {
    return {
      connected: true,
      insufficient: true,
      message: mlResult?.message ?? 'ML service tidak berjalan. Jalankan ml-service di port 8000.',
    };
  }

  const holdout = Math.min(6, Math.max(2, Math.floor(values.length / 4)));
  const trainValues = values.slice(0, -holdout);
  const testValues = values.slice(-holdout);

  const comparison: {
    id: string;
    name: string;
    metrics: ModelMetrics;
    status: string;
    available: boolean;
  }[] = AVAILABLE_MODELS.map((id) => {
    const fit = runModel(id, trainValues, holdout);
    const preds = fit.forecast.slice(0, holdout);
    const metrics = computeMetrics(testValues, preds);
    return {
      id,
      name: MODEL_NAMES[id],
      metrics,
      status: statusFromMape(metrics.mape),
      available: true,
    };
  });

  if (mlResult?.available && mlResult.comparison?.length) {
    comparison.push(...mlResult.comparison.map((row) => ({
      id: row.id,
      name: row.name,
      metrics: row.metrics,
      status: row.status as 'excellent' | 'good' | 'fair' | 'best',
      available: true,
    })));
  } else {
    for (const id of ML_MODELS) {
      comparison.push({
        id,
        name: MODEL_NAMES[id],
        metrics: { mape: 0, mae: 0, rmse: 0, r2: 0, accuracy: 0, bias: 0 },
        status: 'fair' as const,
        available: false,
      });
    }
  }

  comparison.sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    return a.metrics.mape - b.metrics.mape;
  });
  comparison.forEach((c, i) => {
    if (c.available) c.status = i === 0 ? 'best' : statusFromMape(c.metrics.mape);
  });

  if (!model || model === 'auto') model = comparison.find((c) => c.available)?.id ?? 'holt';
  const best = comparison.find((c) => c.id === model && c.available) ?? comparison.find((c) => c.available) ?? comparison[0];

  const useMlFit = ML_MODELS.includes(model as (typeof ML_MODELS)[number]) && mlResult?.available && mlResult.fitted && mlResult.forecast;
  const fullFit = useMlFit
    ? { fitted: mlResult.fitted!, forecast: mlResult.forecast! }
    : runModel(model, values, horizon);

  const fittedMetrics = useMlFit && mlResult?.metrics
    ? mlResult.metrics
    : computeMetrics(values, fullFit.fitted);
  const residuals = values.map((v, i) => v - (fullFit.fitted[i] ?? v));
  const stdErr = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(residuals.length, 1));
  const z = zScore(confidence);

  const lastLabel = labels[labels.length - 1];
  const forecastLabels = Array.from({ length: horizon }, (_, i) => addMonths(lastLabel, i + 1));

  const series = [
    ...labels.map((month, i) => ({
      month,
      actual: values[i],
      predicted: Math.round(fullFit.fitted[i] ?? values[i]),
    })),
    ...forecastLabels.map((month, i) => {
      const pred = fullFit.forecast[i] ?? 0;
      const mlLower = useMlFit ? mlResult?.lower?.[i] : undefined;
      const mlUpper = useMlFit ? mlResult?.upper?.[i] : undefined;
      const band = Math.round(z * stdErr);
      return {
        month,
        predicted: pred,
        lower: mlLower ?? Math.max(0, pred - band),
        upper: mlUpper ?? pred + band,
      };
    }),
  ];

  const nextMonth = series.find((p): p is { month: string; predicted: number; lower: number; upper: number } =>
    p.predicted != null && !('actual' in p && p.actual != null),
  );
  const nextQuarter = fullFit.forecast.slice(0, 3).reduce((a, b) => a + b, 0);
  const nextYear = fullFit.forecast.slice(0, 12).reduce((a, b) => a + b, 0);

  const trendClass = classifyTrend(values);
  const seasonality = detectSeasonality(labels, values);
  const qualityScore = Math.round(best?.metrics.accuracy ?? fittedMetrics.accuracy);
  const qualityLabel = qualityScore >= 90 ? 'Excellent' : qualityScore >= 75 ? 'Good' : 'Fair';

  const kabSeries = new Map<string, number[]>();
  if (dimension === 'global') {
    const kabs = new Set(cases.map((c) => String(c.kabupaten || 'Tidak diketahui')));
    for (const kab of kabs) {
      const s = buildMonthlySeries(cases, 'kabupaten', kab);
      if (s.values.length >= 3) {
        const f = runModel('holt', s.values, 3);
        const growth = s.values.length >= 2
          ? Math.round(((f.forecast[2] - s.values[s.values.length - 1]) / Math.max(s.values[s.values.length - 1], 1)) * 100)
          : 0;
        if (growth > 10) kabSeries.set(kab, [growth]);
      }
    }
  }

  const earlyWarnings = [...kabSeries.entries()]
    .sort((a, b) => b[1][0] - a[1][0])
    .slice(0, 3)
    .map(([region, g]) => ({
      region,
      growthPct: g[0],
      months: 3,
      message: `${region} diperkirakan mengalami kenaikan ${g[0]}% dalam 3 bulan.`,
    }));

  const executiveSummary = [
    `Forecast ${horizon} bulan menunjukkan tren ${trendClass.toLowerCase()}.`,
    nextMonth
      ? `Estimasi ${nextMonth.month}: ${nextMonth.predicted} kasus (CI ${confidence}%).`
      : '',
    `Model terbaik: ${MODEL_NAMES[model] ?? model}.`,
    `MAPE: ${best?.metrics.mape ?? fittedMetrics.mape}% · Akurasi: ${best?.metrics.accuracy ?? fittedMetrics.accuracy}%.`,
    `Forecast Quality: ${qualityScore}/100 (${qualityLabel}).`,
  ].filter(Boolean);

  const narrative = [
    `Forecast menunjukkan jumlah kasus diperkirakan ${trendClass.includes('Up') ? 'meningkat' : trendClass.includes('Down') ? 'menurun' : 'stabil'} selama ${horizon} bulan mendatang.`,
    `Model ${MODEL_NAMES[model]} dipilih karena tingkat kesalahan terendah (MAPE ${best?.metrics.mape ?? fittedMetrics.mape}%).`,
    `Confidence Interval ${confidence}%.`,
    earlyWarnings[0] ? `${earlyWarnings[0].region} diprediksi menjadi area dengan tekanan tertinggi.` : '',
  ].filter(Boolean).join(' ');

  const recommendations: string[] = [];
  if (trendClass.includes('Up')) {
    recommendations.push('Forecast menunjukkan peningkatan signifikan.');
    recommendations.push('Disarankan tambah kapasitas psikolog dan advokat.');
    if (earlyWarnings[0]) recommendations.push(`Prioritaskan ${earlyWarnings[0].region}.`);
    recommendations.push('Lakukan monitoring mingguan.');
  } else {
    recommendations.push('Pertahankan program pencegahan yang berjalan.');
    recommendations.push('Evaluasi efektivitas intervensi triwulanan.');
  }

  const scenarios = [
    {
      label: 'Jika jumlah psikolog bertambah',
      before: `${cases.filter((c) => c.status !== 'Selesai').length} aktif`,
      after: `${Math.max(0, Math.round(cases.filter((c) => c.status !== 'Selesai').length * 0.85))} aktif`,
      delta: 'Backlog turun ~15%',
    },
    {
      label: 'Jika program sosialisasi meningkat',
      before: `${nextMonth?.predicted ?? 0} kasus/bulan`,
      after: `${Math.max(0, Math.round((nextMonth?.predicted ?? 0) * 0.85))} kasus/bulan`,
      delta: 'Forecast turun ~15%',
    },
  ];

  const explain = [
    `Mengapa forecast ${trendClass.includes('Up') ? 'naik' : 'berubah'}?`,
    values.length >= 5 ? `Kasus bergerak ${trendClass.toLowerCase()} dalam ${values.length} bulan terakhir.` : '',
    seasonality.detected ? seasonality.pattern ?? '' : 'Tidak ditemukan seasonality kuat.',
    earlyWarnings[0] ? `${earlyWarnings[0].region} menunjukkan momentum naik.` : '',
  ].filter(Boolean);

  return {
    connected: true,
    insufficient: false,
    generatedAt: new Date().toISOString(),
    model,
    modelName: MODEL_NAMES[model] ?? mlResult?.modelName ?? model,
    autoSelected: input.model === 'auto',
    horizon,
    confidenceLevel: confidence,
    dimension,
    dimensionValue,
    executiveSummary,
    narrative,
    trendClass,
    seasonality,
    forecastQuality: { score: qualityScore, label: qualityLabel },
    nextMonth: nextMonth ?? { month: '', predicted: 0, lower: 0, upper: 0 },
    nextQuarter,
    nextYear,
    metrics: best?.available ? best.metrics : fittedMetrics,
    comparison: [...comparison],
    mlService: {
      connected: mlResult?.available ?? false,
      message: mlResult?.available ? undefined : mlResult?.message,
    },
    series,
    residuals,
    earlyWarnings,
    recommendations,
    scenarios,
    explain,
    featureImportance: useMlFit && mlResult?.featureImportance?.length
      ? mlResult.featureImportance
      : [
        { name: 'Tren Waktu', value: 0.42 },
        { name: 'Bulan (Seasonality)', value: seasonality.detected ? 0.28 : 0.1 },
        { name: dimension === 'kabupaten' ? 'Kabupaten' : 'Wilayah', value: 0.18 },
        { name: 'Jenis Kekerasan', value: 0.12 },
      ],
    calendar: forecastLabels.map((month, i) => {
      const pred = fullFit.forecast[i] ?? 0;
      const mlLower = useMlFit ? mlResult?.lower?.[i] : undefined;
      const mlUpper = useMlFit ? mlResult?.upper?.[i] : undefined;
      const band = Math.round(z * stdErr);
      return {
        month,
        predicted: pred,
        lower: mlLower ?? Math.max(0, pred - band),
        upper: mlUpper ?? pred + band,
      };
    }),
  };
}

export function forecastByRegions(cases: CaseRow[], horizon: number) {
  const kabs = [...new Set(cases.map((c) => String(c.kabupaten || 'Tidak diketahui')))].filter((k) => k !== 'Tidak diketahui');
  return kabs.slice(0, 8).map((kab) => {
    const { values } = buildMonthlySeries(cases, 'kabupaten', kab);
    const fit = runModel('holt', values, horizon);
    const last = values[values.length - 1] ?? 0;
    const next = fit.forecast[0] ?? last;
    const growth = last ? Math.round(((next - last) / last) * 100) : 0;
    return { name: kab, current: last, forecast: next, growthPct: growth };
  }).sort((a, b) => b.growthPct - a.growthPct);
}
