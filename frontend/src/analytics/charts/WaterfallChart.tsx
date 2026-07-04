import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import type { WaterfallResponse } from '@/analytics/types/analytics'

export const WaterfallChart = memo(function WaterfallChart() {
  const { data, isLoading, isError } = useAnalyticsQuery<WaterfallResponse>('waterfall')

  const option = useMemo(() => {
    const points = data?.points ?? []
    const placeholders: number[] = []
    const values: number[] = []
    let acc = 0
    for (const p of points) {
      if (p.isTotal) {
        placeholders.push(0)
        values.push(p.value)
      } else if (p.value >= 0) {
        placeholders.push(acc)
        values.push(p.value)
        acc += p.value
      } else {
        placeholders.push(acc + p.value)
        values.push(-p.value)
        acc += p.value
      }
    }
    return {
      ...CHART_ANIMATION,
      tooltip: { trigger: 'axis' },
      toolbox: CHART_TOOLBOX,
      grid: { left: 48, right: 24, top: 24, bottom: 60 },
      xAxis: { type: 'category', data: points.map((p) => p.name), axisLabel: { rotate: 35, fontSize: 8 } },
      yAxis: { type: 'value' },
      series: [
        { name: 'Helper', type: 'bar', stack: 'w', itemStyle: { borderColor: 'transparent', color: 'transparent' }, data: placeholders },
        { name: 'Perubahan', type: 'bar', stack: 'w', data: values, itemStyle: { color: '#3498db' } },
      ],
    }
  }, [data])

  return (
    <ChartPanel
      title="Waterfall — Perubahan Kasus per Bulan"
      previewHeight={180}
      popupHeight={400}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.points?.length}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} />
      )}
    />
  )
})
