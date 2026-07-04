import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useApp } from '@/contexts/AppContext'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import { drillSimple } from '@/analytics/utils/drillDown'
import type { BubbleResponse } from '@/analytics/types/analytics'

export const BubbleChart = memo(function BubbleChart() {
  const { setFilters } = useApp()
  const { data, isLoading, isError } = useAnalyticsQuery<BubbleResponse>('bubble')

  const option = useMemo(() => ({
    ...CHART_ANIMATION,
    tooltip: {
      formatter: (p: { data: number[]; name: string }) => `${p.name}<br/>Usia rata: ${p.data[0]}<br/>Kasus: ${p.data[1]}`,
    },
    toolbox: CHART_TOOLBOX,
    grid: { left: 48, right: 24, top: 24, bottom: 40 },
    xAxis: { name: 'Usia rata-rata', type: 'value' },
    yAxis: { name: 'Jumlah kasus', type: 'value' },
    series: [{
      type: 'scatter',
      symbolSize: (val: number[]) => Math.sqrt(val[1]) * 8,
      data: (data?.bubbles ?? []).map((b) => ({ name: b.name, value: [b.usiaAvg, b.count] })),
      itemStyle: { color: '#16a085', opacity: 0.75 },
    }],
  }), [data])

  const onEvents = useMemo(() => ({
    click: (p: { name?: string }) => {
      if (p.name) drillSimple('kabupaten', p.name, setFilters)
    },
  }), [setFilters])

  return (
    <ChartPanel
      title="Bubble — Kabupaten (Usia vs Jumlah)"
      previewHeight={200}
      popupHeight={480}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.bubbles?.length}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} onEvents={onEvents} />
      )}
    />
  )
})
