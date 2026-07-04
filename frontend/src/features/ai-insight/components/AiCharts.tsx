import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AiIntelligenceResponse } from '@/features/ai-insight/types/ai-insight'
import { riskLevelColor } from '@/features/ai-insight/utils/colors'

export function AiCharts({ data }: { data: AiIntelligenceResponse['chartData'] }) {
  const trendOpt = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    xAxis: { type: 'category', data: data.trendByYear.map((d) => String(d.year)) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', smooth: true, data: data.trendByYear.map((d) => d.count), areaStyle: { opacity: 0.15 }, itemStyle: { color: '#2563EB' } }],
  }), [data.trendByYear])

  const gaugeOpt = useMemo(() => ({
    series: [{
      type: 'gauge',
      min: 0, max: 100,
      progress: { show: true, width: 10 },
      axisLine: { lineStyle: { width: 10 } },
      detail: { formatter: '{value}', fontSize: 18 },
      data: [{ value: data.riskGauge, itemStyle: { color: riskLevelColor(data.riskGauge) } }],
    }],
  }), [data.riskGauge])

  const priorityOpt = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: data.priorityBars.map((d) => d.name), axisLabel: { fontSize: 9 } },
    series: [{ type: 'bar', data: data.priorityBars.map((d) => d.score), itemStyle: { color: '#F59E0B' } }],
  }), [data.priorityBars])

  const treemapOpt = useMemo(() => ({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'treemap',
      data: data.jenisDistribution.map((d) => ({ name: d.name, value: d.value })),
      label: { fontSize: 9 },
    }],
  }), [data.jenisDistribution])

  const heatOpt = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 16, bottom: 40 },
    xAxis: { type: 'category', data: data.trendByMonth.map((d) => d.month), axisLabel: { rotate: 35, fontSize: 8 } },
    yAxis: { type: 'value' },
    visualMap: { min: 0, max: Math.max(...data.trendByMonth.map((d) => d.count), 1), show: false, inRange: { color: ['#16A34A', '#F59E0B', '#DC2626'] } },
    series: [{ type: 'bar', data: data.trendByMonth.map((d) => d.count) }],
  }), [data.trendByMonth])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Trend Insight</CardTitle></CardHeader>
        <CardContent><ReactECharts option={trendOpt} style={{ height: 220 }} /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Decision Gauge</CardTitle></CardHeader>
        <CardContent><ReactECharts option={gaugeOpt} style={{ height: 220 }} /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Priority Ranking</CardTitle></CardHeader>
        <CardContent><ReactECharts option={priorityOpt} style={{ height: 220 }} /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Jenis Kekerasan</CardTitle></CardHeader>
        <CardContent><ReactECharts option={treemapOpt} style={{ height: 220 }} /></CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Heatmap Bulanan</CardTitle></CardHeader>
        <CardContent><ReactECharts option={heatOpt} style={{ height: 200 }} /></CardContent>
      </Card>
    </div>
  )
}
