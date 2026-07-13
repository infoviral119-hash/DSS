import { NavLink, Outlet } from 'react-router-dom'
import {
  BookOpen, HelpCircle, Video, Info, GitBranch, Map, Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useHelpSearch } from '../hooks/useHelp'
import { Link } from 'react-router-dom'

const NAV = [
  { path: '/bantuan/tur', label: 'Tur Aplikasi', icon: Map },
  { path: '/bantuan/panduan', label: 'Panduan Menu', icon: BookOpen },
  { path: '/bantuan/faq', label: 'FAQ', icon: HelpCircle },
  { path: '/bantuan/video', label: 'Video Tutorial', icon: Video },
  { path: '/bantuan/tentang', label: 'Tentang e-Insight', icon: Info },
  { path: '/bantuan/release-notes', label: 'Release Notes', icon: GitBranch },
]

export function HelpLayout() {
  const [q, setQ] = useState('')
  const { data: results } = useHelpSearch(q)

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 rounded-lg border border-border bg-card p-3 lg:w-56">
        <p className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">Bantuan</p>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari panduan, FAQ..."
            className="h-8 pl-8 text-xs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && q.trim().length >= 2) {
                window.location.href = `/bantuan/cari?q=${encodeURIComponent(q.trim())}`
              }
            }}
          />
        </div>
        <nav className="space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-2 py-2 text-sm',
                  isActive ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-secondary/60',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        {q.trim().length >= 2 && results && (
          <div className="mt-3 border-t border-border pt-2 text-xs">
            <p className="mb-1 font-medium text-muted-foreground">Hasil cepat</p>
            {results.articles.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/bantuan/panduan/${a.slug}`} className="block truncate py-1 hover:text-primary">
                {a.title}
              </Link>
            ))}
          </div>
        )}
      </aside>
      <main className="min-w-0 flex-1 rounded-lg border border-border bg-card p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
