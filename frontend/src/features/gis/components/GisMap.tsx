import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import 'leaflet.heat/dist/leaflet-heat.js'
import '@/styles/leaflet-heatmap.css'
import { setupLeafletIcons } from '@/lib/leaflet-setup'
import { useGisMapData, useGisBoundaries, useGisServices, geocodeReverse } from '@/features/gis/hooks/useGisData'
import { useGis } from '@/features/gis/context/GisContext'
import { HOTSPOT_GRADIENT, choroplethColor, GIS_COLORS } from '@/features/gis/utils/colors'
import { dbscanCluster, kmeansCluster, gridCluster } from '@/features/gis/utils/clustering'
import { pointsInRadius, pointsInPolygon, aggregateCases } from '@/features/gis/utils/spatial'
import type { GisMapPoint } from '@/features/gis/types/gis'
import * as turf from '@turf/turf'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

function popupHtml(p: GisMapPoint) {
  return `<div style="min-width:180px;font-size:12px">
    <b>${p.nomorRegister}</b><br/>
    ${p.namaKorban}<br/>
    <span style="color:#6B7280">${p.jenisKekerasan}</span><br/>
    ${p.tanggal?.slice(0, 10) ?? ''} · ${p.status}<br/>
    ${p.kabupaten ?? ''}<br/>
    <small>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</small>
  </div>`
}

export interface GisMapHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void
}

