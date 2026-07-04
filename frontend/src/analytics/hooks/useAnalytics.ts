import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useApp } from '@/contexts/AppContext'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import type { AnalyticsChartKey } from '@/analytics/types/analytics'

export function useAnalyticsQuery<T>(key: AnalyticsChartKey) {
  const { filters } = useApp()
  const params = useMemo(() => filtersToParams(filters), [filters])

  return useQuery({
    queryKey: ['analytics', key, params],
    queryFn: async () => (await api.get<T>(`/api/analytics/${key}`, { params })).data,
  })
}
