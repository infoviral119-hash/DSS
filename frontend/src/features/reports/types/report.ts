export type ReportCategory =
  | 'executive'
  | 'operational'
  | 'statistical'
  | 'gis'
  | 'forecast'
  | 'ai_insight'
  | 'case'
  | 'performance'
  | 'monitoring'
  | 'evaluation'
  | 'audit';

export type QuickPeriod = 'today' | 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'yearly' | 'custom';

export type ReportWatermark = 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC' | 'DRAFT';

export type ReportTemplate = 'kementerian' | 'pemda' | 'rs' | 'lbh' | 'internal' | 'publik';

export interface ReportIntelligence {
  generatedAt: string;
  reportId: string;
  version: string;
  category: string;
  role: string;
  template: string;
  watermark: string;
  periodLabel: string;
  metadata: {
    period: string;
    createdAt: string;
    createdBy: string;
    version: string;
    dataCount: number;
    filters: Record<string, string>;
    source: string;
  };
  approval: { status: string; reviewer: string | null; reviewedAt: string | null; note: string; history?: { status: string; by: string; at: string }[] };
  executiveSummary: string[];
  narrative: string;
  aiSummary: string[];
  roleSections: string[];
  kpi: {
    total: number;
    aktif: number;
    selesai: number;
    completionRate: number;
    topKabupaten: string;
    topJenis: string;
    topKecamatan: string;
    forecastNextMonth: number | null;
    decisionScore: number;
  };
  recommendations: {
    priorities: { name: string; score: number; explain: string[] }[];
    items: { title: string; actions: string[]; priority: string }[];
    risks: { name: string; score: number; level: string }[];
    actionPlan: { step: string; owner: string; timeline: string }[];
  };
  comparison: { label: string; before: number; after: number; deltaPct: number } | null;
  charts: Record<string, unknown>;
  tables: Record<string, { name: string; count: number }[]>;
  gis: Record<string, unknown>;
  forecast: Record<string, unknown> | null;
  ai: Record<string, unknown>;
  sections: string[];
  digitalSignature?: { qrUrl: string; hash: string; verificationUrl: string; signedAt: string };
  templateConfig?: { primary: string; header: string; footer: string };
  versionHistory?: { version: string; createdBy: string; createdAt: string; note?: string }[];
}

export interface ReportHistoryEntry {
  id: string;
  createdAt: string;
  createdBy: string;
  category: string;
  format: string;
  period: string;
  sizeKb: number;
  version: string;
  status: string;
}

export const REPORT_CATEGORIES: { id: ReportCategory; label: string }[] = [
  { id: 'executive', label: 'Executive Report' },
  { id: 'operational', label: 'Operational Report' },
  { id: 'statistical', label: 'Statistical Report' },
  { id: 'gis', label: 'GIS Report' },
  { id: 'forecast', label: 'Forecast Report' },
  { id: 'ai_insight', label: 'AI Insight Report' },
  { id: 'case', label: 'Case Report' },
  { id: 'performance', label: 'Performance Report' },
  { id: 'monitoring', label: 'Monitoring Report' },
  { id: 'evaluation', label: 'Evaluation Report' },
  { id: 'audit', label: 'Audit Report' },
];

export const QUICK_PERIODS: { id: QuickPeriod; label: string }[] = [
  { id: 'today', label: 'Laporan Hari Ini' },
  { id: 'weekly', label: 'Laporan Mingguan' },
  { id: 'monthly', label: 'Laporan Bulanan' },
  { id: 'quarterly', label: 'Laporan Triwulan' },
  { id: 'semester', label: 'Laporan Semester' },
  { id: 'yearly', label: 'Laporan Tahunan' },
  { id: 'custom', label: 'Custom Period' },
];

export const WATERMARK_OPTIONS: ReportWatermark[] = ['CONFIDENTIAL', 'INTERNAL', 'PUBLIC', 'DRAFT'];

export const TEMPLATE_OPTIONS: { id: ReportTemplate; label: string }[] = [
  { id: 'kementerian', label: 'Kementerian' },
  { id: 'pemda', label: 'Pemerintah Daerah' },
  { id: 'rs', label: 'Rumah Sakit' },
  { id: 'lbh', label: 'LBH' },
  { id: 'internal', label: 'Internal' },
  { id: 'publik', label: 'Publik' },
];
