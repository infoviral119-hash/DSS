import { Link, useParams } from 'react-router-dom'
import { useHelpArticle, useHelpArticles } from '../hooks/useHelp'
import { MarkdownView } from '../components/MarkdownView'
import { ExternalLink } from 'lucide-react'

export function HelpArticlePage() {
  const { slug = '' } = useParams()
  const { data: article, isLoading, isError } = useHelpArticle(slug)
  const { data: related = [] } = useHelpArticles('panduan-menu')

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat artikel...</p>
  if (isError || !article) return <p className="text-sm text-destructive">Artikel tidak ditemukan.</p>

  const others = related.filter((a) => a.slug !== slug).slice(0, 4)

  return (
    <article className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">
          Bantuan / <Link to="/bantuan/panduan" className="hover:text-primary">Panduan Menu</Link> / {article.title}
        </p>
        <h1 className="text-2xl font-bold">{article.title}</h1>
        {article.summary && <p className="mt-1 text-sm text-muted-foreground">{article.summary}</p>}
        {article.author && <p className="mt-1 text-xs text-muted-foreground">Oleh {article.author}</p>}
      </div>

      {article.video_url && (
        <div className="aspect-video overflow-hidden rounded-lg border">
          <iframe title={article.title} src={article.video_url} className="h-full w-full" allowFullScreen />
        </div>
      )}

      {article.content && <MarkdownView content={article.content} />}

      {article.attachment && (
        <a
          href={article.attachment}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Unduh lampiran
        </a>
      )}

      {others.length > 0 && (
        <div className="border-t border-border pt-4">
          <h2 className="mb-2 text-sm font-semibold">Artikel terkait</h2>
          <ul className="space-y-1 text-sm">
            {others.map((a) => (
              <li key={a.id}>
                <Link to={`/bantuan/panduan/${a.slug}`} className="text-primary hover:underline">{a.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
