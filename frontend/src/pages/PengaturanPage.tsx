import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useAiLlmStatus } from '@/features/ai-insight/hooks/useAiLlm'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Settings, Moon, Sun, LogOut, User, Activity } from 'lucide-react'

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-green-500' : 'bg-amber-500'}`} />
  )
}

export function PengaturanPage() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { data: llm } = useAiLlmStatus()
  const { data: ml } = useQuery({
    queryKey: ['ml-status-settings'],
    queryFn: async () => (await api.get('/api/forecast/ml-status')).data as { connected: boolean; message?: string },
    staleTime: 60_000,
  })

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            Status Layanan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">LLM (AI Insight)</span>
            <span className="flex items-center gap-2">
              <StatusDot ok={Boolean(llm?.enabled)} />
              {llm?.enabled ? `${llm.provider}/${llm.model}` : 'Nonaktif'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">ML Forecast</span>
            <span className="flex items-center gap-2">
              <StatusDot ok={Boolean(ml?.connected)} />
              {ml?.connected ? 'Online' : (ml?.message ?? 'Offline')}
            </span>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            App: <a className="text-primary underline" href="https://e-insight.pages.dev" target="_blank" rel="noreferrer">e-insight.pages.dev</a>
          </p>
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
