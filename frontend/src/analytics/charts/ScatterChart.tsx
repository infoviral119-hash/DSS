import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useApp } from '@/contexts/AppContext'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import { drillSimple } from '@/analytics/utils/drillDown'
import type { ScatterResponse } from '@/analytics/types/analytics'

export const ScatterChart = memo(function ScatterChart() {
  const { setFilters } = useApp()
  const { data, isLoading, isError } = useAnalyticsQuery<ScatterResponse>('scatter')

  const jenisList = useMemo(() => [...new Set((data?.points ?? []).map((p) => p.jenis))], [data])

  const option = useMemo(() => ({
    ...CHART_ANIMATION,
    tooltip: {
      formatter: (p: { data: number[] }) => `Usia ${p.data[0]} · Lama ${p.data[1]} hari`,
    },
    toolbox: CHART_TOOLBOX,
    legend: { type: 'scroll', bottom: 0 },
    grid: { left: 48, right: 24, top: 24, bottom: 48 },
    xAxis: { name: 'Usia', type: 'value' },
    yAxis: { name: 'Lama (hari)', type: 'value' },
    series: jenisList.map((jenis) => ({
      name: jenis,
      type: 'scatter',
      symbolSize: (val: number[]) => Math.min(24, 6 + (val[2] ?? 1)),
      data: (data?.points ?? []).filter((p) => p.jenis === jenis).map((p) => [p.usia, p.lama, p.pendampingan]),
    })),
  }), [data, jenisList])

  const onEvents = useMemo(() => ({
    click: (p: { seriesName?: string }) => {
      if (p.seriesName) drillSimple('jenisKekerasan', p.seriesName, setFilters)
    },
  }), [setFilters])

  return (
    <ChartPanel
      title="Scatter — Usia vs Lama Penyelesaian"
      previewHeight={200}
      popupHeight={480}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.points?.length}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} onEvents={onEvents} />
      )}
    />
  )
})
