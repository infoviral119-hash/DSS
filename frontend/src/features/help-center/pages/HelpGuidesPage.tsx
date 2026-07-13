import { Link } from 'react-router-dom'
import { useHelpArticles } from '../hooks/useHelp'
import { HelpLoadState } from '../components/HelpLoadState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function HelpGuidesPage() {
  const { data: articles = [], isLoading, isError, error } = useHelpArticles('panduan-menu')

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">Bantuan / Panduan Menu</p>
        <h1 className="text-xl font-bold">Panduan Menu</h1>
        <p className="text-sm text-muted-foreground">Dokumentasi penggunaan setiap modul aplikasi.</p>
      </div>
      <HelpLoadState
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Memuat panduan..."
        empty={articles.length === 0}
        emptyText="Belum ada artikel. Admin dapat menambah via CMS Bantuan."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {articles.map((a) => (
            <Link key={a.id} to={`/bantuan/panduan/${a.slug}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </CardHeader>
                {a.summary && (
                  <CardContent className="text-sm text-muted-foreground">{a.summary}</CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </HelpLoadState>
    </div>
  )
}
