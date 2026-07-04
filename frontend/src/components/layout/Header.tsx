import { Moon, Sun, Search, User, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { GlobalSearch } from './GlobalSearch'
import { NotificationPanel } from './NotificationPanel'

interface HeaderProps {
  sidebarWidth: number
  title: string
}

export function Header({ sidebarWidth, title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header
        style={{ marginLeft: sidebarWidth }}
        className="fixed right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-sidebar/80 px-4 backdrop-blur-xl transition-[margin-left] duration-200"
      >
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <NotificationPanel />
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <div className="ml-2 flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-1.5">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="hidden sm:block">
              <p className="text-xs font-medium">{user?.fullName}</p>
              <p className="text-[10px] capitalize text-muted-foreground">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
