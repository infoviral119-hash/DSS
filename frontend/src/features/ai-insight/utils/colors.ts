import type { Severity } from '@/features/ai-insight/types/ai-insight'

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#DC2626',
  high: '#F59E0B',
  medium: '#2563EB',
  low: '#16A34A',
}

export const SEVERITY_BG: Record<Severity, string> = {
  critical: 'bg-red-50 border-red-200',
  high: 'bg-orange-50 border-orange-200',
  medium: 'bg-blue-50 border-blue-200',
  low: 'bg-green-50 border-green-200',
}

export function riskLevelColor(score: number) {
  if (score >= 80) return SEVERITY_COLORS.critical
  if (score >= 60) return SEVERITY_COLORS.high
  if (score >= 40) return SEVERITY_COLORS.medium
  return SEVERITY_COLORS.low
}
