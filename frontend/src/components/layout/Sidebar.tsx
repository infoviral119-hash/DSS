import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  HandHeart,
  Database,
  Upload,
  BarChart3,
  Map,
  Sparkles,
  TrendingUp,
  FileText,
  Settings,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavItem, UserRole } from '@/types'
import type { ElementType } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'dashboard' },
  { id: 'pendampingan', label: 'Pendampingan', path: '/pendampingan', icon: 'pendampingan' },
  { id: 'data-historis', label: 'Data Historis', path: '/data-historis', icon: 'data' },
  { id: 'import', label: 'Import Data', path: '/import', icon: 'import', roles: ['admin', 'operator'] },
  { id: 'analitik', label: 'Analitik', path: '/analitik', icon: 'analitik' },
  { id: 'gis', label: 'GIS Intelligence', path: '/gis', icon: 'gis' },
  { id: 'ai', label: 'AI Insight', path: '/ai-insight', icon: 'ai' },
  { id: 'forecast', label: 'Forecasting', path: '/forecasting', icon: 'forecast' },
  { id: 'laporan', label: 'Laporan', path: '/laporan', icon: 'laporan' },
  { id: 'admin', label: 'Admin & Security', path: '/admin', icon: 'admin', roles: ['admin', 'auditor'] },
  { id: 'master', label: 'Master Data', path: '/master-data', icon: 'master', roles: ['admin'] },
  { id: 'settings', label: 'Pengaturan', path: '/pengaturan', icon: 'settings', roles: ['admin'] },
]

const ICON_MAP: Record<string, ElementType> = {
  dashboard: LayoutDashboard,
  pendampingan: HandHeart,
  data: Database,
  import: Upload,
  analitik: BarChart3,
  gis: Map,
  ai: Sparkles,
  forecast: TrendingUp,
  laporan: FileText,
  master: Layers,
  admin: Shield,
  settings: Settings,
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()
  const role = user?.role as UserRole | undefined

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  )

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar backdrop-blur-xl"
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
          eI
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
            <p className="truncate text-sm font-semibold">e-Insight</p>
            <p className="truncate text-[10px] text-muted-foreground">Decision Support System</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = ICON_MAP[item.icon]
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      (isActive || (item.path === '/admin' && location.pathname.startsWith('/admin')))
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-secondary/80 hover:text-card-foreground'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={onToggle}
        className="flex h-10 items-center justify-center border-t border-border text-muted-foreground hover:bg-secondary/50"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  )
}

export { NAV_ITEMS }
