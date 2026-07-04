export const REPORT_WIDGETS = [
  { id: 'kpi', label: 'KPI Cards' },
  { id: 'chart_status', label: 'Chart Status' },
  { id: 'chart_trend', label: 'Chart Tren' },
  { id: 'chart_jenis', label: 'Chart Jenis' },
  { id: 'chart_kab', label: 'Chart Kabupaten' },
  { id: 'table_kab', label: 'Tabel Kabupaten' },
  { id: 'table_jenis', label: 'Tabel Jenis' },
  { id: 'gis', label: 'GIS Map' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'ai', label: 'AI Insight' },
  { id: 'narrative', label: 'Narasi' },
  { id: 'comparison', label: 'Perbandingan' },
] as const;

export type ReportWidgetId = (typeof REPORT_WIDGETS)[number]['id'];

export interface ReportSchedule {
  id: string;
  name: string;
  frequency: string;
  category: string;
  format: string;
  email: string;
  enabled: boolean;
  nextRun: string;
  lastRun?: string;
  createdBy: string;
}

export interface ReportLayout {
  id: string;
  name: string;
  widgets: string[];
  createdBy: string;
}

export interface ReportVersion {
  id: string;
  reportId: string;
  version: string;
  createdBy: string;
  createdAt: string;
  note?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  user: string;
  reportId?: string;
  format?: string;
  at: string;
  detail?: string;
}

export interface ShareLink {
  id: string;
  token: string;
  reportId: string;
  permission: string;
  watermark: string;
  expiresAt: string;
  url?: string;
}

export interface DigitalSignature {
  qrUrl: string;
  verificationUrl: string;
  hash: string;
  signedAt: string;
}

export interface TemplateConfig {
  primary: string;
  header: string;
  footer: string;
}
