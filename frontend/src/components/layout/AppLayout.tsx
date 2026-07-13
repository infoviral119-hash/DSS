import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { GlobalFilterBar } from './GlobalFilterBar'
import { NAV_ITEMS } from './Sidebar'

const PAGE_TITLES: Record<string, string> = {
  ...Object.fromEntries(NAV_ITEMS.map((item) => [item.path, item.label])),
  '/bantuan': 'Bantuan',
  '/admin': 'Administration & Security',
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const sidebarWidth = collapsed ? 64 : 240
  const title = location.pathname.startsWith('/bantuan')
    ? 'Bantuan'
    : PAGE_TITLES[location.pathname] || 'e-Insight'

  const showGlobalFilter = !['/import', '/pengaturan', '/master-data'].includes(location.pathname)
    && !location.pathname.startsWith('/admin')
    && !location.pathname.startsWith('/bantuan')

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Header sidebarWidth={sidebarWidth} title={title} />
      <main
        style={{ marginLeft: sidebarWidth }}
        className="min-h-screen pt-14 transition-[margin-left] duration-200"
      >
        <div className="p-4 md:p-6">
          {showGlobalFilter && <GlobalFilterBar />}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
