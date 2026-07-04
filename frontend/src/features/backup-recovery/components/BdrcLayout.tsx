import { NavLink, Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  HardDrive,
  History,
  RotateCcw,
  Clock,
  Archive,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ElementType } from 'react'

const BDRC_NAV: { path: string; label: string; icon: ElementType }[] = [
  { path: '/admin/backup-recovery', label: 'Backup Dashboard', icon: LayoutDashboard },
  { path: '/admin/backup-recovery/jobs', label: 'Backup Jobs', icon: Briefcase },
  { path: '/admin/backup-recovery/repository', label: 'Backup Repository', icon: HardDrive },
  { path: '/admin/backup-recovery/recovery-points', label: 'Recovery Point', icon: Clock },
  { path: '/admin/backup-recovery/restore', label: 'Restore Center', icon: RotateCcw },
  { path: '/admin/backup-recovery/history', label: 'Backup History', icon: History },
  { path: '/admin/backup-recovery/restore-history', label: 'Restore History', icon: Archive },
]

export function BdrcLayout() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Archive className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-sm font-semibold">Backup & Recovery</h2>
          <p className="text-[10px] text-muted-foreground">Enterprise BDRC — Tahap 1</p>
        </div>
      </div>
      <div className="flex gap-4">
        <aside className="w-52 shrink-0 border-r border-border pr-3">
          <ul className="space-y-0.5">
            {BDRC_NAV.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/admin/backup-recovery'}
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
        </aside>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Memuat modul backup...</div>}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
