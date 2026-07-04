import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import { useApp } from '@/contexts/AppContext'
import type { GisMapData, PublicService } from '@/features/gis/types/gis'
import type { FeatureCollection } from 'geojson'

export function useGisMapData() {
  const { filters } = useApp()
  const params = filtersToParams(filters)

  return useQuery<GisMapData>({
    queryKey: ['gis-map', params],
    queryFn: async () => (await api.get('/api/gis/map', { params })).data,
  })
}

export function useGisInsights() {
  const { filters } = useApp()
  const params = filtersToParams(filters)

  return useQuery<{ insights: string[] }>({
    queryKey: ['gis-insights', params],
    queryFn: async () => (await api.get('/api/gis/insights', { params })).data,
  })
}

export function useGisStats() {
  const { filters } = useApp()
  const params = filtersToParams(filters)

  return useQuery({
    queryKey: ['gis-stats', params],
    queryFn: async () => (await api.get('/api/gis/stats', { params })).data,
  })
}

export function useGisServices() {
  return useQuery<PublicService[]>({
    queryKey: ['gis-services'],
    queryFn: async () => (await api.get('/api/gis/services')).data,
  })
}

export function useGisBoundaries(level: 'provinsi' | 'kabupaten' | 'kecamatan', enabled: boolean) {
  return useQuery<FeatureCollection>({
    queryKey: ['gis-boundaries', level],
    queryFn: async () => (await api.get(`/api/gis/boundaries/${level}`)).data,
    enabled,
    staleTime: Infinity,
  })
}

export async function geocodeForward(query: string): Promise<[number, number] | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=id`
  const res = await fetch(url, { headers: { 'Accept-Language': 'id' } })
  const data = await res.json()
  if (!data?.[0]) return null
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
}

export async function geocodeReverse(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  const res = await fetch(url, { headers: { 'Accept-Language': 'id' } })
  const data = await res.json()
  return data?.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}
