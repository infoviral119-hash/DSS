import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReportHistory } from '@/features/reports/hooks/useReport'
import { Loader2 } from 'lucide-react'

export function ReportHistory() {
  const { data, isLoading } = useReportHistory()

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Report History</CardTitle></CardHeader>
      <CardContent className="max-h-64 overflow-auto">
        {isLoading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        ) : !data?.length ? (
          <p className="text-xs text-muted-foreground">Belum ada riwayat export.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1">Tanggal</th>
                <th className="py-1">Pembuat</th>
                <th className="py-1">Jenis</th>
                <th className="py-1">Format</th>
                <th className="py-1 text-right">Ukuran</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="py-1">{new Date(row.createdAt).toLocaleString('id-ID')}</td>
                  <td className="py-1">{row.createdBy}</td>
                  <td className="py-1">{row.category}</td>
                  <td className="py-1 uppercase">{row.format}</td>
                  <td className="py-1 text-right">{row.sizeKb} KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

export function MetadataPanel({ metadata, approval, watermark }: {
  metadata: { period: string; createdAt: string; createdBy: string; version: string; dataCount: number; source: string }
  approval: { status: string; note: string }
  watermark: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Report Metadata</CardTitle></CardHeader>
      <CardContent className="grid gap-2 text-xs sm:grid-cols-2">
        <p><span className="text-muted-foreground">Periode:</span> {metadata.period}</p>
        <p><span className="text-muted-foreground">Dibuat:</span> {new Date(metadata.createdAt).toLocaleString('id-ID')}</p>
        <p><span className="text-muted-foreground">Pembuat:</span> {metadata.createdBy}</p>
        <p><span className="text-muted-foreground">Versi:</span> v{metadata.version}</p>
        <p><span className="text-muted-foreground">Jumlah data:</span> {metadata.dataCount}</p>
        <p><span className="text-muted-foreground">Watermark:</span> {watermark}</p>
        <p><span className="text-muted-foreground">Status:</span> {approval.status}</p>
        <p><span className="text-muted-foreground">Sumber:</span> {metadata.source}</p>
      </CardContent>
    </Card>
  )
}
