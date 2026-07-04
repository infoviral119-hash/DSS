export const DEFAULT_COLUMNS = [
  { key: 'register', label: 'Register', default: true },
  { key: 'tanggal', label: 'Tanggal', default: true },
  { key: 'korban', label: 'Korban', default: true },
  { key: 'usia', label: 'Usia', default: true },
  { key: 'gender', label: 'Gender', default: true },
  { key: 'jenis', label: 'Jenis', default: true },
  { key: 'kabupaten', label: 'Kabupaten', default: true },
  { key: 'status', label: 'Status', default: true },
  { key: 'riskScore', label: 'Risk Score', default: true },
  { key: 'lastUpdate', label: 'Last Update', default: true },
  { key: 'psikolog', label: 'Psikolog', default: false },
  { key: 'pendidikan', label: 'Pendidikan', default: false },
  { key: 'kecamatan', label: 'Kecamatan', default: false },
] as const;

export const RISK_COLORS: Record<string, string> = {
  Low: 'bg-emerald-500/10 text-emerald-600',
  Medium: 'bg-amber-500/10 text-amber-600',
  High: 'bg-orange-500/10 text-orange-600',
  Critical: 'bg-red-500/10 text-red-600',
};
