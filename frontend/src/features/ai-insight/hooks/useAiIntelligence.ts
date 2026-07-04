import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import type { AiIntelligenceResponse } from '@/features/ai-insight/types/ai-insight'

export function useAiIntelligence() {
  const { filters } = useApp()
  const { user } = useAuth()
  const params = { ...filtersToParams(filters), role: user?.role ?? 'direktur' }

  return useQuery<AiIntelligenceResponse>({
    queryKey: ['ai-intelligence', params],
    queryFn: async () => (await api.get('/api/ai/intelligence', { params })).data,
  })
}
