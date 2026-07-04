import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import type { GlobalFilters } from '@/types'

const base = '/api/cases/management'

function buildParams(filters: GlobalFilters, extra: Record<string, string> = {}) {
  return { ...filtersToParams(filters), ...extra }
}

export function useCaseKpis(filters: GlobalFilters, extra: Record<string, string> = {}) {
  const params = buildParams(filters, extra)
  return useQuery({
    queryKey: ['cases', 'kpis', params],
    queryFn: async () => (await api.get(`${base}/kpis`, { params })).data,
    refetchInterval: 60000,
  })
}

export function useCaseList(filters: GlobalFilters, extra: Record<string, string> = {}) {
  const params = buildParams(filters, extra)
  return useQuery({
    queryKey: ['cases', 'list', params],
    queryFn: async () => (await api.get(`${base}/list`, { params })).data,
  })
}

export function useCaseDetail(id: string | null) {
  return useQuery({
    queryKey: ['cases', 'detail', id],
    queryFn: async () => (await api.get(`${base}/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useCaseQuality(filters: GlobalFilters, extra: Record<string, string> = {}) {
  const params = buildParams(filters, extra)
  return useQuery({
    queryKey: ['cases', 'quality', params],
    queryFn: async () => (await api.get(`${base}/quality`, { params })).data,
  })
}

export function useCaseAnalytics(filters: GlobalFilters, extra: Record<string, string> = {}) {
  const params = buildParams(filters, extra)
  return useQuery({
    queryKey: ['cases', 'analytics', params],
    queryFn: async () => (await api.get(`${base}/analytics`, { params })).data,
  })
}

export function useSavedFilters() {
  return useQuery({
    queryKey: ['cases', 'saved-filters'],
    queryFn: async () => (await api.get(`${base}/saved-filters`)).data,
  })
}

export function useSaveFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; filters: Record<string, unknown> }) =>
      (await api.post(`${base}/saved-filters`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', 'saved-filters'] }),
  })
}

export function useCasePreferences() {
  return useQuery({
    queryKey: ['cases', 'preferences'],
    queryFn: async () => (await api.get(`${base}/preferences`)).data,
  })
}

export function useSavePreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { visibleColumns: string[]; columnOrder: string[] }) =>
      (await api.post(`${base}/preferences`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', 'preferences'] }),
  })
}

export function useExportCases() {
  return useMutation({
    mutationFn: async ({ query, body }: { query: Record<string, string>; body: Record<string, unknown> }) =>
      (await api.post(`${base}/export`, body, { params: query })).data,
  })
}

export function useBulkCaseAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { action: string; ids: string[] }) =>
      (await api.post(`${base}/bulk`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  })
}
