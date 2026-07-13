import { useHelpAbout } from '../hooks/useHelp'
import { MarkdownView } from '../components/MarkdownView'
import { HelpLoadState } from '../components/HelpLoadState'
import { ExternalLink } from 'lucide-react'

export function HelpAboutPage() {
  const { data: about, isLoading, isError, error } = useHelpAbout()

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">Bantuan / Tentang</p>
        <h1 className="text-xl font-bold">{about?.application_name ?? 'e-Insight'}</h1>
        <p className="text-sm text-muted-foreground">Integrated Violence Case Management & Decision Support System</p>
      </div>
      <HelpLoadState isLoading={isLoading} isError={isError} error={error} loadingText="Memuat...">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Versi</dt><dd className="font-medium">{about?.version ?? '1.0'}</dd></div>
          <div><dt className="text-muted-foreground">Developer</dt><dd className="font-medium">{about?.developer ?? '@budi, @Henokhvita'}</dd></div>
          {(about?.website ?? 'https://e-insight.pages.dev') && (
            <div>
              <dt className="text-muted-foreground">Platform</dt>
              <dd>
                <a href={about?.website ?? 'https://e-insight.pages.dev'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {about?.website ?? 'https://e-insight.pages.dev'} <ExternalLink className="h-3 w-3" />
                </a>
              </dd>
            </div>
          )}
          {about?.email && (
            <div><dt className="text-muted-foreground">Email</dt><dd>{about.email}</dd></div>
          )}
        </dl>
        {about?.description && <MarkdownView content={about.description} />}
      </HelpLoadState>
    </div>
  )
}
