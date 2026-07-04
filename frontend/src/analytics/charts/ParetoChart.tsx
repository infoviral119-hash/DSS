import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useApp } from '@/contexts/AppContext'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import { drillSimple } from '@/analytics/utils/drillDown'
import type { ParetoResponse } from '@/analytics/types/analytics'

export const ParetoChart = memo(function ParetoChart() {
  const { setFilters } = useApp()
  const { data, isLoading, isError } = useAnalyticsQuery<ParetoResponse>('pareto')

  const option = useMemo(() => {
    const items = data?.items ?? []
    const names = items.map((i) => i.name)
    const counts = items.map((i) => i.count)
    const cumulative = items.map((i) => i.cumulativePct)

    return {
      ...CHART_ANIMATION,
      tooltip: {
        trigger: 'axis',
        formatter: (params: { seriesName: string; name: string; value: number; dataIndex: number }[]) => {
          const bar = params.find((p) => p.seriesName === 'Kasus')
          if (!bar) return ''
          const pct = cumulative[bar.dataIndex] ?? 0
          return `${bar.name}<br/>Kasus: ${bar.value}<br/>Kumulatif: ${pct}%`
        },
      },
      toolbox: CHART_TOOLBOX,
      legend: { data: ['Kasus', 'Kumulatif %'], bottom: 0 },
      grid: { left: 48, right: 48, top: 32, bottom: 72 },
      dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: 28 }],
      xAxis: { type: 'category', data: names, axisLabel: { rotate: 35, fontSize: 9 } },
      yAxis: [
        { type: 'value', name: 'Kasus' },
        { type: 'value', name: '%', max: 100, axisLabel: { formatter: '{value}%' } },
      ],
      series: [
        { name: 'Kasus', type: 'bar', data: counts, itemStyle: { color: '#3498db' } },
        {
          name: 'Kumulatif %',
          type: 'line',
          yAxisIndex: 1,
          data: cumulative,
          smooth: true,
          itemStyle: { color: '#e74c3c' },
          markLine: {
            silent: true,
            data: [{ yAxis: 80, lineStyle: { type: 'dashed', color: '#95a5a6' } }],
          },
        },
      ],
    }
  }, [data])

  const onEvents = useMemo(() => ({
    click: (p: { name?: string }) => {
      if (p.name) drillSimple('jenisKekerasan', p.name, setFilters)
    },
  }), [setFilters])

  return (
    <ChartPanel
      title="Pareto — Jenis Kekerasan"
      subtitle="Klik baris untuk filter · Garis 80%"
      previewHeight={180}
      popupHeight={480}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !(data?.items?.length)}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} onEvents={onEvents} />
      )}
    />
  )
})
