import { useState } from 'react'
import { PageHeader } from '@/features/admin-security/components/PageHeader'
import { SecurityTable } from '@/features/admin-security/components/SecurityTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useAdminFaq, useAdminHelpArticles, useAdminHelpMutations, useAdminTour, useHelpAbout,
} from '@/features/help-center/hooks/useHelp'
import type { FaqItem, HelpArticle, TourStep } from '@/features/help-center/types'
import { MarkdownView } from '@/features/help-center/components/MarkdownView'

const TABS = ['Artikel', 'FAQ', 'Product Tour', 'Tentang'] as const

export function HelpCmsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Artikel')
  const { data: articles = [] } = useAdminHelpArticles()
  const { data: faq = [] } = useAdminFaq()
  const { data: tour = [] } = useAdminTour()
  const { data: about } = useHelpAbout()
  const { saveArticle, deleteArticle, saveFaq, saveTour, deleteTour, saveAbout } = useAdminHelpMutations()

  const [draft, setDraft] = useState<Partial<HelpArticle>>({ published: false, content: '', title: '', slug: '' })
  const [faqDraft, setFaqDraft] = useState<Partial<FaqItem>>({ question: '', answer: '', published: true })
  const [tourDraft, setTourDraft] = useState<Partial<TourStep>>({
    step: (tour.length || 0) + 1, target_selector: '', title: '', description: '', placement: 'bottom', page: '*', is_active: true,
  })

  return (
    <div className="space-y-4">
      <PageHeader title="CMS Bantuan" subtitle="Kelola dokumentasi cloud — tanpa deploy ulang" />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} variant={tab === t ? 'default' : 'outline'} size="sm" onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>

      {tab === 'Artikel' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Daftar Artikel</CardTitle></CardHeader>
            <CardContent>
              <SecurityTable<HelpArticle & Record<string, unknown>>
                rows={articles as (HelpArticle & Record<string, unknown>)[]}
                columns={[
                  { key: 'title', label: 'Judul' },
                  { key: 'slug', label: 'Slug' },
                  { key: 'published', label: 'Publish', render: (r) => (r.published ? 'Ya' : 'Draft') },
                ]}
                onRowClick={(r) => setDraft(r as HelpArticle)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Editor Artikel (Markdown)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Judul" value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <input className="w-full rounded border px-2 py-1 text-sm" placeholder="slug-artikel" value={draft.slug ?? ''} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
              <textarea className="min-h-[120px] w-full rounded border p-2 font-mono text-xs" placeholder="Konten Markdown..." value={draft.content ?? ''} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(draft.published)} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
                Publish
              </label>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveArticle.mutate(draft as HelpArticle & { id?: string })}>Simpan</Button>
                {draft.id && (
                  <Button size="sm" variant="destructive" onClick={() => { deleteArticle.mutate(draft.id!); setDraft({ published: false, content: '', title: '', slug: '' }) }}>
                    Hapus
                  </Button>
                )}
              </div>
              {draft.content && (
                <div className="mt-2 rounded border p-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Preview</p>
                  <MarkdownView content={draft.content} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'FAQ' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SecurityTable<FaqItem & Record<string, unknown>>
            rows={faq as (FaqItem & Record<string, unknown>)[]}
            columns={[{ key: 'question', label: 'Pertanyaan' }, { key: 'published', label: 'Publish' }]}
            onRowClick={(r) => setFaqDraft(r as FaqItem)}
          />
          <Card>
            <CardContent className="space-y-2 pt-4">
              <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Pertanyaan" value={faqDraft.question ?? ''} onChange={(e) => setFaqDraft({ ...faqDraft, question: e.target.value })} />
              <textarea className="min-h-[80px] w-full rounded border p-2 text-sm" placeholder="Jawaban" value={faqDraft.answer ?? ''} onChange={(e) => setFaqDraft({ ...faqDraft, answer: e.target.value })} />
              <Button size="sm" onClick={() => saveFaq.mutate(faqDraft)}>Simpan FAQ</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'Product Tour' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SecurityTable<TourStep & Record<string, unknown>>
            rows={tour as (TourStep & Record<string, unknown>)[]}
            columns={[
              { key: 'step', label: '#' },
              { key: 'title', label: 'Judul' },
              { key: 'target_selector', label: 'Selector' },
            ]}
            onRowClick={(r) => setTourDraft(r as TourStep)}
          />
          <Card>
            <CardContent className="space-y-2 pt-4">
              <input className="w-full rounded border px-2 py-1 text-sm" type="number" placeholder="Step" value={tourDraft.step ?? 1} onChange={(e) => setTourDraft({ ...tourDraft, step: Number(e.target.value) })} />
              <input className="w-full rounded border px-2 py-1 text-sm" placeholder="[data-tour=...]" value={tourDraft.target_selector ?? ''} onChange={(e) => setTourDraft({ ...tourDraft, target_selector: e.target.value })} />
              <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Judul" value={tourDraft.title ?? ''} onChange={(e) => setTourDraft({ ...tourDraft, title: e.target.value })} />
              <textarea className="w-full rounded border p-2 text-sm" placeholder="Deskripsi" value={tourDraft.description ?? ''} onChange={(e) => setTourDraft({ ...tourDraft, description: e.target.value })} />
              <Button size="sm" onClick={() => saveTour.mutate(tourDraft)}>Simpan Step</Button>
              {tourDraft.id && <Button size="sm" variant="destructive" onClick={() => deleteTour.mutate(tourDraft.id!)}>Hapus</Button>}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'Tentang' && (
        <Card>
          <CardContent className="space-y-2 pt-4">
            <input className="w-full rounded border px-2 py-1 text-sm" defaultValue={about?.application_name} placeholder="Nama aplikasi" id="about-name" />
            <input className="w-full rounded border px-2 py-1 text-sm" defaultValue={about?.version} placeholder="Versi" id="about-ver" />
            <input className="w-full rounded border px-2 py-1 text-sm" defaultValue={about?.developer ?? ''} placeholder="Developer" id="about-dev" />
            <textarea className="min-h-[80px] w-full rounded border p-2 text-sm" defaultValue={about?.description ?? ''} placeholder="Deskripsi" id="about-desc" />
            <Button size="sm" onClick={() => {
              saveAbout.mutate({
                application_name: (document.getElementById('about-name') as HTMLInputElement).value,
                version: (document.getElementById('about-ver') as HTMLInputElement).value,
                developer: (document.getElementById('about-dev') as HTMLInputElement).value,
                description: (document.getElementById('about-desc') as HTMLTextAreaElement).value,
              })
            }}>Simpan Tentang</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
