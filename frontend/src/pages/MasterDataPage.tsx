import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { Layers } from 'lucide-react'

export function MasterDataPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['master-data'],
    queryFn: async () => (await api.get('/api/master')).data,
  })

  const sections = [
    { title: 'Kabupaten', items: data?.kabupaten ?? [] },
    { title: 'Kecamatan', items: data?.kecamatan ?? [] },
    { title: 'Jenis Kekerasan', items: data?.jenisKekerasan ?? [] },
    { title: 'Kategori', items: data?.kategori ?? [] },
    { title: 'Status', items: data?.status ?? [] },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Master Data (dari data kasus)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sections.map((s) => (
                <div key={s.title} className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-medium">{s.title} ({s.items.length})</p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                    {s.items.map((item: string) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data?.psikolog && (
        <Card>
          <CardHeader><CardTitle>Psikolog & Beban Kasus</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Nama</th>
                  <th className="py-2">Jumlah Kasus</th>
                </tr>
              </thead>
              <tbody>
                {data.psikolog.map((p: { name: string; count: number }) => (
                  <tr key={p.name} className="border-b border-border/50">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
