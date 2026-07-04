import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/contexts/AppContext'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import { Activity, AlertCircle } from 'lucide-react'

export function PendampinganPage() {
  const { filters } = useApp()
  const params = { ...filtersToParams(filters), status: 'Aktif', limit: '100' }

  const { data, isLoading } = useQuery({
    queryKey: ['pendampingan', params],
    queryFn: async () => (await api.get('/api/cases', { params })).data,
  })

  const rows = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Kasus Aktif</p>
              <p className="text-xl font-bold">{data?.total ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitoring Pendampingan Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada kasus aktif.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((row: Record<string, string>) => (
                <div key={row.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-xs">
                  <div>
                    <p className="font-medium">{row.nama_korban}</p>
                    <p className="text-muted-foreground">{row.nomor_register} · {row.jenis_kekerasan}</p>
                  </div>
                  <div className="text-right">
                    <p>{row.psikolog_nama || '—'}</p>
                    <p className="flex items-center justify-end gap-1 text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      {row.status_pendampingan || 'Berjalan'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
