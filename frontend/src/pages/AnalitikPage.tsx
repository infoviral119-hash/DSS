import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import ReactECharts from 'echarts-for-react'
import { Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/contexts/AppContext'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import { ParetoChart } from '@/analytics/charts/ParetoChart'
import { TreemapChart } from '@/analytics/charts/TreemapChart'
import { SunburstChart } from '@/analytics/charts/SunburstChart'
import { HeatmapChart } from '@/analytics/charts/HeatmapChart'
import { StackedAreaChart } from '@/analytics/charts/StackedAreaChart'
import { SankeyChart } from '@/analytics/charts/SankeyChart'
import { FunnelChart } from '@/analytics/charts/FunnelChart'
import { WaterfallChart } from '@/analytics/charts/WaterfallChart'
import { ScatterChart } from '@/analytics/charts/ScatterChart'
import { BubbleChart } from '@/analytics/charts/BubbleChart'
import { CHART_TOOLBOX } from '@/analytics/utils/chartConfig'
import { drillSimple } from '@/analytics/utils/drillDown'
import { formatNumber } from '@/lib/utils'

export function AnalitikPage() {
  const { filters, setFilters } = useApp()
  const [penerimaanOpen, setPenerimaanOpen] = useState(false)
  const params = filtersToParams(filters)

  const { data: trends } = useQuery({
    queryKey: ['analytics-trends', params],
    queryFn: async () => (await api.get('/api/analytics/trends', { params })).data,
  })

  const { data: demographics } = useQuery({
    queryKey: ['analytics-demographics', params],
    queryFn: async () => (await api.get('/api/analytics/demographics', { params })).data,
  })

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', params],
    queryFn: async () => (await api.get('/api/analytics/overview', { params })).data,
  })

  const pendampingan = overview?.pendampingan

  const yearlyChart = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 40 },
    xAxis: { type: 'category', data: trends?.labels ?? [] },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      smooth: true,
      data: trends?.yearly ?? [],
      areaStyle: { opacity: 0.15 },
      itemStyle: { color: '#27ae60' },
    }],
  }

  const monthlyChart = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 60 },
    xAxis: {
      type: 'category',
      data: (trends?.monthly ?? []).map((m: { month: string }) => m.month),
      axisLabel: { rotate: 45, fontSize: 9 },
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: (trends?.monthly ?? []).map((m: { count: number }) => m.count),
      itemStyle: { color: '#2980b9' },
    }],
  }

  const genderChart = {
    tooltip: { trigger: 'item' },
    toolbox: CHART_TOOLBOX,
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      data: Object.entries(demographics?.gender ?? {}).map(([name, value]) => ({ name, value })),
    }],
  }

  const ageChart = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: Object.entries(demographics?.ageGroups ?? {}).map(([name, value]) => ({ name, value })),
    }],
  }

  const statusChart = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      data: [
        { value: overview?.aktif ?? 0, name: 'Aktif', itemStyle: { color: '#f39c12' } },
        { value: overview?.selesai ?? 0, name: 'Selesai', itemStyle: { color: '#27ae60' } },
      ],
    }],
  }

  const completionGauge = {
    series: [{
      type: 'gauge',
      min: 0,
      max: 100,
      progress: { show: true, width: 14 },
      axisLine: { lineStyle: { width: 14 } },
      detail: { formatter: '{value}%', fontSize: 22 },
      data: [{ value: overview?.completionRate ?? 0, name: 'Penyelesaian' }],
    }],
  }

  const kekerasanChart = {
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 16, top: 24, bottom: 80, containLabel: true },
    xAxis: {
      type: 'category',
      data: (overview?.topJenisKekerasan ?? []).map((i: { name: string }) => i.name),
      axisLabel: { rotate: 35, fontSize: 9 },
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: (overview?.topJenisKekerasan ?? []).map((i: { count: number }) => i.count),
      itemStyle: { color: '#e74c3c' },
    }],
  }

  const kecamatanChart = {
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 24, top: 16, bottom: 8, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: (overview?.topKecamatan ?? []).map((i: { name: string }) => i.name).reverse(),
      axisLabel: { fontSize: 10 },
    },
    series: [{
      type: 'bar',
      data: (overview?.topKecamatan ?? []).map((i: { count: number }) => i.count).reverse(),
      itemStyle: { color: '#16a085' },
    }],
  }

  const kategoriChart = {
    tooltip: { trigger: 'item' },
    legend: { type: 'scroll', bottom: 0 },
    series: [{
      type: 'pie',
      radius: '65%',
      data: (overview?.topKategori ?? []).map((i: { name: string; count: number }) => ({
        name: i.name,
        value: i.count,
      })),
    }],
  }

  const kabupatenChart = {
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 16, top: 24, bottom: 60, containLabel: true },
    xAxis: {
      type: 'category',
      data: (overview?.topKabupaten ?? []).map((i: { name: string }) => i.name),
      axisLabel: { rotate: 30, fontSize: 10 },
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: (overview?.topKabupaten ?? []).map((i: { count: number }) => i.count),
      itemStyle: { color: '#8e44ad' },
    }],
  }

  const dirujukChart = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      data: [
        { value: pendampingan?.dirujuk?.dirujuk ?? 0, name: 'Dirujuk', itemStyle: { color: '#9b59b6' } },
        { value: pendampingan?.dirujuk?.tidakDirujuk ?? 0, name: 'Tidak Dirujuk', itemStyle: { color: '#bdc3c7' } },
      ],
    }],
  }

  const pendidikanEntries = Object.entries(pendampingan?.pendidikan ?? {})
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))

  const buildHBarChart = (
    rows: { name: string; value: number; color: string }[],
    pct: (n: number) => string,
    max?: number,
  ) => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0]
        if (!p) return ''
        return `${p.name}<br/>${formatNumber(p.value)} kasus (${pct(p.value)}%)`
      },
    },
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', max: max || undefined },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.name).reverse(),
      axisLabel: { fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: rows.map((r) => ({
        value: r.value,
        itemStyle: { color: r.color },
        label: {
          show: true,
          position: 'right',
          formatter: `${formatNumber(r.value)} (${pct(r.value)}%)`,
          fontSize: 10,
        },
      })).reverse(),
    }],
  })

  const penerimaanColors: Record<string, string> = {
    Hotline: '#e74c3c',
    Website: '#3498db',
    'Datang Langsung': '#27ae60',
    'Tidak diketahui': '#bdc3c7',
  }

  const penerimaanTotal = overview?.total ?? 0
  const penerimaanHotline = Number(pendampingan?.penerimaan?.Hotline ?? 0)
  const penerimaanWebsite = Number(pendampingan?.penerimaan?.Website ?? 0)
  const penerimaanDatang = Number(pendampingan?.penerimaan?.['Datang Langsung'] ?? 0)
  const penerimaanUnknown = Number(pendampingan?.penerimaan?.['Tidak diketahui'] ?? 0)
  const penerimaanKnown = penerimaanHotline + penerimaanWebsite + penerimaanDatang

  const penerimaanPct = (n: number) => (penerimaanTotal ? ((n / penerimaanTotal) * 100).toFixed(1) : '0.0')
  const penerimaanPctKnown = (n: number) => (penerimaanKnown ? ((n / penerimaanKnown) * 100).toFixed(1) : '0.0')

  const penerimaanMainRows = [
    { name: 'Hotline', value: penerimaanHotline, color: penerimaanColors.Hotline },
    { name: 'Website', value: penerimaanWebsite, color: penerimaanColors.Website },
    { name: 'Datang Langsung', value: penerimaanDatang, color: penerimaanColors['Datang Langsung'] },
  ].sort((a, b) => b.value - a.value)

  const penerimaanDetailRows = ['Hotline', 'Website', 'Datang Langsung', 'Tidak diketahui']
    .map((name) => ({
      name,
      value: Number(pendampingan?.penerimaan?.[name] ?? 0),
      color: penerimaanColors[name],
    }))
    .sort((a, b) => b.value - a.value)

  const penerimaanChart = buildHBarChart(penerimaanMainRows, penerimaanPctKnown, penerimaanKnown || 1)
  const penerimaanDetailChart = buildHBarChart(penerimaanDetailRows, penerimaanPct, penerimaanTotal || undefined)

  const pendidikanChart = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: pendidikanEntries.map(([name]) => name).reverse(),
      axisLabel: { fontSize: 10 },
    },
    series: [{
      type: 'bar',
      data: pendidikanEntries.map(([, value]) => value).reverse(),
      itemStyle: { color: '#3498db' },
      label: { show: true, position: 'right', fontSize: 10 },
    }],
  }

  const pendampinganKosong = !overviewLoading && (overview?.total ?? 0) > 0 && !pendampingan?.dirujuk?.total

  const pieClick = (field: 'jenisKelamin' | 'status' | 'kategori') => ({
    click: (p: { name?: string }) => { if (p.name) drillSimple(field, p.name, setFilters) },
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Kasus</p>
            <p className="text-2xl font-bold text-primary">{formatNumber(overview?.total ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Aktif</p>
            <p className="text-2xl font-bold text-amber-600">{formatNumber(overview?.aktif ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Selesai</p>
            <p className="text-2xl font-bold text-green-600">{formatNumber(overview?.selesai ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tren Tahunan</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts option={yearlyChart} style={{ height: 280 }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tren Bulanan</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts option={monthlyChart} style={{ height: 280 }} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Kekerasan per Jenis Kelamin</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts option={genderChart} style={{ height: 260 }} onEvents={pieClick('jenisKelamin')} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status Kasus</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts option={statusChart} style={{ height: 260 }} onEvents={pieClick('status')} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Distribusi Usia</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts option={ageChart} style={{ height: 260 }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Kategori Kasus</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts option={kategoriChart} style={{ height: 260 }} onEvents={pieClick('kategori')} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Jenis Kekerasan</CardTitle></CardHeader>
        <CardContent>
          <ReactECharts
            option={kekerasanChart}
            style={{ height: 300 }}
            onEvents={{ click: (p: { name?: string }) => { if (p.name) drillSimple('jenisKekerasan', p.name, setFilters) } }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <ParetoChart />
        <TreemapChart />
        <HeatmapChart />
        <StackedAreaChart />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tingkat Penyelesaian</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts option={completionGauge} style={{ height: 260 }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Kabupaten</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts
              option={kabupatenChart}
              style={{ height: 280 }}
              onEvents={{ click: (p: { name?: string }) => { if (p.name) drillSimple('kabupaten', p.name, setFilters) } }}
            />
          </CardContent>
        </Card>
      </div>

      <SunburstChart />

      <Card>
        <CardHeader><CardTitle>Top Kecamatan</CardTitle></CardHeader>
        <CardContent>
          <ReactECharts
            option={kecamatanChart}
            style={{ height: 320 }}
            onEvents={{ click: (p: { name?: string }) => { if (p.name) drillSimple('kecamatan', p.name, setFilters) } }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pendampinganKosong && (
          <p className="col-span-full rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
            Data pendampingan belum termuat — restart backend: <code>npm run dev</code>
          </p>
        )}
        <Card>
          <CardHeader><CardTitle>Dirujuk?</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts option={dirujukChart} style={{ height: 280 }} />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {formatNumber(pendampingan?.dirujuk?.dirujuk ?? 0)} dari {formatNumber(pendampingan?.dirujuk?.total ?? 0)} kasus dirujuk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pendidikan Korban</CardTitle></CardHeader>
          <CardContent>
            <ReactECharts option={pendidikanChart} style={{ height: 300 }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm leading-tight">Proses Penerimaan Kasus</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setPenerimaanOpen(true)}>
              <Maximize2 className="h-3.5 w-3.5" />
              Detail
            </Button>
          </CardHeader>
          <CardContent>
            <ReactECharts option={penerimaanChart} style={{ height: 160 }} />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Hotline {formatNumber(penerimaanHotline)} · Website {formatNumber(penerimaanWebsite)} · Datang {formatNumber(penerimaanDatang)}
            </p>
            {penerimaanUnknown > 0 && (
              <button
                type="button"
                onClick={() => setPenerimaanOpen(true)}
                className="mt-1 w-full text-center text-xs text-primary hover:underline"
              >
                + {formatNumber(penerimaanUnknown)} tidak diketahui — lihat detail
              </button>
            )}
          </CardContent>
        </Card>

        <Dialog.Root open={penerimaanOpen} onOpenChange={setPenerimaanOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-base font-semibold">Detail Proses Penerimaan Kasus</Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                    Hotline, Website, Datang Langsung — dari {formatNumber(penerimaanTotal)} total kasus
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </Dialog.Close>
              </div>
              <ReactECharts option={penerimaanDetailChart} style={{ height: 240 }} />
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>Hotline: {formatNumber(penerimaanHotline)} ({penerimaanPct(penerimaanHotline)}%)</p>
                <p>Website: {formatNumber(penerimaanWebsite)} ({penerimaanPct(penerimaanWebsite)}%)</p>
                <p>Datang Langsung: {formatNumber(penerimaanDatang)} ({penerimaanPct(penerimaanDatang)}%)</p>
                <p>Tidak diketahui: {formatNumber(penerimaanUnknown)} ({penerimaanPct(penerimaanUnknown)}%)</p>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="grid gap-4">
        <SankeyChart />
        <FunnelChart />
        <ScatterChart />
        <BubbleChart />
        <WaterfallChart />
      </div>
    </div>
  )
}
