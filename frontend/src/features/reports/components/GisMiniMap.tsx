import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Point { lat: number; lng: number }

export function GisMiniMap({ points }: { points: Point[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !points.length) return
    let map: import('leaflet').Map | undefined

    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css')
      if (!ref.current) return
      const center = points[0]
      map = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([center.lat, center.lng], 8)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      const group: import('leaflet').LayerGroup = L.layerGroup()
      points.slice(0, 100).forEach((p) => {
        L.circleMarker([p.lat, p.lng], { radius: 4, color: '#e74c3c', fillOpacity: 0.7 }).addTo(group)
      })
      group.addTo(map)
    })

    return () => { map?.remove() }
  }, [points])

  if (!points.length) return null

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Peta Heatmap Kasus</CardTitle></CardHeader>
      <CardContent>
        <div ref={ref} className="h-52 w-full rounded border" />
      </CardContent>
    </Card>
  )
}
