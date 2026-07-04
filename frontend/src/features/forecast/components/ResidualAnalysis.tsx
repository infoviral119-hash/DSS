import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ResidualAnalysis({ residuals }: { residuals: number[] }) {
  const histOpt = useMemo(() => ({
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    xAxis: { type: 'category', data: residuals.map((_, i) => String(i + 1)) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: residuals, itemStyle: { color: '#2563EB' } }],
  }), [residuals])

  const lineOpt = useMemo(() => ({
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    xAxis: { type: 'category', data: residuals.map((_, i) => String(i + 1)) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: residuals, itemStyle: { color: '#DC2626' }, markLine: { data: [{ yAxis: 0 }] } }],
  }), [residuals])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Residual Plot</CardTitle></CardHeader>
        <CardContent><ReactECharts option={lineOpt} style={{ height: 200 }} /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Error Distribution</CardTitle></CardHeader>
        <CardContent><ReactECharts option={histOpt} style={{ height: 200 }} /></CardContent>
      </Card>
    </div>
  )
}

export function FeatureImportance({ items }: { items: { name: string; value: number }[] }) {
  const opt = useMemo(() => ({
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', max: 1 },
    yAxis: { type: 'category', data: items.map((i) => i.name) },
    series: [{ type: 'bar', data: items.map((i) => i.value), itemStyle: { color: '#2563EB' } }],
  }), [items])

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Feature Importance</CardTitle></CardHeader>
      <CardContent><ReactECharts option={opt} style={{ height: 180 }} /></CardContent>
    </Card>
  )
}
