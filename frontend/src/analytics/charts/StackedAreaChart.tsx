import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import type { StackedAreaResponse } from '@/analytics/types/analytics'

export const StackedAreaChart = memo(function StackedAreaChart() {
  const { data, isLoading, isError } = useAnalyticsQuery<StackedAreaResponse>('stacked-area')

  const option = useMemo(() => ({
    ...CHART_ANIMATION,
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    toolbox: CHART_TOOLBOX,
    legend: { data: ['Aktif', 'Selesai', 'Dirujuk'], bottom: 0 },
    grid: { left: 48, right: 24, top: 24, bottom: 48 },
    xAxis: { type: 'category', boundaryGap: false, data: data?.months ?? [], axisLabel: { rotate: 35, fontSize: 8 } },
    yAxis: { type: 'value' },
    series: [
      { name: 'Aktif', type: 'line', stack: 'total', areaStyle: { opacity: 0.65 }, data: data?.aktif ?? [], itemStyle: { color: '#f39c12' } },
      { name: 'Selesai', type: 'line', stack: 'total', areaStyle: { opacity: 0.65 }, data: data?.selesai ?? [], itemStyle: { color: '#27ae60' } },
      { name: 'Dirujuk', type: 'line', stack: 'total', areaStyle: { opacity: 0.65 }, data: data?.dirujuk ?? [], itemStyle: { color: '#9b59b6' } },
    ],
  }), [data])

  return (
    <ChartPanel
      title="Stacked Area — Tren Status"
      subtitle="Aktif · Selesai · Dirujuk per bulan"
      previewHeight={200}
      popupHeight={420}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.months?.length}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} />
      )}
    />
  )
})