export const GisMap = forwardRef<GisMapHandle>(function GisMap(_, ref) {
  const mapEl = useRef<HTMLDivElement>(null)
  const mapInst = useRef<L.Map | null>(null)
  const osmRef = useRef<L.TileLayer | null>(null)
  const satRef = useRef<L.TileLayer | null>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const markerRef = useRef<L.LayerGroup | null>(null)
  const heatRef = useRef<L.HeatLayer | null>(null)
  const hotspotRef = useRef<L.HeatLayer | null>(null)
  const boundaryRef = useRef<L.GeoJSON | null>(null)
  const analysisRef = useRef<L.LayerGroup | null>(null)
  const drawRef = useRef<L.FeatureGroup | null>(null)
  const drawControlRef = useRef<L.Control.Draw | null>(null)

  const { data, isLoading } = useGisMapData()
  const { data: kabBoundaries } = useGisBoundaries('kabupaten', true)
  const { data: provBoundaries } = useGisBoundaries('provinsi', true)
  const { data: services } = useGisServices()

  const {
    layers, activeTool, clusterMethod, clusterCount, setClusterGroups,
    hotspot, choroplethMetric, radiusM, setRadiusResult,
    setPolygonResult, bufferService, bufferKm,
    setReverseAddress, setSelectedPointId,
  } = useGis()

  const flyTo = useCallback((lat: number, lng: number, zoom = 12) => {
    mapInst.current?.flyTo([lat, lng], zoom)
  }, [])

  useImperativeHandle(ref, () => ({ flyTo }), [flyTo])

  useEffect(() => {
    setupLeafletIcons()
    const el = mapEl.current
    if (!el || mapInst.current) return

    const map = L.map(el, { zoomControl: true })
    map.setView([-6.9175, 107.6191], 10)
    mapInst.current = map

    osmRef.current = L.tileLayer(OSM_URL, { attribution: '&copy; OSM', maxZoom: 19 }).addTo(map)
    satRef.current = L.tileLayer(SAT_URL, { attribution: '&copy; Esri', maxZoom: 18 })

    clusterRef.current = L.markerClusterGroup({ maxClusterRadius: 50, chunkedLoading: true })
    markerRef.current = L.layerGroup()
    analysisRef.current = L.layerGroup()
    drawRef.current = new L.FeatureGroup().addTo(map)

    void import('leaflet-draw/dist/leaflet.draw.css')
    void import('leaflet-draw').then(() => {
      if (!drawRef.current || !mapInst.current) return
      try {
        const drawControl = new L.Control.Draw({
          draw: {
            polygon: { allowIntersection: false },
            polyline: false,
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
          },
          edit: { featureGroup: drawRef.current },
        })
        drawControlRef.current = drawControl
      } catch {
        drawControlRef.current = null
      }
    }).catch(() => {
      drawControlRef.current = null
    })

    map.on('draw:created', (e: L.LeafletEvent) => {
      const evt = e as L.DrawEvents.Created
      const layer = evt.layer
      drawRef.current?.addLayer(layer)
      if (evt.layerType === 'polygon' && data?.points) {
        const latlngs = (layer as L.Polygon).getLatLngs()[0] as L.LatLng[]
        const coords = latlngs.map((ll) => [ll.lat, ll.lng] as [number, number])
        const cases = pointsInPolygon(data.points, coords)
        const agg = aggregateCases(cases)
        setPolygonResult({ count: cases.length, cases, ...agg })
      }
    })

    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)

    return () => {
      ro.disconnect()
      map.remove()
      mapInst.current = null
    }
  }, [data?.points, setPolygonResult])

  useEffect(() => {
    const map = mapInst.current
    if (!map || !data?.points) return

    const points = data.points
    clusterRef.current?.clearLayers()
    markerRef.current?.clearLayers()
    analysisRef.current?.clearLayers()

    if (layers.markers && !layers.cluster) {
      for (const p of points) {
        const m = L.circleMarker([p.lat, p.lng], {
          radius: 5, color: GIS_COLORS.blue, fillColor: GIS_COLORS.blue, fillOpacity: 0.8, weight: 1,
        })
        m.bindPopup(popupHtml(p))
        m.on('click', () => setSelectedPointId(p.id))
        markerRef.current?.addLayer(m)
      }
    }

    let groups = [] as ReturnType<typeof dbscanCluster>
    if (clusterMethod === 'dbscan') groups = dbscanCluster(points)
    else if (clusterMethod === 'kmeans') groups = kmeansCluster(points, clusterCount)
    else if (clusterMethod === 'grid') groups = gridCluster(points)

    setClusterGroups(groups)

    if (layers.cluster || clusterMethod === 'marker') {
      if (clusterMethod === 'marker') {
        for (const p of points) {
          const m = L.circleMarker([p.lat, p.lng], {
            radius: 5, color: GIS_COLORS.blue, fillColor: GIS_COLORS.blue, fillOpacity: 0.8, weight: 1,
          })
          m.bindPopup(popupHtml(p))
          m.on('click', () => setSelectedPointId(p.id))
          clusterRef.current?.addLayer(m)
        }
      } else {
        for (const g of groups) {
          const m = L.circleMarker(g.center, {
            radius: Math.min(8 + g.count, 28), color: g.color, fillColor: g.color, fillOpacity: 0.75, weight: 2,
          })
          m.bindPopup(`<b>Cluster ${g.id + 1}</b><br/>${g.count} kasus`)
          m.on('click', () => {
            const list = g.points.map((p) => `${p.nomorRegister} — ${p.jenisKekerasan}`).join('<br/>')
            m.bindPopup(`<b>Cluster ${g.id + 1}</b><br/>${g.count} kasus<br/><small>${list}</small>`).openPopup()
          })
          analysisRef.current?.addLayer(m)
        }
      }
    }

    const heatData: [number, number, number][] = points.map((p) => [p.lat, p.lng, 0.8])
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null }
    if (hotspotRef.current) { map.removeLayer(hotspotRef.current); hotspotRef.current = null }

    if (layers.heatmap && heatData.length) {
      heatRef.current = L.heatLayer(heatData, {
        radius: 40, blur: 25, minOpacity: 0.5, gradient: { 0.2: GIS_COLORS.blue, 0.5: GIS_COLORS.green, 1: GIS_COLORS.red },
      })
      map.addLayer(heatRef.current)
    }

    if (layers.hotspot && heatData.length) {
      hotspotRef.current = L.heatLayer(
        heatData.map(([lat, lng]) => [lat, lng, hotspot.intensity]),
        { radius: hotspot.radius, blur: hotspot.radius * 0.6, minOpacity: hotspot.opacity, gradient: HOTSPOT_GRADIENT },
      )
      map.addLayer(hotspotRef.current)
    }

    if (boundaryRef.current) { map.removeLayer(boundaryRef.current); boundaryRef.current = null }

    const geo = layers.provinsi ? provBoundaries : layers.kabupaten || layers.choropleth ? kabBoundaries : null
    if (geo && (layers.provinsi || layers.kabupaten || layers.choropleth)) {
      const stats = data.kabupatenStats ?? []
      const maxStat = stats[0]?.count ?? 1
      boundaryRef.current = L.geoJSON(geo, {
        style: (feat) => {
          const name = feat?.properties?.name as string
          const stat = stats.find((s) => s.name.includes(name) || name.includes(s.name))
          let val = stat?.count ?? 0
          if (choroplethMetric === 'aktif') val = stat?.aktif ?? 0
          if (choroplethMetric === 'completion') val = stat ? Math.round((stat.selesai / stat.count) * 100) : 0
          const max = choroplethMetric === 'completion' ? 100 : maxStat
          return {
            fillColor: choroplethColor(val, max),
            fillOpacity: layers.choropleth ? 0.65 : 0.2,
            color: '#374151',
            weight: 1,
          }
        },
        onEachFeature: (feat, layer) => {
          const name = feat.properties?.name
          layer.bindPopup(`<b>${name}</b>`)
        },
      }).addTo(map)
    }

    if (layers.markers && markerRef.current && !map.hasLayer(markerRef.current)) map.addLayer(markerRef.current)
    if (layers.cluster && clusterRef.current && clusterMethod === 'marker' && !map.hasLayer(clusterRef.current)) {
      map.addLayer(clusterRef.current)
    }
    if (analysisRef.current && groups.length && clusterMethod !== 'marker' && !map.hasLayer(analysisRef.current)) {
      map.addLayer(analysisRef.current)
    }

    if (points.length) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
    }
  }, [
    data, layers, clusterMethod, clusterCount, hotspot, choroplethMetric,
    kabBoundaries, provBoundaries, setClusterGroups, setSelectedPointId,
  ])

  useEffect(() => {
    const map = mapInst.current
    if (!map) return
    if (layers.osm && osmRef.current && !map.hasLayer(osmRef.current)) map.addLayer(osmRef.current)
    if (!layers.osm && osmRef.current && map.hasLayer(osmRef.current)) map.removeLayer(osmRef.current)
    if (layers.satellite && satRef.current && !map.hasLayer(satRef.current)) map.addLayer(satRef.current)
    if (!layers.satellite && satRef.current && map.hasLayer(satRef.current)) map.removeLayer(satRef.current)
  }, [layers.osm, layers.satellite])

  useEffect(() => {
    const map = mapInst.current
    if (!map) return

    const onClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng

      if (activeTool === 'geocode' || layers.osm) {
        const addr = await geocodeReverse(lat, lng)
        setReverseAddress(addr)
      }

      if (activeTool === 'radius' && data?.points) {
        const cases = pointsInRadius(data.points, [lat, lng], radiusM)
        const agg = aggregateCases(cases)
        setRadiusResult({ center: [lat, lng], radiusM, count: cases.length, cases, ...agg })

        const circle = L.circle([lat, lng], { radius: radiusM, color: GIS_COLORS.blue, fillOpacity: 0.1 })
        analysisRef.current?.addLayer(circle)
        map.addLayer(analysisRef.current!)
      }
    }

    map.on('click', onClick)
    return () => { map.off('click', onClick) }
  }, [activeTool, data?.points, radiusM, layers.osm, setRadiusResult, setReverseAddress])

  useEffect(() => {
    const map = mapInst.current
    if (!map || !bufferService || !layers.buffer || !data?.points) return

    const circle = turf.circle([bufferService.lng, bufferService.lat], bufferKm, { units: 'kilometers', steps: 64 })
    const poly = L.geoJSON(circle, { style: { color: GIS_COLORS.orange, fillOpacity: 0.15 } })
    analysisRef.current?.addLayer(poly)

    const cases = data.points.filter((p) =>
      turf.booleanPointInPolygon(turf.point([p.lng, p.lat]), circle),
    )
    poly.bindPopup(`<b>${bufferService.name}</b><br/>Buffer ${bufferKm} km<br/>${cases.length} kasus`)
    map.addLayer(analysisRef.current!)
  }, [bufferService, bufferKm, layers.buffer, data?.points])

  useEffect(() => {
    const map = mapInst.current
    const ctrl = drawControlRef.current
    if (!map || !ctrl) return
    if (activeTool === 'polygon') map.addControl(ctrl)
    else map.removeControl(ctrl)
  }, [activeTool])

  useEffect(() => {
    if (!services || !analysisRef.current) return
    for (const s of services) {
      const m = L.circleMarker([s.lat, s.lng], {
        radius: 4, color: GIS_COLORS.green, fillColor: GIS_COLORS.green, fillOpacity: 0.7,
      })
      m.bindPopup(`<b>${s.name}</b><br/>${s.category}`)
      analysisRef.current.addLayer(m)
    }
  }, [services])

  return (
    <div className="relative h-full w-full">
      <div ref={mapEl} className="absolute inset-0 z-0" />
      {isLoading && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center bg-background/50 text-sm">
          Memuat peta...
        </div>
      )}
    </div>
  )
})
