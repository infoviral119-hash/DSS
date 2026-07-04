import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QUICK_PERIODS, type QuickPeriod } from '@/features/reports/types/report'

interface QuickReportProps {
  period: QuickPeriod
  onChange: (period: QuickPeriod) => void
}

export function QuickReport({ period, onChange }: QuickReportProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Quick Report</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {QUICK_PERIODS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={period === p.id ? 'default' : 'outline'}
            onClick={() => onChange(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

export function ReportCategories({
  category,
  onChange,
}: {
  category: string
  onChange: (id: string) => void
}) {
  const cats = [
    'executive', 'operational', 'statistical', 'gis', 'forecast', 'ai_insight',
    'case', 'performance', 'monitoring', 'evaluation', 'audit',
  ]
  const labels: Record<string, string> = {
    executive: 'Executive', operational: 'Operational', statistical: 'Statistical',
    gis: 'GIS', forecast: 'Forecast', ai_insight: 'AI Insight', case: 'Case',
    performance: 'Performance', monitoring: 'Monitoring', evaluation: 'Evaluation', audit: 'Audit',
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Report Categories</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {cats.map((id) => (
          <Button
            key={id}
            size="sm"
            variant={category === id ? 'default' : 'secondary'}
            onClick={() => onChange(id)}
          >
            {labels[id]} Report
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
