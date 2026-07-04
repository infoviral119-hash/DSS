import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

export function ExecutiveBriefButton({ brief }: { brief: string }) {
  const [open, setOpen] = useState(false)

  const download = () => {
    const blob = new Blob([brief], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ringkasan-pimpinan.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="default" className="gap-1.5" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" />
        Ringkas untuk Pimpinan
      </Button>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(640px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg border border-border bg-card p-5 shadow-xl">
          <Dialog.Title className="text-base font-semibold">Ringkasan Eksekutif</Dialog.Title>
          <pre className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{brief}</pre>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={download} className="gap-1">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Dialog.Close asChild>
              <Button size="sm" variant="secondary">Tutup</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
