import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Settings, Moon, Sun, LogOut, User } from 'lucide-react'

export function PengaturanPage() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Profil Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{user?.fullName}</p>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-xs capitalize text-primary">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Button variant="outline" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
            {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Button variant="destructive" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
