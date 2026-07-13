import { useEffect } from 'react'
import { useTour } from '../components/ProductTour'
import { Button } from '@/components/ui/button'
import { Map } from 'lucide-react'
import { useProductTour } from '../hooks/useHelp'
import { HelpLoadState } from '../components/HelpLoadState'

export function HelpTourPage() {
  const { startTour } = useTour()
  const { data: steps = [], isLoading, isError, error } = useProductTour()

  useEffect(() => {
    const t = setTimeout(() => startTour(), 400)
    return () => clearTimeout(t)
  }, [startTour])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Tur Aplikasi</h1>
      <p className="text-sm text-muted-foreground">
        Panduan interaktif membaca seluruh modul e-Insight. Semua langkah diambil dari database cloud — dapat diubah admin tanpa deploy ulang.
      </p>
      <HelpLoadState
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Memuat langkah tur..."
        empty={steps.length === 0}
        emptyText="Belum ada langkah tur. Admin dapat mengatur via CMS Bantuan."
      >
        <>
          <p className="text-sm">{steps.length} langkah tersedia.</p>
          <Button onClick={startTour}>
            <Map className="mr-2 h-4 w-4" />
            Mulai Tur
          </Button>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {steps.map((s) => (
              <li key={s.id}>
                <span className="font-medium text-foreground">{s.title}</span>
                {s.description && ` — ${s.description}`}
              </li>
            ))}
          </ol>
        </>
      </HelpLoadState>
    </div>
  )
}
