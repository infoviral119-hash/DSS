import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { filtersToParams } from '@/lib/filters'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import type { ReportHistoryEntry, ReportIntelligence } from '@/features/reports/types/report'
import type { AuditEntry, ReportLayout, ReportSchedule, ReportVersion } from '@/features/reports/types/workflow'

export interface ReportParams {
  category?: string
  period?: string
  template?: string
  watermark?: string
  reportId?: string
}

export function useReportIntelligence(params: ReportParams) {
  const { filters } = useApp()
  const { user } = useAuth()
  const base = filtersToParams(filters)

  return useQuery<ReportIntelligence & { versionHistory?: ReportVersion[]; digitalSignature?: unknown; templateConfig?: unknown }>({
    queryKey: ['report-intelligence', base, params, user?.role],
    queryFn: async () => (await api.get('/api/reports/intelligence', {
      params: { ...base, ...params, role: user?.role ?? 'direktur', reportId: params.reportId ?? undefined },
    })).data,
    staleTime: 60_000,
  })
}

export function useReportHistory() {
  return useQuery<ReportHistoryEntry[]>({
    queryKey: ['report-history'],
    queryFn: async () => (await api.get('/api/reports/history')).data,
  })
}

export function useReportSchedules() {
  return useQuery<ReportSchedule[]>({
    queryKey: ['report-schedules'],
    queryFn: async () => (await api.get('/api/reports/schedules')).data,
  })
}

export function useReportLayouts() {
  return useQuery<ReportLayout[]>({
    queryKey: ['report-layouts'],
    queryFn: async () => (await api.get('/api/reports/layouts')).data,
  })
}

export function useReportAudit() {
  return useQuery<AuditEntry[]>({
    queryKey: ['report-audit'],
    queryFn: async () => (await api.get('/api/reports/audit')).data,
  })
}

export function useReportVersions(reportId?: string) {
  return useQuery<ReportVersion[]>({
    queryKey: ['report-versions', reportId],
    queryFn: async () => (await api.get(`/api/reports/versions/${reportId}`)).data,
    enabled: !!reportId,
  })
}

export function useReportMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['report-schedules'] })
    qc.invalidateQueries({ queryKey: ['report-layouts'] })
    qc.invalidateQueries({ queryKey: ['report-audit'] })
    qc.invalidateQueries({ queryKey: ['report-history'] })
    qc.invalidateQueries({ queryKey: ['report-versions'] })
    qc.invalidateQueries({ queryKey: ['report-intelligence'] })
  }

  const createSchedule = useMutation({
    mutationFn: async (body: Record<string, unknown>) => (await api.post('/api/reports/schedules', body)).data,
    onSuccess: invalidate,
  })

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/reports/schedules/${id}`)).data,
    onSuccess: invalidate,
  })

  const runSchedule = useMutation({
    mutationFn: async (id: string) => (await api.post(`/api/reports/schedules/${id}/run`)).data,
    onSuccess: invalidate,
  })

  const saveLayout = useMutation({
    mutationFn: async (body: { id?: string; name: string; widgets: string[] }) =>
      (await api.post('/api/reports/layouts', body)).data,
    onSuccess: invalidate,
  })

  const saveVersion = useMutation({
    mutationFn: async ({ reportId, snapshot, note }: { reportId: string; snapshot: unknown; note?: string }) =>
      (await api.post(`/api/reports/versions/${reportId}`, { snapshot, note })).data,
    onSuccess: invalidate,
  })

  const updateApproval = useMutation({
    mutationFn: async ({ reportId, action, note }: { reportId: string; action: string; note?: string }) =>
      (await api.post(`/api/reports/approval/${reportId}`, { action, note })).data,
    onSuccess: invalidate,
  })

  const createShare = useMutation({
    mutationFn: async (body: Record<string, unknown>) => (await api.post('/api/reports/share', body)).data,
    onSuccess: invalidate,
  })

  return { createSchedule, deleteSchedule, runSchedule, saveLayout, saveVersion, updateApproval, createShare }
}
