import { useHelpReleaseNotes } from '../hooks/useHelp'
import { MarkdownView } from '../components/MarkdownView'
import { HelpLoadState } from '../components/HelpLoadState'

export function HelpReleaseNotesPage() {
  const { data: notes = [], isLoading, isError, error } = useHelpReleaseNotes()

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">Bantuan / Release Notes</p>
        <h1 className="text-xl font-bold">Release Notes</h1>
      </div>
      <HelpLoadState
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Memuat..."
        empty={notes.length === 0}
        emptyText="Belum ada release notes."
      >
        <div className="space-y-4">
          {notes.map((n) => (
            <div key={n.id} className="border-l-2 border-primary pl-4">
              <p className="text-xs text-muted-foreground">
                v{n.version} · {n.release_date ? new Date(n.release_date).toLocaleDateString('id-ID') : ''}
              </p>
              <h2 className="font-semibold">{n.title}</h2>
              {n.description && (
                <div className="mt-1 text-sm text-muted-foreground">
                  <MarkdownView content={n.description} />
                </div>
              )}
            </div>
          ))}
        </div>
      </HelpLoadState>
    </div>
  )
}
