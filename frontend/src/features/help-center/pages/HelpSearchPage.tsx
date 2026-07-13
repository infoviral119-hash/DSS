import { Link, useSearchParams } from 'react-router-dom'
import { useHelpSearch } from '../hooks/useHelp'

export function HelpSearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const { data, isLoading } = useHelpSearch(q)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">Bantuan / Pencarian</p>
        <h1 className="text-xl font-bold">Hasil pencarian</h1>
        <p className="text-sm text-muted-foreground">Kata kunci: &quot;{q}&quot;</p>
      </div>
      {q.trim().length < 2 ? (
        <p className="text-sm text-muted-foreground">Ketik minimal 2 karakter.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Mencari...</p>
      ) : (
        <div className="space-y-6">
          {data?.articles && data.articles.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">Panduan ({data.articles.length})</h2>
              <ul className="space-y-1 text-sm">
                {data.articles.map((a) => (
                  <li key={a.id}>
                    <Link to={`/bantuan/panduan/${a.slug}`} className="text-primary hover:underline">{a.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data?.faq && data.faq.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">FAQ ({data.faq.length})</h2>
              <ul className="space-y-2 text-sm">
                {data.faq.map((f) => (
                  <li key={f.id}><span className="font-medium">{f.question}</span></li>
                ))}
              </ul>
            </section>
          )}
          {data?.videos && data.videos.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">Video ({data.videos.length})</h2>
              <ul className="space-y-1 text-sm">
                {data.videos.map((v) => (
                  <li key={v.id}>{v.title}</li>
                ))}
              </ul>
            </section>
          )}
          {data?.releaseNotes && data.releaseNotes.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">Release Notes ({data.releaseNotes.length})</h2>
              <ul className="space-y-1 text-sm">
                {data.releaseNotes.map((n) => (
                  <li key={n.id}>v{n.version} — {n.title}</li>
                ))}
              </ul>
            </section>
          )}
          {!data?.articles?.length && !data?.faq?.length && !data?.videos?.length && !data?.releaseNotes?.length && (
            <p className="text-sm text-muted-foreground">Tidak ada hasil.</p>
          )}
        </div>
      )}
    </div>
  )
}
