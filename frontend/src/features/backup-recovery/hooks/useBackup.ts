import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const base = '/api/backup'

export function useBackupDashboard() {
  return useQuery({
    queryKey: ['backup', 'dashboard'],
    queryFn: async () => (await api.get(`${base}/dashboard`)).data,
    refetchInterval: 30000,
  })
}

export function useBackupJobs() {
  return useQuery({
    queryKey: ['backup', 'jobs'],
    queryFn: async () => (await api.get(`${base}/jobs`)).data,
  })
}

export function useJobDetail(id: string | null) {
  return useQuery({
    queryKey: ['backup', 'job', id],
    queryFn: async () => (await api.get(`${base}/jobs/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useBackupMeta() {
  return useQuery({
    queryKey: ['backup', 'meta'],
    queryFn: async () => (await api.get(`${base}/meta`)).data,
  })
}

export function useRecoveryPoints() {
  return useQuery({
    queryKey: ['backup', 'recovery'],
    queryFn: async () => (await api.get(`${base}/recovery`)).data,
  })
}

export function useRecoveryPointDetail(id: string | null) {
  return useQuery({
    queryKey: ['backup', 'recovery', id],
    queryFn: async () => (await api.get(`${base}/recovery/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useBackupHistory() {
  return useQuery({
    queryKey: ['backup', 'history'],
    queryFn: async () => (await api.get(`${base}/history`)).data,
  })
}

export function useRestoreHistory() {
  return useQuery({
    queryKey: ['backup', 'restore-history'],
    queryFn: async () => (await api.get(`${base}/restore-history`)).data,
  })
}

export function useBackupRepositories() {
  return useQuery({
    queryKey: ['backup', 'repository'],
    queryFn: async () => (await api.get(`${base}/repository`)).data,
  })
}

export function useRepositoryDetail(id: string | null) {
  return useQuery({
    queryKey: ['backup', 'repository', id],
    queryFn: async () => (await api.get(`${base}/repository/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useBackupStorage() {
  return useQuery({
    queryKey: ['backup', 'storage'],
    queryFn: async () => (await api.get(`${base}/storage`)).data,
  })
}

export function useCreateBackupJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => (await api.post(`${base}/jobs`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup'] }),
  })
}

export function useRunBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => (await api.post(`${base}/run`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup'] }),
  })
}

export function useUpdateBackupJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; enabled?: boolean; name?: string; lastStatus?: string }) =>
      (await api.patch(`${base}/jobs/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup'] }),
  })
}

export function useDeleteBackupJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`${base}/jobs/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup'] }),
  })
}

export function useCloneBackupJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`${base}/jobs/${id}/clone`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup'] }),
  })
}

export function useRestorePreview() {
  return useMutation({
    mutationFn: async (body: { recoveryPointId: string; targets?: string[]; restoreType?: string }) =>
      (await api.post(`${base}/restore/preview`, body)).data,
  })
}

export function useRestoreBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { recoveryPointId: string; targets?: string[]; reason?: string; restoreType?: string }) =>
      (await api.post(`${base}/restore`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup'] }),
  })
}

export function useCreateRepository() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => (await api.post(`${base}/repository`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup'] }),
  })
}
