import { memo, useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Loader2, AlertCircle, BarChart3, Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartPanelProps {
  title: string
  subtitle?: string
  previewHeight?: number
  popupHeight?: number
  isLoading?: boolean
  isError?: boolean
  isEmpty?: boolean
  renderChart: (height: number) => ReactNode
  className?: string
}

export const ChartPanel = memo(function ChartPanel({
  title,
  subtitle,
  previewHeight = 200,
  popupHeight = 560,
  isLoading,
  isError,
  isEmpty,
  renderChart,
  className,
}: ChartPanelProps) {
  const [open, setOpen] = useState(false)
  const ready = !isLoading && !isError && !isEmpty

  return (
    <>
      <Card className={cn(className)}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {ready && (
            <Button variant="ghost" size="sm" className="h-7 shrink-0 text-xs" onClick={() => setOpen(true)}>
              <Maximize2 className="h-3.5 w-3.5" />
              Popup
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" style={{ height: previewHeight }}>
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat...
            </div>
          )}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-2 text-sm text-red-500" style={{ height: previewHeight }}>
              <AlertCircle className="h-6 w-6" />
              Gagal memuat data
            </div>
          )}
          {isEmpty && !isLoading && !isError && (
            <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground" style={{ height: previewHeight }}>
              <BarChart3 className="h-6 w-6 opacity-40" />
              Tidak ada data
            </div>
          )}
          {ready && (
            <button type="button" className="w-full cursor-pointer text-left" onClick={() => setOpen(true)}>
              {renderChart(previewHeight)}
            </button>
          )}
        </CardContent>
      </Card>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(960px,96vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
                {subtitle && (
                  <Dialog.Description className="mt-1 text-xs text-muted-foreground">{subtitle}</Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            <div className="overflow-auto p-4">
              {ready && renderChart(popupHeight)}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
})
