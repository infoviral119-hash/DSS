import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users, UserCheck, UserX, Lock, ShieldAlert, Shield, Activity, Server, Database, HeartPulse,
} from 'lucide-react'
import { KpiGrid } from '../components/KpiGrid'
import { PageHeader, exportPdf } from '../components/PageHeader'
import { useSecurityDashboard } from '../hooks/useSecurity'

const ALL_WIDGETS = [
  { id: 'totalUsers', label: 'Total Users', icon: Users },
  { id: 'onlineUsers', label: 'Online Users', icon: UserCheck, tone: 'success' as const },
  { id: 'offlineUsers', label: 'Offline Users', icon: UserX },
  { id: 'lockedAccounts', label: 'Locked Accounts', icon: Lock, tone: 'danger' as const },
  { id: 'failedLogin', label: 'Failed Login', icon: ShieldAlert, tone: 'warning' as const },
  { id: 'mfaEnabled', label: 'MFA Enabled', icon: Shield },
  { id: 'activeSessions', label: 'Active Sessions', icon: Activity },
  { id: 'securityScore', label: 'Security Score', icon: Shield, tone: 'success' as const },
  { id: 'apiCalls', label: 'API Calls', icon: Server },
  { id: 'backupStatus', label: 'Backup Status', icon: Database },
  { id: 'systemHealth', label: 'System Health', icon: HeartPulse, tone: 'success' as const },
]

const STORAGE_KEY = 'e-insight-security-widgets'

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return ALL_WIDGETS.map((w) => w.id)
}

export function SecurityDashboardPage() {
  const { data, isLoading } = useSecurityDashboard()
  const [order, setOrder] = useState(loadOrder)
  const [dragId, setDragId] = useState<string | null>(null)

  const d = data ?? {
    totalUsers: 0, onlineUsers: 0, offlineUsers: 0, lockedAccounts: 0, failedLogin: 0,
    mfaEnabled: 0, expiredPassword: 0, activeSessions: 0, apiCalls: 0, securityScore: 0,
    backupStatus: '-', systemHealth: '-',
  }

  const kpiItems = useMemo(() => {
    const map: Record<string, string | number> = { ...d }
    return order
      .map((id) => ALL_WIDGETS.find((w) => w.id === id))
      .filter(Boolean)
      .map((w) => ({
        label: w!.label,
        value: map[w!.id] ?? '-',
        icon: w!.icon,
        tone: w!.tone,
      }))
  }, [order, d])

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const next = [...order]
    const from = next.indexOf(dragId)
    const to = next.indexOf(targetId)
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    setOrder(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setDragId(null)
  }

  const gaugeOption = {
    series: [{
      type: 'gauge', min: 0, max: 100,
      progress: { show: true, width: 12 },
      detail: { formatter: '{value}', fontSize: 22 },
      data: [{ value: d.securityScore }],
    }],
  }

  const pieOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['40%', '65%'],
      data: [
        { value: d.onlineUsers, name: 'Online' },
        { value: d.offlineUsers, name: 'Offline' },
        { value: d.lockedAccounts, name: 'Locked' },
      ],
    }],
  }

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Memuat dashboard keamanan...</div>
  }

  return (
    <div id="admin-export-root">
      <PageHeader
        title="Enterprise Security Dashboard"
        subtitle="Drag & drop KPI cards untuk custom layout"
        onExportPdf={() => exportPdf('security-dashboard')}
      />
      <p className="mb-2 text-[10px] text-muted-foreground">Seret kartu KPI untuk mengubah urutan</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpiItems.map((item, idx) => (
          <div
            key={order[idx]}
            draggable
            onDragStart={() => setDragId(order[idx])}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(order[idx])}
            className="cursor-grab active:cursor-grabbing"
          >
            <KpiGrid items={[item]} />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Security Score</CardTitle></CardHeader>
          <CardContent><ReactECharts option={gaugeOption} style={{ height: 220 }} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>User Status</CardTitle></CardHeader>
          <CardContent><ReactECharts option={pieOption} style={{ height: 220 }} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Login Trend</CardTitle></CardHeader>
          <CardContent><ReactECharts option={{
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] },
            yAxis: { type: 'value' },
            series: [{ type: 'line', smooth: true, data: [12, 18, 15, 22, 19, 8, 5] }],
          }} style={{ height: 220 }} /></CardContent>
        </Card>
      </div>
    </div>
  )
}
