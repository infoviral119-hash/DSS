import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { ForecastIntelligenceResponse } from '@/features/forecast/types/forecast'

export function ExportPanel({ data }: { data: ForecastIntelligenceResponse }) {
  const [open, setOpen] = useState(false)

  const exportCsv = () => {
    const rows = ['month,actual,predicted,lower,upper', ...data.series.map((s) =>
      `${s.month},${s.actual ?? ''},${s.predicted ?? ''},${s.lower ?? ''},${s.upper ?? ''}`,
    )]
    download(rows.join('\n'), 'forecast.csv', 'text/csv')
  }

  const exportTxt = () => {
    download(data.narrative + '\n\n' + data.executiveSummary.join('\n'), 'forecast-report.txt', 'text/plain')
  }

  const download = (content: string, name: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" className="gap-1" onClick={() => setOpen(!open)}>
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 rounded border border-border bg-card py-1 shadow-lg">
          {['CSV', 'Excel (CSV)', 'TXT Report'].map((label) => (
            <button
              key={label}
              type="button"
              className="block w-full px-4 py-1.5 text-left text-xs hover:bg-muted"
              onClick={() => (label.includes('TXT') ? exportTxt() : exportCsv())}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
