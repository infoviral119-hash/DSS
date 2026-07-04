import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useApp } from '@/contexts/AppContext'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import { drillSunburst } from '@/analytics/utils/drillDown'
import type { TreemapResponse } from '@/analytics/types/analytics'

export const SunburstChart = memo(function SunburstChart() {
  const { setFilters } = useApp()
  const { data, isLoading, isError } = useAnalyticsQuery<TreemapResponse>('sunburst')

  const option = useMemo(() => ({
    ...CHART_ANIMATION,
    tooltip: { formatter: (p: { name: string; value: number }) => `${p.name}: ${p.value}` },
    toolbox: CHART_TOOLBOX,
    series: [{
      type: 'sunburst',
      radius: ['12%', '90%'],
      sort: undefined,
      emphasis: { focus: 'ancestor' },
      data: data?.tree?.children ?? [],
      label: { rotate: 'radial', fontSize: 9 },
      levels: [{}, { r0: '12%', r: '40%' }, { r0: '40%', r: '65%' }, { r0: '65%', r: '90%' }],
    }],
  }), [data])

  const onEvents = useMemo(() => ({
    click: (p: { treePathInfo?: { name: string }[] }) => {
      if (p.treePathInfo) drillSunburst(p.treePathInfo, setFilters)
    },
  }), [setFilters])

  return (
    <ChartPanel
      title="Sunburst — Kabupaten → Jenis → Gender → Status"
      subtitle="Klik segmen untuk filter"
      previewHeight={180}
      popupHeight={640}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.tree?.children?.length}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} onEvents={onEvents} />
      )}
    />
  )
})
