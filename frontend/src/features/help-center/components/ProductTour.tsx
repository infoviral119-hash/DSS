import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProductTour } from '../hooks/useHelp'
import type { TourStep } from '../types'

type TourContextValue = {
  startTour: () => void
  stopTour: () => void
  active: boolean
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within ProductTourProvider')
  return ctx
}

function TourOverlay({
  steps,
  index,
  onNext,
  onPrev,
  onClose,
}: {
  steps: TourStep[]
  index: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}) {
  const step = steps[index]
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!step) return
    const el = document.querySelector(step.target_selector)
    if (!el) {
      setRect(null)
      return
    }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const update = () => setRect(el.getBoundingClientRect())
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [step, index])

  if (!step) return null

  const tooltipStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        zIndex: 9999,
        top: step.placement === 'bottom' ? rect.bottom + 12 : step.placement === 'top' ? rect.top - 12 : rect.top,
        left: step.placement === 'right' ? rect.right + 12 : step.placement === 'left' ? rect.left - 12 : rect.left,
        transform: step.placement === 'top' ? 'translateY(-100%)' : step.placement === 'left' ? 'translateX(-100%)' : undefined,
        maxWidth: 320,
      }
    : { position: 'fixed', zIndex: 9999, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 360 }

  return (
    <div className="fixed inset-0 z-[9998]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {rect && (
        <div
          className="pointer-events-none fixed rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            zIndex: 9999,
          }}
        />
      )}
      <div className="rounded-lg border border-border bg-background p-4 shadow-xl" style={tooltipStyle}>
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Langkah {index + 1} / {steps.length}</p>
            <h3 className="font-semibold">{step.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {step.description && <p className="mb-3 text-sm text-muted-foreground">{step.description}</p>}
        {!rect && (
          <p className="mb-3 text-xs text-amber-600">Elemen tidak ditemukan: {step.target_selector}</p>
        )}
        <div className="flex justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={index === 0}>
            <ChevronLeft className="mr-1 h-3 w-3" /> Sebelumnya
          </Button>
          <Button size="sm" onClick={onNext}>
            {index >= steps.length - 1 ? 'Selesai' : 'Lanjut'} <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProductTourProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: steps = [] } = useProductTour()
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)

  const filtered = steps.filter((s) => !s.page || s.page === '*' || s.page === location.pathname)

  const startTour = useCallback(() => {
    setIndex(0)
    setActive(true)
    if (location.pathname.startsWith('/bantuan')) {
      navigate('/')
    }
  }, [location.pathname, navigate])

  const stopTour = useCallback(() => {
    setActive(false)
    setIndex(0)
  }, [])

  const onNext = () => {
    if (index >= filtered.length - 1) stopTour()
    else setIndex((i) => i + 1)
  }

  const onPrev = () => setIndex((i) => Math.max(0, i - 1))

  return (
    <TourContext.Provider value={{ startTour, stopTour, active }}>
      {children}
      {active && filtered.length > 0 && (
        <TourOverlay steps={filtered} index={index} onNext={onNext} onPrev={onPrev} onClose={stopTour} />
      )}
    </TourContext.Provider>
  )
}
