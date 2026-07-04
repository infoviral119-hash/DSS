import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useApp } from '@/contexts/AppContext'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import { drillTreemap } from '@/analytics/utils/drillDown'
import type { TreemapResponse } from '@/analytics/types/analytics'

export const TreemapChart = memo(function TreemapChart() {
  const { setFilters } = useApp()
  const { data, isLoading, isError } = useAnalyticsQuery<TreemapResponse>('treemap')

  const option = useMemo(() => ({
    ...CHART_ANIMATION,
    tooltip: { formatter: (p: { name: string; value: number }) => `${p.name}: ${p.value}` },
    toolbox: CHART_TOOLBOX,
    series: [{
      type: 'treemap',
      roam: true,
      nodeClick: 'zoomToNode',
      breadcrumb: { show: true },
      label: { show: true, fontSize: 10 },
      upperLabel: { show: true, height: 24 },
      data: data?.tree?.children ?? [],
      levels: [
        { itemStyle: { borderWidth: 2, gapWidth: 2 } },
        { itemStyle: { borderWidth: 1, gapWidth: 1 } },
        { colorSaturation: [0.35, 0.7], itemStyle: { borderWidth: 1, gapWidth: 1 } },
      ],
    }],
  }), [data])

  const onEvents = useMemo(() => ({
    click: (p: { treePathInfo?: { name: string }[] }) => {
      if (p.treePathInfo) drillTreemap(p.treePathInfo, setFilters)
    },
  }), [setFilters])

  return (
    <ChartPanel
      title="Treemap — Kabupaten → Jenis → Status"
      subtitle="Klik untuk drill-down filter"
      previewHeight={200}
      popupHeight={540}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.tree?.children?.length}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} onEvents={onEvents} />
      )}
    />
  )
})
