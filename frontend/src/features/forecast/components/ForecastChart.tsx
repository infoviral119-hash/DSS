import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ForecastPoint } from '@/features/forecast/types/forecast'

export function ForecastChart({ series }: { series: ForecastPoint[] }) {
  const option = useMemo(() => {
    const labels = series.map((s) => s.month)
    const actual = series.map((s) => s.actual ?? null)
    const predicted = series.map((s) => s.predicted ?? null)
    const upper = series.map((s) => s.upper ?? null)
    const lower = series.map((s) => s.lower ?? null)

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Aktual', 'Forecast', 'Upper', 'Lower'], bottom: 0 },
      grid: { left: 48, right: 16, top: 32, bottom: 56 },
      xAxis: { type: 'category', data: labels, axisLabel: { rotate: 40, fontSize: 9 } },
      yAxis: { type: 'value', min: 0 },
      series: [
        { name: 'Aktual', type: 'line', data: actual, itemStyle: { color: '#2563EB' }, connectNulls: false },
        { name: 'Forecast', type: 'line', data: predicted, lineStyle: { type: 'dashed' }, itemStyle: { color: '#F59E0B' } },
        {
          name: 'CI Band',
          type: 'line',
          data: upper,
          lineStyle: { opacity: 0 },
          stack: 'ci',
          symbol: 'none',
          areaStyle: { color: 'rgba(37,99,235,0.08)' },
        },
        {
          name: 'Lower',
          type: 'line',
          data: lower,
          lineStyle: { opacity: 0 },
          stack: 'ci',
          symbol: 'none',
          areaStyle: { color: 'rgba(255,255,255,0.8)' },
        },
        { name: 'Upper', type: 'line', data: upper, lineStyle: { opacity: 0.3 }, symbol: 'none', itemStyle: { color: '#DC2626' } },
        { name: 'Lower', type: 'line', data: lower, lineStyle: { opacity: 0.3 }, symbol: 'none', itemStyle: { color: '#16A34A' } },
      ],
    }
  }, [series])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Forecast Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: 360 }} />
      </CardContent>
    </Card>
  )
}
