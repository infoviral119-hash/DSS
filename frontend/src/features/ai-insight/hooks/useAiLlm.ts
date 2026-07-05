import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import type { LlmNarrativeResult } from '@/features/ai-insight/types/ai-insight'

function useAiParams() {
  const { filters } = useApp()
  const { user } = useAuth()
  return { ...filtersToParams(filters), role: user?.role ?? 'direktur' }
}

export function useAiLlmNarrative(enabled = true) {
  const params = useAiParams()
  return useQuery<LlmNarrativeResult>({
    queryKey: ['ai-llm-narrative', params],
    queryFn: async () => (await api.get('/api/ai/llm-narrative', { params })).data,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useAiLlmStatus(enabled = true) {
  const { user } = useAuth()
  return useQuery<{ enabled: boolean; provider: string; model: string }>({
    queryKey: ['ai-llm-status'],
    queryFn: async () => (await api.get('/api/ai/llm-status')).data,
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
    retry: 2,
  })
}

export function useAiChat() {
  const params = useAiParams()
  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.post('/api/ai/chat', { message }, { params })
      return data as { reply: string; error?: string }
    },
  })
}
