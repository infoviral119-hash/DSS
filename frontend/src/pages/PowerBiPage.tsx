import { useEffect, useRef } from 'react'
import { ExternalLink, BarChart2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePowerBiEmbed, usePowerBiStatus } from '@/features/powerbi/hooks/usePowerBi'

declare global {
  interface Window {
    powerbi?: {
      embed: (el: HTMLElement, config: Record<string, unknown>) => { on: (event: string, cb: () => void) => void }
      models?: { TokenType: { Embed: number } }
    }
  }
}

function loadPowerBiSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.powerbi) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/powerbi-client@2.22.3/dist/powerbi.min.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat Power BI SDK'))
    document.head.appendChild(script)
  })
}

function SpEmbed({ embedUrl, accessToken, reportId }: { embedUrl: string; accessToken: string; reportId: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    loadPowerBiSdk().then(() => {
      if (!mounted || !ref.current || !window.powerbi) return
      window.powerbi.embed(ref.current, {
        type: 'report',
        id: reportId,
        embedUrl,
        accessToken,
        tokenType: window.powerbi.models?.TokenType.Embed ?? 1,
        settings: { panes: { filters: { visible: false }, pageNavigation: { visible: true } } },
      })
    }).catch(() => {})
    return () => { mounted = false }
  }, [embedUrl, accessToken, reportId])

  return <div ref={ref} className="min-h-[560px] w-full rounded-lg border bg-white" />
}

function BiIframe({ title, src }: { title: string; src: string }) {
  return (
    <iframe
      title={title}
      src={src}
      className="min-h-[600px] w-full rounded-b-lg border-0"
      allowFullScreen
    />
  )
}

export function PowerBiPage() {
  const { data: status, isLoading: statusLoading } = usePowerBiStatus()
  const { data: embed, isLoading: embedLoading, isError } = usePowerBiEmbed(Boolean(status?.configured))

  const loading = statusLoading || (status?.configured && embedLoading)
  const isMetabase = status?.provider === 'metabase' || embed?.provider === 'metabase'
  const pageTitle = isMetabase ? 'Metabase Dashboard' : 'Power BI Dashboard'
  const pageDesc = isMetabase
    ? 'Laporan interaktif Metabase — terhubung langsung ke database Supabase'
    : 'Laporan interaktif Power BI terintegrasi dengan data e-Insight'

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{pageDesc}</p>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
            Memuat konfigurasi dashboard...
          </CardContent>
        </Card>
      )}

      {!loading && !status?.configured && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Metabase belum dikonfigurasi
            </CardTitle>
            <p className="text-sm text-muted-foreground">Metabase OSS gratis — self-host via Docker, koneksi ke Supabase.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Langkah lokal</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                <li><code className="rounded bg-muted px-1">npm run metabase:start</code> → buka http://localhost:3000</li>
                <li>Tambah database PostgreSQL (Supabase) → tabel <code className="rounded bg-muted px-1">cases</code></li>
                <li>Buat dashboard → Share → Public link</li>
                <li>Simpan URL di <code className="rounded bg-muted px-1">metabase.env</code> → <code className="rounded bg-muted px-1">npm run metabase:setup</code></li>
              </ol>
            </div>
            <p>Secret Cloudflare Pages: <code className="rounded bg-muted px-1">METABASE_DASHBOARD_URL</code> (iframe embed) atau <code className="rounded bg-muted px-1">METABASE_PUBLIC_URL</code> (link).</p>
            <p className="text-xs">Alternatif berbayar: Power BI (<code className="rounded bg-muted px-1">POWERBI_SHARE_URL</code>).</p>
          </CardContent>
        </Card>
      )}

      {!loading && (embed?.mode === 'metabase' || embed?.mode === 'iframe') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="h-5 w-5" />
              {isMetabase ? 'Dashboard Metabase' : 'Dashboard Power BI'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BiIframe
              title={isMetabase ? 'Metabase' : 'Power BI'}
              src={embed.embedUrl}
            />
          </CardContent>
        </Card>
      )}

      {!loading && embed?.mode === 'link' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {embed.provider === 'metabase' ? 'Buka Metabase' : 'Buka di Power BI Service'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Dashboard di-host di {embed.provider === 'metabase' ? 'Metabase' : 'Power BI cloud'} — klik untuk membuka tab baru.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={embed.shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Buka Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && embed?.mode === 'embed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dashboard Power BI (Embedded)</CardTitle>
            <p className="text-sm text-muted-foreground">Token embed via Azure Service Principal · kedaluwarsa {new Date(embed.expiration).toLocaleString('id-ID')}</p>
          </CardHeader>
          <CardContent>
            <SpEmbed embedUrl={embed.embedUrl} accessToken={embed.accessToken} reportId={embed.reportId} />
          </CardContent>
        </Card>
      )}

      {!loading && isError && status?.configured && (
        <Card className="border-destructive/40">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Gagal memuat embed dashboard. Periksa konfigurasi secret di Cloudflare Pages.
          </CardContent>
        </Card>
      )}

      {!loading && embed?.mode === 'none' && status?.configured && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Konfigurasi tidak valid</CardTitle>
            <p className="text-sm text-muted-foreground">{embed.message}</p>
          </CardHeader>
          {embed.setup.length > 0 && (
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {embed.setup.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
