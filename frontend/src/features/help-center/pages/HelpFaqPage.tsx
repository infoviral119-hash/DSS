import { useHelpFaq } from '../hooks/useHelp'
import { MarkdownView } from '../components/MarkdownView'
import { HelpLoadState } from '../components/HelpLoadState'

export function HelpFaqPage() {
  const { data: items = [], isLoading, isError, error } = useHelpFaq()

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">Bantuan / FAQ</p>
        <h1 className="text-xl font-bold">Pertanyaan Umum</h1>
      </div>
      <HelpLoadState
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Memuat FAQ..."
        empty={items.length === 0}
        emptyText="Belum ada FAQ. Admin dapat menambah via CMS Bantuan."
      >
        <div className="space-y-4">
          {items.map((f) => (
            <div key={f.id} className="rounded-lg border border-border p-4">
              <h2 className="font-medium">{f.question}</h2>
              <div className="mt-2 text-sm text-muted-foreground">
                <MarkdownView content={f.answer} />
              </div>
            </div>
          ))}
        </div>
      </HelpLoadState>
    </div>
  )
}
