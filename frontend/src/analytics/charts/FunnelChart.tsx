import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import type { FunnelResponse } from '@/analytics/types/analytics'

export const FunnelChart = memo(function FunnelChart() {
  const { data, isLoading, isError } = useAnalyticsQuery<FunnelResponse>('funnel')

  const option = useMemo(() => ({
    ...CHART_ANIMATION,
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    toolbox: CHART_TOOLBOX,
    series: [{
      type: 'funnel',
      left: '10%',
      width: '80%',
      sort: 'descending',
      label: { show: true, position: 'inside', fontSize: 10 },
      data: data?.stages ?? [],
    }],
  }), [data])

  return (
    <ChartPanel
      title="Funnel — Pipeline Kasus"
      subtitle={data?.note}
      previewHeight={220}
      popupHeight={500}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.stages?.length}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} />
      )}
    />
  )
})
