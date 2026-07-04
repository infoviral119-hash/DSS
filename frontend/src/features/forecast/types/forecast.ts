export type ForecastModelId =
  | 'auto'
  | 'moving_average'
  | 'wma'
  | 'ses'
  | 'des'
  | 'holt'
  | 'holt_winters'
  | 'arima'
  | 'sarima'
  | 'linear_regression'
  | 'polynomial_regression'
  | 'prophet'
  | 'random_forest'
  | 'xgboost'
  | 'lstm'
  | 'hybrid';

export interface ForecastPoint {
  month: string;
  actual?: number;
  predicted?: number;
  lower?: number;
  upper?: number;
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

export interface ModelComparisonRow {
  id: ForecastModelId;
  name: string;
  metrics: ModelMetrics;
  status: 'best' | 'excellent' | 'good' | 'fair' | 'unavailable';
  available: boolean;
}

export interface ForecastIntelligenceResponse {
  generatedAt: string;
  connected: boolean;
  model: ForecastModelId;
  modelName: string;
  autoSelected: boolean;
  horizon: number;
  confidenceLevel: number;
  dimension: string;
  dimensionValue?: string;
  executiveSummary: string[];
  narrative: string;
  trendClass: string;
  seasonality: { detected: boolean; pattern?: string };
  forecastQuality: { score: number; label: string };
  nextMonth: { month: string; predicted: number; lower: number; upper: number };
  nextQuarter: number;
  nextYear: number;
  metrics: ModelMetrics;
  comparison: ModelComparisonRow[];
  series: ForecastPoint[];
  residuals: number[];
  earlyWarnings: { region: string; growthPct: number; months: number; message: string }[];
  recommendations: string[];
  scenarios: { label: string; before: string; after: string; delta: string }[];
  explain: string[];
  featureImportance: { name: string; value: number }[];
  calendar: { month: string; predicted: number; lower: number; upper: number }[]
  insufficient?: boolean
  message?: string
  regional?: { name: string; current: number; forecast: number; growthPct: number }[]
  mlService?: { connected: boolean; models?: Record<string, boolean>; message?: string }
}

export const MODEL_OPTIONS: { id: ForecastModelId; name: string; available: boolean }[] = [
  { id: 'auto', name: 'Auto Select Best Model', available: true },
  { id: 'moving_average', name: 'Moving Average', available: true },
  { id: 'wma', name: 'Weighted Moving Average', available: true },
  { id: 'ses', name: 'Simple Exponential Smoothing', available: true },
  { id: 'des', name: 'Double Exponential Smoothing', available: true },
  { id: 'holt', name: 'Holt', available: true },
  { id: 'holt_winters', name: 'Holt-Winters', available: true },
  { id: 'arima', name: 'ARIMA', available: true },
  { id: 'sarima', name: 'SARIMA', available: true },
  { id: 'linear_regression', name: 'Linear Regression', available: true },
  { id: 'polynomial_regression', name: 'Polynomial Regression', available: true },
  { id: 'prophet', name: 'Prophet', available: true },
  { id: 'random_forest', name: 'Random Forest', available: true },
  { id: 'xgboost', name: 'XGBoost', available: true },
  { id: 'lstm', name: 'LSTM', available: true },
  { id: 'hybrid', name: 'Hybrid Forecast', available: true },
];

export const HORIZON_OPTIONS = [1, 3, 6, 12, 24];
export const CONFIDENCE_OPTIONS = [80, 90, 95, 99];
export const DIMENSION_OPTIONS = [
  { id: 'global', label: 'Global' },
  { id: 'provinsi', label: 'Provinsi' },
  { id: 'kabupaten', label: 'Kabupaten' },
  { id: 'kecamatan', label: 'Kecamatan' },
  { id: 'jenis_kekerasan', label: 'Jenis Kekerasan' },
  { id: 'jenis_kelamin', label: 'Gender' },
  { id: 'status', label: 'Status' },
];
