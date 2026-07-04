import type { Severity } from '@/features/ai-insight/types/ai-insight'
import { SEVERITY_BG } from '@/features/ai-insight/utils/colors'

const LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SEVERITY_BG[severity]}`}>
      {LABELS[severity]}
    </span>
  )
}

export function ConfidenceIndicator({ value }: { value: number }) {
  return (
    <span className="text-[10px] text-muted-foreground">
      Confidence <span className="font-semibold text-foreground">{value}%</span>
    </span>
  )
}
