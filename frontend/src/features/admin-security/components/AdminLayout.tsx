import { NavLink, Outlet } from 'react-router-dom'
import {
  Shield,
  Users,
  KeyRound,
  Lock,
  Building2,
  UsersRound,
  Briefcase,
  Monitor,
  History,
  FileSearch,
  ShieldCheck,
  Smartphone,
  Key,
  Laptop,
  Server,
  Database,
  HeartPulse,
  Settings,
  Archive,
  Scale,
  Bell,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  HardDrive,
  RotateCcw,
  Clock,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Suspense, useState } from 'react'
import type { ElementType } from 'react'
import { AdminFallback } from '../routes'

interface NavGroup {
  id: string
  label: string
  items: { path: string; label: string; icon: ElementType }[]
}

const ADMIN_NAV: NavGroup[] = [
  {
    id: 'identity',
    label: 'Identity & Access',
    items: [
      { path: '/admin/users', label: 'Users', icon: Users },
      { path: '/admin/roles', label: 'Roles', icon: KeyRound },
      { path: '/admin/permissions', label: 'Permissions', icon: Lock },
      { path: '/admin/user-groups', label: 'User Groups', icon: UsersRound },
      { path: '/admin/departments', label: 'Departments', icon: Briefcase },
      { path: '/admin/organizations', label: 'Organizations', icon: Building2 },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    items: [
      { path: '/admin/sessions', label: 'Active Sessions', icon: Monitor },
      { path: '/admin/login-history', label: 'Login History', icon: History },
      { path: '/admin/audit', label: 'Audit Trail', icon: FileSearch },
      { path: '/admin/security-center', label: 'Security Center', icon: ShieldCheck },
      { path: '/admin/mfa', label: 'MFA Management', icon: Smartphone },
      { path: '/admin/password-policy', label: 'Password Policy', icon: Key },
      { path: '/admin/trusted-devices', label: 'Trusted Devices', icon: Laptop },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { path: '/admin/master-data', label: 'Master Data', icon: Database },
      { path: '/admin/api', label: 'API Management', icon: Server },
      { path: '/admin/scheduler', label: 'Scheduler', icon: Calendar },
      { path: '/admin/notifications', label: 'Notification', icon: Bell },
      { path: '/admin/system-health', label: 'System Health', icon: HeartPulse },
      { path: '/admin/config', label: 'Configuration', icon: Settings },
      { path: '/admin/help-cms', label: 'CMS Bantuan', icon: BookOpen },
    ],
  },
  {
    id: 'backup',
    label: 'Backup & Recovery',
    items: [
      { path: '/admin/backup-recovery', label: 'Backup Dashboard', icon: LayoutDashboard },
      { path: '/admin/backup-recovery/jobs', label: 'Backup Jobs', icon: Archive },
      { path: '/admin/backup-recovery/repository', label: 'Backup Repository', icon: HardDrive },
      { path: '/admin/backup-recovery/recovery-points', label: 'Recovery Point', icon: Clock },
      { path: '/admin/backup-recovery/restore', label: 'Restore Center', icon: RotateCcw },
      { path: '/admin/backup-recovery/history', label: 'Backup History', icon: History },
      { path: '/admin/backup-recovery/restore-history', label: 'Restore History', icon: Archive },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    items: [
      { path: '/admin/data-retention', label: 'Data Retention', icon: Archive },
      { path: '/admin/privacy', label: 'Privacy', icon: Shield },
      { path: '/admin/consent', label: 'Consent Log', icon: Scale },
      { path: '/admin/audit-report', label: 'Audit Report', icon: FileSearch },
    ],
  },
]

export function AdminSubNav() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    identity: true,
    security: true,
    system: false,
    backup: true,
    compliance: false,
  })

  return (
    <aside className="w-56 shrink-0 border-r border-border pr-3">
      <NavLink
        to="/admin"
        end
        className={({ isActive }) =>
          cn(
            'mb-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/60',
          )
        }
      >
        <Shield className="h-4 w-4" />
        Security Dashboard
      </NavLink>

      {ADMIN_NAV.map((group) => (
        <div key={group.id} className="mb-2">
          <button
            type="button"
            onClick={() => setOpen((o) => ({ ...o, [group.id]: !o[group.id] }))}
            className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {group.label}
            <ChevronDown className={cn('h-3 w-3 transition-transform', open[group.id] && 'rotate-180')} />
          </button>
          {open[group.id] && (
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                      )
                    }
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </aside>
  )
}

export function AdminLayout() {
  return (
    <div className="flex gap-4">
      <AdminSubNav />
      <div className="min-w-0 flex-1">
        <Suspense fallback={<AdminFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}

export { ADMIN_NAV }
