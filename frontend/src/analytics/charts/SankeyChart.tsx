import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import type { SankeyResponse } from '@/analytics/types/analytics'

export const SankeyChart = memo(function SankeyChart() {
  const { data, isLoading, isError } = useAnalyticsQuery<SankeyResponse>('sankey')

  const option = useMemo(() => ({
    ...CHART_ANIMATION,
    tooltip: { trigger: 'item' },
    toolbox: CHART_TOOLBOX,
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: { focus: 'adjacency' },
      data: data?.nodes ?? [],
      links: data?.links ?? [],
      lineStyle: { color: 'gradient', curveness: 0.5 },
      label: { fontSize: 9 },
    }],
  }), [data])

  return (
    <ChartPanel
      title="Sankey — Sumber → Jenis → Status → Dirujuk"
      previewHeight={200}
      popupHeight={620}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.links?.length}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} />
      )}
    />
  )
})
