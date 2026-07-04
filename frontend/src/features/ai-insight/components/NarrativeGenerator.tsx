import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NarrativeGenerator({ narrative, roleInsight }: { narrative: string; roleInsight: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI Narrative</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{narrative || 'Belum cukup data untuk narasi.'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Insight Level Anda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{roleInsight}</p>
        </CardContent>
      </Card>
    </div>
  )
}
