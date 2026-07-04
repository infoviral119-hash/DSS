import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type PowerBiStatus = {
  configured: boolean
  mode: 'iframe' | 'link' | 'embed' | 'none'
  shareUrl: string | null
  reportId: string | null
  workspaceId: string | null
}

export type PowerBiEmbed =
  | { mode: 'iframe'; embedUrl: string }
  | { mode: 'link'; shareUrl: string }
  | { mode: 'embed'; reportId: string; embedUrl: string; accessToken: string; expiration: string }
  | { mode: 'none'; message: string; setup: string[] }

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
