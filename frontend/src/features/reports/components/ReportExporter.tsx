import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileText } from 'lucide-react'
import { filtersToParams } from '@/lib/filters'
import { useApp } from '@/contexts/AppContext'
import type { ReportParams } from '@/features/reports/hooks/useReport'

const FORMATS = ['PDF', 'Excel', 'CSV', 'Word', 'JSON', 'PNG', 'JPEG'] as const

export function ReportExporter({ params }: { params: ReportParams }) {
  const { filters } = useApp()
  const [open, setOpen] = useState(false)
  const base = filtersToParams(filters)
  const qs = new URLSearchParams({ ...base, ...params } as Record<string, string>).toString()

  const token = () => localStorage.getItem('e-insight-token')

  const logExport = async (format: string) => {
    await fetch(`/api/reports/history/log?${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) },
      body: JSON.stringify({ format, category: params.category, reportId: params.reportId }),
    })
  }

  const download = async (url: string, filename: string, format: string) => {
    const res = await fetch(url, { headers: token() ? { Authorization: `Bearer ${token()}` } : {} })
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    await logExport(format)
    setOpen(false)
  }

  const exportPdf = () => {
    window.open(`/api/reports/export/html?${qs}`, '_blank', 'noopener')
    logExport('pdf')
    setOpen(false)
  }

  const exportImage = async (mime: 'png' | 'jpeg') => {
    const el = document.getElementById('report-viewer-root')
    if (!el) return
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(el)
    const a = document.createElement('a')
    a.href = canvas.toDataURL(mime === 'jpeg' ? 'image/jpeg' : 'image/png')
    a.download = `laporan-${Date.now()}.${mime}`
    a.click()
    await logExport(mime)
    setOpen(false)
  }

  const handlers: Record<string, () => void> = {
    PDF: exportPdf,
    Excel: () => download(`/api/reports/export/excel?${qs}`, `laporan-${Date.now()}.xlsx`, 'excel'),
    CSV: () => download(`/api/reports/export?${qs}`, `laporan-${Date.now()}.csv`, 'csv'),
    Word: () => download(`/api/reports/export/word?${qs}`, `laporan-${Date.now()}.doc`, 'word'),
    JSON: () => download(`/api/reports/export/json?${qs}`, `laporan-${Date.now()}.json`, 'json'),
    PNG: () => exportImage('png'),
    JPEG: () => exportImage('jpeg'),
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          Export Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative inline-block">
          <Button onClick={() => setOpen(!open)} className="gap-2">
            <Download className="h-4 w-4" />
            Export Laporan
          </Button>
          {open && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded border border-border bg-card py-1 shadow-lg">
              {FORMATS.map((f) => (
                <button key={f} type="button" className="block w-full px-4 py-1.5 text-left text-xs hover:bg-muted" onClick={handlers[f]}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
