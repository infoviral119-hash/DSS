import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import { useApp } from '@/contexts/AppContext'
import type { ForecastIntelligenceResponse } from '@/features/forecast/types/forecast'

export interface ForecastParams {
  model: string
  horizon: number
  confidence: number
  dimension: string
  dimensionValue?: string
}

export function useForecastIntelligence(params: ForecastParams) {
  const { filters } = useApp()
  const base = filtersToParams(filters)

  return useQuery<ForecastIntelligenceResponse & { regional?: { name: string; growthPct: number }[]; insufficient?: boolean; message?: string }>({
    queryKey: ['forecast-intelligence', base, params],
    queryFn: async () => (await api.get('/api/forecast/intelligence', {
      params: { ...base, ...params },
    })).data,
    staleTime: 60_000,
  })
}
