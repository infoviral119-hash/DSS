import { Search, Download, Printer, FileImage } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  search?: string
  onSearchChange?: (v: string) => void
  onExport?: () => void
  onExportPdf?: () => void
}

export function PageHeader({ title, subtitle, search, onSearchChange, onExport, onExportPdf }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-8 w-48 pl-8 text-xs"
              placeholder="Cari..."
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {onExport && (
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={onExport}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            {onExportPdf && (
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={onExportPdf}>
                <FileImage className="h-3.5 w-3.5" /> PDF
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPdf(filename: string, elementId = 'admin-export-root') {
  const el = document.getElementById(elementId) ?? document.body
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(el, { scale: 2, useCORS: true })
  const link = document.createElement('a')
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
