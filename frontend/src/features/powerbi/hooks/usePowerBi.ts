import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type PowerBiStatus = {
  configured: boolean
  provider: 'metabase' | 'powerbi' | 'none'
  mode: 'metabase' | 'iframe' | 'link' | 'embed' | 'none'
  shareUrl: string | null
  reportId: string | null
  workspaceId: string | null
}

export type PowerBiEmbed =
  | { mode: 'metabase'; embedUrl: string; provider: 'metabase' }
  | { mode: 'iframe'; embedUrl: string; provider?: 'powerbi' }
  | { mode: 'link'; shareUrl: string; provider?: 'metabase' | 'powerbi' }
  | { mode: 'embed'; reportId: string; embedUrl: string; accessToken: string; expiration: string; provider?: 'powerbi' }
  | { mode: 'none'; message: string; setup: string[]; provider?: 'none' }

export function usePowerBiStatus() {
  return useQuery<PowerBiStatus>({
    queryKey: ['powerbi-status'],
    queryFn: async () => (await api.get('/api/powerbi/status')).data,
    staleTime: 60_000,
  })
}

export function usePowerBiEmbed(enabled = true) {
  return useQuery<PowerBiEmbed>({
    queryKey: ['powerbi-embed'],
    queryFn: async () => (await api.get('/api/powerbi/embed')).data,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
