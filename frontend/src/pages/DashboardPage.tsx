import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import {
  Activity,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Database,
  Percent,
} from 'lucide-react'

interface CaseStats {
  total: number
  aktif: number
  selesai: number
  byYear: Record<string, number>
  connected: boolean
}

interface Overview {
  completionRate: number
  topKecamatan: { name: string; count: number }[]
  topJenisKekerasan: { name: string; count: number }[]
}

interface Demographics {
  gender: Record<string, number>
}

function buildTrendChart(byYear: Record<string, number>, tahun: number | null) {
  const years = tahun ? [tahun] : Object.keys(byYear).map(Number).sort()
  const data = years.map((y) => byYear[y] ?? 0)

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 32 },
    xAxis: { type: 'category', data: years.map(String) },
    yAxis: { type: 'value' },
    series: [{
      name: 'Kasus',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.15 },
      data,
      itemStyle: { color: '#0078d4' },
    }],
  }
}

function buildStatusChart(aktif: number, selesai: number) {
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      data: [
        { value: aktif, name: 'Aktif' },
        { value: selesai, name: 'Selesai' },
      ],
    }],
  }
}

function buildBarChart(items: { name: string; count: number }[], color = '#0078d4') {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 16, top: 24, bottom: 60, containLabel: true },
    xAxis: { type: 'category', data: items.map((i) => i.name), axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: items.map((i) => i.count), itemStyle: { color } }],
  }
}

function buildGenderChart(gender: Record<string, number>) {
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '65%',
      data: Object.entries(gender).map(([name, value]) => ({ name, value })),
    }],
  }
}

export function DashboardPage() {
  const { filters } = useApp()
  const { user } = useAuth()
  const params = filtersToParams(filters)

  const { data: stats } = useQuery<CaseStats>({
    queryKey: ['case-stats', params],
    queryFn: async () => (await api.get('/api/cases/stats', { params })).data,
    refetchInterval: 30000,
  })

  const { data: overview } = useQuery<Overview>({
    queryKey: ['analytics-overview', params],
    queryFn: async () => (await api.get('/api/analytics/overview', { params })).data,
  })

  const { data: demographics } = useQuery<Demographics>({
    queryKey: ['analytics-demographics', params],
    queryFn: async () => (await api.get('/api/analytics/demographics', { params })).data,
  })

  const { data: trends } = useQuery({
    queryKey: ['analytics-trends', params],
    queryFn: async () => (await api.get('/api/analytics/trends', { params })).data,
  })

  const total = stats?.total ?? 0
  const aktif = stats?.aktif ?? 0
  const selesai = stats?.selesai ?? 0
  const byYear = stats?.byYear ?? {}

  const kpis = [
    { label: 'Total Kasus', value: total, icon: Database, color: 'text-blue-500' },
    { label: 'Kasus Aktif', value: aktif, icon: Activity, color: 'text-orange-500' },
    { label: 'Selesai', value: selesai, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Completion Rate', value: `${overview?.completionRate ?? 0}%`, icon: Percent, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-4">
      {!stats?.connected && (
        <Card className="border-orange-300">
          <CardContent className="p-3 text-xs text-orange-600">
            Supabase belum terhubung. Cek konfigurasi di menu Import Data.
          </CardContent>
        </Card>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-xl font-bold">
                    {typeof kpi.value === 'number' ? formatNumber(kpi.value) : kpi.value}
                  </p>
                </div>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tren Kasus {filters.tahun || '2021–2025'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={buildTrendChart(byYear, filters.tahun)} style={{ height: 280 }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Pendampingan</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={buildStatusChart(aktif, selesai)} style={{ height: 280 }} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tren Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactECharts
            option={{
              tooltip: { trigger: 'axis' },
              grid: { left: 40, right: 16, top: 24, bottom: 60 },
              xAxis: {
                type: 'category',
                data: (trends?.monthly ?? []).map((m: { month: string }) => m.month),
                axisLabel: { rotate: 45, fontSize: 9 },
              },
              yAxis: { type: 'value' },
              series: [{
                type: 'line',
                smooth: true,
                data: (trends?.monthly ?? []).map((m: { count: number }) => m.count),
                itemStyle: { color: '#16a085' },
              }],
            }}
            style={{ height: 240 }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top Kecamatan</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={buildBarChart(overview?.topKecamatan ?? [], '#e67e22')}
              style={{ height: 260 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jenis Kekerasan</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={buildBarChart(overview?.topJenisKekerasan ?? [], '#c0392b')}
              style={{ height: 260 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demografi Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={buildGenderChart(demographics?.gender ?? {})}
              style={{ height: 260 }}
            />
          </CardContent>
        </Card>
      </div>

      {(user?.role === 'direktur' || user?.role === 'ketua_yayasan' || user?.role === 'admin') && total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total {formatNumber(total)} kasus ({formatNumber(selesai)} selesai, {formatNumber(aktif)} aktif).
              Completion rate {overview?.completionRate ?? 0}%.
              {overview?.topKecamatan?.[0] && (
                <> Wilayah tertinggi: <strong>{overview.topKecamatan[0].name}</strong> ({overview.topKecamatan[0].count} kasus).</>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
