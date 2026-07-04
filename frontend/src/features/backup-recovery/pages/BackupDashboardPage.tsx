import ReactECharts from 'echarts-for-react'
import { PageHeader } from '@/features/admin-security/components/PageHeader'
import { useBackupDashboard } from '../hooks/useBackup'
import { KpiGrid } from '../shared/components/KpiCard'
import { DashboardSkeleton } from '../shared/components/SkeletonBlock'
import { ActivityTimeline } from '../shared/components/ActivityTimeline'
import { EnterpriseTable } from '../shared/components/EnterpriseTable'
import { StatusBadge } from '../shared/components/StatusBadge'
import { PageToolbar } from '../shared/components/PageToolbar'
import {
  Shield, CheckCircle2, HardDrive, Archive, Clock, Loader2, XCircle, Gauge, Lock, Timer,
} from 'lucide-react'

export function BackupDashboardPage() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useBackupDashboard()

  if (isLoading || !data) return <DashboardSkeleton />

  const k = data.kpis
  const spark = (data.backupTrend ?? []).map((t: { success: number }) => t.success)

  return (
    <div className="space-y-4">
      <PageHeader title="Backup Dashboard" subtitle="Executive Backup & Recovery Center" />
      <PageToolbar
        search=""
        onSearchChange={() => {}}
        showSearch={false}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        lastUpdated={data.lastUpdated ?? new Date(dataUpdatedAt).toISOString()}
      />

      <KpiGrid items={[
        { label: 'Backup Health Score', value: k.backupHealthScore, icon: Shield, tone: k.backupHealthScore >= 90 ? 'success' : k.backupHealthScore >= 70 ? 'default' : 'warning', progress: k.backupHealthScore, badge: k.healthLabel },
        { label: 'Success Rate', value: `${k.backupSuccessRate}%`, icon: CheckCircle2, tone: 'success', progress: k.backupSuccessRate },
        { label: 'Repository Health', value: k.repositoryHealth, icon: HardDrive, tone: k.repositoryHealth === 'Excellent' ? 'success' : 'default' },
        { label: 'Storage Used', value: `${k.storageUsedGb} GB`, icon: HardDrive, progress: Number(k.storageUsedGb) / (Number(k.storageUsedGb) + Number(k.storageRemainingGb)) * 100 },
        { label: 'Recovery Points', value: k.recoveryPoints, icon: Archive, sparkline: spark },
        { label: 'Last Backup', value: k.lastBackup, icon: Clock },
        { label: 'Next Backup', value: k.nextBackup, icon: Timer },
        { label: 'Running Jobs', value: k.runningJobs, icon: Loader2, tone: k.runningJobs ? 'warning' : 'default' },
        { label: 'Failed Jobs', value: k.failedJobs, icon: XCircle, tone: k.failedJobs ? 'danger' : 'default' },
        { label: 'Compression Ratio', value: `${k.compressionRatio}x`, icon: Gauge },
        { label: 'Encryption', value: k.encryptionStatus, icon: Lock },
        { label: 'Avg Backup Time', value: k.averageBackupTime, icon: Timer },
      ]} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Backup Trend', option: { tooltip: { trigger: 'axis' }, legend: { data: ['Success', 'Failed'] }, xAxis: { type: 'category', data: data.backupTrend?.map((t: { date: string }) => t.date.slice(5)) }, yAxis: { type: 'value' }, series: [{ name: 'Success', type: 'bar', stack: 't', data: data.backupTrend?.map((t: { success: number }) => t.success), itemStyle: { color: '#10b981' } }, { name: 'Failed', type: 'bar', stack: 't', data: data.backupTrend?.map((t: { failed: number }) => t.failed), itemStyle: { color: '#ef4444' } }] } },
          { title: 'Restore Trend', option: { xAxis: { type: 'category', data: data.restoreTrend?.map((t: { date: string }) => t.date.slice(5)) }, yAxis: { type: 'value' }, series: [{ type: 'line', data: data.restoreTrend?.map((t: { count: number }) => t.count), smooth: true, areaStyle: { opacity: 0.1 } }] } },
          { title: 'Storage Growth', option: { xAxis: { type: 'category', data: data.storageTrend?.map((t: { date: string }) => t.date.slice(5)) }, yAxis: { type: 'value' }, series: [{ type: 'line', data: data.storageTrend?.map((t: { usedGb: number }) => t.usedGb), smooth: true }] } },
          { title: 'Success Rate', option: { series: [{ type: 'gauge', min: 0, max: 100, progress: { show: true }, detail: { formatter: '{value}%' }, data: [{ value: data.successRate }] }] } },
          { title: 'Repository Usage', option: { tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['35%', '60%'], data: data.repositoryUsage?.map((r: { name: string; usedGb: number }) => ({ name: r.name, value: r.usedGb })) }] } },
          { title: 'Recovery Point Growth', option: { xAxis: { type: 'category', data: data.recoveryPointGrowth?.map((t: { date: string }) => t.date.slice(5)) }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: data.recoveryPointGrowth?.map((t: { count: number }) => t.count), itemStyle: { color: '#0078d4' } }] } },
          { title: 'Backup Duration (s)', option: { xAxis: { type: 'category', data: data.backupDurationTrend?.map((t: { date: string }) => t.date.slice(5)) }, yAxis: { type: 'value' }, series: [{ type: 'line', data: data.backupDurationTrend?.map((t: { seconds: number }) => t.seconds) }] } },
          { title: 'Job Status', option: { series: [{ type: 'pie', radius: '60%', data: data.jobStatusDistribution?.map((j: { status: string; count: number }) => ({ name: j.status, value: j.count })) }] } },
        ].map((chart) => (
          <div key={chart.title} className="glass-panel rounded-lg border border-border p-3">
            <p className="mb-2 text-xs font-medium">{chart.title}</p>
            <ReactECharts style={{ height: 200 }} option={chart.option} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Recent Recovery Points</h3>
          <EnterpriseTable
            rows={data.recentRecoveryPoints ?? []}
            emptyTitle="No Recovery Point"
            emptyDescription="Jalankan backup untuk membuat recovery point."
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'createdAt', label: 'Time', render: (r) => new Date(String(r.createdAt)).toLocaleString('id-ID') },
              { key: 'sizeMb', label: 'Size', render: (r) => `${r.sizeMb} MB` },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
            ]}
          />
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Activity Timeline</h3>
          <div className="glass-panel rounded-lg border border-border p-4">
            <ActivityTimeline items={data.activityFeed ?? []} />
          </div>
        </div>
      </div>
    </div>
  )
}
