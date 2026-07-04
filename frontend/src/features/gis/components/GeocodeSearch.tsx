import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { geocodeForward } from '@/features/gis/hooks/useGisData'

interface GeocodeSearchProps {
  onLocate?: (lat: number, lng: number) => void
}

export function GeocodeSearch({ onLocate }: GeocodeSearchProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    const coords = await geocodeForward(query.trim())
    setLoading(false)
    if (coords) onLocate?.(coords[0], coords[1])
  }

  return (
    <section className="rounded border border-border p-2">
      <p className="mb-2 text-xs font-semibold">Geocoding</p>
      <div className="flex gap-1">
        <input
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
          placeholder="Cari wilayah..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <Button size="sm" className="h-7 text-xs" onClick={search} disabled={loading}>
          {loading ? '...' : 'Cari'}
        </Button>
      </div>
    </section>
  )
}
