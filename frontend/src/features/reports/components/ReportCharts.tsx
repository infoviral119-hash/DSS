import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReportIntelligence } from '@/features/reports/types/report'

interface ReportChartsProps {
  data: ReportIntelligence
  onDrill?: (field: 'kabupaten' | 'kecamatan', value: string) => void
}

export function ReportCharts({ data, onDrill }: ReportChartsProps) {
  const status = data.charts.status as { aktif: number; selesai: number }
  const yearly = data.charts.yearly as { labels: string[]; values: number[] }
  const jenis = (data.charts.jenis as { name: string; count: number }[]) ?? []
  const kab = (data.charts.kabupaten as { name: string; count: number }[]) ?? []

  const statusOpt = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      data: [
        { value: status.aktif, name: 'Aktif', itemStyle: { color: '#f39c12' } },
        { value: status.selesai, name: 'Selesai', itemStyle: { color: '#27ae60' } },
      ],
    }],
  }

  const trendOpt = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 40 },
    xAxis: { type: 'category', data: yearly.labels },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: yearly.values, itemStyle: { color: '#2980b9' } }],
  }

  const jenisOpt = {
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 16, top: 24, bottom: 72, containLabel: true },
    xAxis: { type: 'category', data: jenis.map((i) => i.name), axisLabel: { rotate: 25, fontSize: 9 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: jenis.map((i) => i.count), itemStyle: { color: '#e74c3c' } }],
  }

  const kabOpt = {
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 16, top: 24, bottom: 48, containLabel: true },
    xAxis: { type: 'category', data: kab.map((i) => i.name), axisLabel: { rotate: 20, fontSize: 9 } },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: kab.map((i) => i.count),
      itemStyle: { color: '#8e44ad' },
    }],
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Status Kasus</CardTitle></CardHeader>
        <CardContent><ReactECharts option={statusOpt} style={{ height: 240 }} /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Tren Tahunan</CardTitle></CardHeader>
        <CardContent><ReactECharts option={trendOpt} style={{ height: 240 }} /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Jenis Kekerasan</CardTitle></CardHeader>
        <CardContent><ReactECharts option={jenisOpt} style={{ height: 260 }} /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top Kabupaten</CardTitle>
          <p className="text-[10px] text-muted-foreground">Klik bar untuk drill-down</p>
        </CardHeader>
        <CardContent>
          <ReactECharts
            option={kabOpt}
            style={{ height: 260 }}
            onEvents={{
              click: (p: { name?: string }) => {
                if (p.name && onDrill) onDrill('kabupaten', p.name)
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ReportTables({ tables }: { tables: ReportIntelligence['tables'] }) {
  const sections = [
    { key: 'kabupaten', title: 'Kabupaten' },
    { key: 'kecamatan', title: 'Kecamatan' },
    { key: 'jenis', title: 'Jenis Kekerasan' },
  ] as const

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {sections.map(({ key, title }) => (
        <Card key={key}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
          <CardContent className="max-h-56 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1">Nama</th>
                  <th className="py-1 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {(tables[key] ?? []).map((row) => (
                  <tr key={row.name} className="border-b border-border/50">
                    <td className="py-1">{row.name}</td>
                    <td className="py-1 text-right font-medium">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
