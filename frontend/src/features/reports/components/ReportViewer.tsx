import { lazy, Suspense } from 'react'
import type { ReportIntelligence } from '@/features/reports/types/report'
import type { ReportWidgetId } from '@/features/reports/types/workflow'
import { ReportKPI } from '@/features/reports/components/ExecutiveSummary'
import { ReportCharts, ReportTables } from '@/features/reports/components/ReportCharts'
import { AIReport, GISReport, ForecastReport, ReportComparison } from '@/features/reports/components/AIReport'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const GisMiniMap = lazy(() => import('@/features/reports/components/GisMiniMap').then((m) => ({ default: m.GisMiniMap })))

interface ReportViewerProps {
  data: ReportIntelligence
  widgets: ReportWidgetId[]
  onDrill?: (field: 'kabupaten' | 'kecamatan', value: string) => void
}

export function ReportViewer({ data, widgets, onDrill }: ReportViewerProps) {
  const render = (id: ReportWidgetId) => {
    switch (id) {
      case 'kpi': return <ReportKPI key={id} kpi={data.kpi} />
      case 'chart_status':
      case 'chart_trend':
      case 'chart_jenis':
      case 'chart_kab':
        return widgets.indexOf(id) === widgets.findIndex((w) => w.startsWith('chart_')) ? (
          <ReportCharts key="charts" data={data} onDrill={onDrill} />
        ) : null
      case 'table_kab':
      case 'table_jenis':
        return widgets.indexOf(id) === widgets.findIndex((w) => w.startsWith('table_')) ? (
          <ReportTables key="tables" tables={data.tables} />
        ) : null
      case 'gis':
        return (
          <div key={id} className="space-y-2">
            <GISReport gis={data.gis} />
            <Suspense fallback={<p className="text-xs text-muted-foreground">Memuat peta...</p>}>
              <GisMiniMap points={(data.gis as { points?: { lat: number; lng: number }[] }).points ?? []} />
            </Suspense>
          </div>
        )
      case 'forecast': return <ForecastReport key={id} forecast={data.forecast} />
      case 'ai': return <AIReport key={id} data={data} />
      case 'narrative':
        return (
          <Card key={id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Report Narrative</CardTitle></CardHeader>
            <CardContent className="text-sm">{data.narrative}</CardContent>
          </Card>
        )
      case 'comparison': return <ReportComparison key={id} comparison={data.comparison} />
      default: return null
    }
  }

  const seen = new Set<string>()
  return (
    <div className="space-y-4">
      {widgets.map((w) => {
        const key = w.startsWith('chart_') ? 'charts' : w.startsWith('table_') ? 'tables' : w
        if (seen.has(key)) return null
        seen.add(key)
        return render(w)
      })}
    </div>
  )
}
