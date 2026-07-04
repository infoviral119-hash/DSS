import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useApp } from '@/contexts/AppContext'
import { useAnalyticsQuery } from '@/analytics/hooks/useAnalytics'
import { ChartPanel } from '@/analytics/components/ChartPanel'
import { CHART_ANIMATION, CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import { drillSimple } from '@/analytics/utils/drillDown'
import type { HeatmapResponse } from '@/analytics/types/analytics'

export const HeatmapChart = memo(function HeatmapChart() {
  const { setFilters } = useApp()
  const { data, isLoading, isError } = useAnalyticsQuery<HeatmapResponse>('heatmap')

  const option = useMemo(() => ({
    ...CHART_ANIMATION,
    tooltip: {
      position: 'top',
      formatter: (p: { data: [number, number, number] }) => {
        const [xi, yi, v] = p.data
        return `${data?.months[xi]} · ${data?.jenis[yi]}<br/>${v} kasus`
      },
    },
    toolbox: CHART_TOOLBOX,
    grid: { left: 100, right: 48, top: 24, bottom: 80 },
    xAxis: {
      type: 'category',
      data: data?.months ?? [],
      splitArea: { show: true },
      axisLabel: { rotate: 45, fontSize: 8 },
    },
    yAxis: {
      type: 'category',
      data: data?.jenis ?? [],
      splitArea: { show: true },
      axisLabel: { fontSize: 9 },
    },
    visualMap: {
      min: 0,
      max: data?.max || 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      inRange: { color: ['#d5f5e3', '#f9e79f', '#f5b7b1', '#e74c3c'] },
    },
    series: [{
      type: 'heatmap',
      data: data?.data ?? [],
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 6 } },
    }],
  }), [data])

  const onEvents = useMemo(() => ({
    click: (p: { data?: [number, number, number] }) => {
      if (!p.data || !data) return
      const [xi, yi] = p.data
      const month = data.months[xi]
      const jenis = data.jenis[yi]
      if (month) {
        setFilters({
          tanggalMulai: `${month}-01`,
          tanggalSelesai: `${month}-31`,
          ...(jenis ? { jenisKekerasan: jenis } : {}),
        })
      } else if (jenis) {
        drillSimple('jenisKekerasan', jenis, setFilters)
      }
    },
  }), [data, setFilters])

  return (
    <ChartPanel
      title="Heatmap — Bulan × Jenis Kekerasan"
      subtitle="Hijau → Merah · Klik sel untuk filter"
      previewHeight={200}
      popupHeight={560}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.data?.length}
      renderChart={(height) => (
        <ReactECharts option={option} style={{ height }} onEvents={onEvents} />
      )}
    />
  )
})
