import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useGisMapData } from '@/features/gis/hooks/useGisData'
import { exportCsv, exportExcel, exportGeoJson, exportPdf, exportPng } from '@/features/gis/utils/export'

interface ExportControlProps {
  mapRef?: React.RefObject<HTMLDivElement | null>
}

export function ExportControl({ mapRef }: ExportControlProps) {
  const { data } = useGisMapData()
  const points = data?.points ?? []
  const [open, setOpen] = useState(false)

  const actions = [
    { label: 'PNG', fn: () => mapRef?.current && exportPng(mapRef.current) },
    { label: 'PDF', fn: () => mapRef?.current && exportPdf(mapRef.current) },
    { label: 'GeoJSON', fn: () => exportGeoJson(points) },
    { label: 'CSV', fn: () => exportCsv(points) },
    { label: 'Excel', fn: () => exportExcel(points) },
  ]

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" className="h-8 gap-1 text-xs" onClick={() => setOpen(!open)}>
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded border border-border bg-card py-1 shadow-lg">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-muted"
              onClick={() => { a.fn(); setOpen(false) }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
