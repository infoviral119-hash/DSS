import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import type { ReportIntelligence } from '@/features/reports/types/report'

export function ExecutiveSummary({ data }: { data: ReportIntelligence }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Executive Report Summary</CardTitle>
        <p className="text-xs text-muted-foreground">{data.periodLabel} · {data.reportId}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm leading-relaxed">
        {data.executiveSummary.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </CardContent>
    </Card>
  )
}

export function ReportKPI({ kpi }: { kpi: ReportIntelligence['kpi'] }) {
  const items = [
    { label: 'Total Kasus', value: formatNumber(kpi.total), color: '' },
    { label: 'Aktif', value: formatNumber(kpi.aktif), color: 'text-amber-600' },
    { label: 'Selesai', value: formatNumber(kpi.selesai), color: 'text-green-600' },
    { label: 'Completion Rate', value: `${kpi.completionRate}%`, color: 'text-primary' },
    { label: 'Top Kabupaten', value: kpi.topKabupaten, color: '' },
    { label: 'Top Jenis', value: kpi.topJenis, color: '' },
    { label: 'Top Kecamatan', value: kpi.topKecamatan, color: '' },
    { label: 'Forecast Next Month', value: kpi.forecastNextMonth != null ? formatNumber(kpi.forecastNextMonth) : '-', color: '' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className={`truncate text-lg font-bold ${item.color}`}>{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
