import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const base = '/api/security'

export function useSecurityDashboard() {
  return useQuery({
    queryKey: ['security', 'dashboard'],
    queryFn: async () => (await api.get(`${base}/dashboard`)).data,
    refetchInterval: 30000,
  })
}

export function useSecurityUsers() {
  return useQuery({
    queryKey: ['security', 'users'],
    queryFn: async () => (await api.get(`${base}/users`)).data,
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      (await api.patch(`${base}/users/${id}`, patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security', 'users'] }),
  })
}

export function useSecurityRoles() {
  return useQuery({
    queryKey: ['security', 'roles'],
    queryFn: async () => (await api.get(`${base}/roles`)).data,
  })
}

export function useRolePermissions(slug: string) {
  return useQuery({
    queryKey: ['security', 'roles', slug, 'permissions'],
    queryFn: async () => (await api.get(`${base}/roles/${slug}/permissions`)).data,
    enabled: !!slug,
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: ['security', 'permissions'],
    queryFn: async () => (await api.get(`${base}/permissions`)).data,
  })
}

export function useLoginHistory() {
  return useQuery({
    queryKey: ['security', 'login-history'],
    queryFn: async () => (await api.get(`${base}/login-history`)).data,
  })
}

export function useSessions() {
  return useQuery({
    queryKey: ['security', 'sessions'],
    queryFn: async () => (await api.get(`${base}/sessions`)).data,
  })
}

export function useTerminateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`${base}/sessions/${id}/terminate`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security', 'sessions'] }),
  })
}

export function usePasswordPolicy() {
  return useQuery({
    queryKey: ['security', 'password-policy'],
    queryFn: async () => (await api.get(`${base}/password-policy`)).data,
  })
}

export function useUpdatePasswordPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) =>
      (await api.patch(`${base}/password-policy`, patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security', 'password-policy'] }),
  })
}

export function useSecurityCenter() {
  return useQuery({
    queryKey: ['security', 'center'],
    queryFn: async () => (await api.get(`${base}/center`)).data,
  })
}

export function useAuditTrail() {
  return useQuery({
    queryKey: ['security', 'audit'],
    queryFn: async () => (await api.get(`${base}/audit`)).data,
  })
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['security', 'organizations'],
    queryFn: async () => (await api.get(`${base}/organizations`)).data,
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['security', 'departments'],
    queryFn: async () => (await api.get(`${base}/departments`)).data,
  })
}

export function useUserGroups() {
  return useQuery({
    queryKey: ['security', 'user-groups'],
    queryFn: async () => (await api.get(`${base}/user-groups`)).data,
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['security', 'system-health'],
    queryFn: async () => (await api.get(`${base}/system-health`)).data,
    refetchInterval: 15000,
  })
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['security', 'api-keys'],
    queryFn: async () => (await api.get(`${base}/api-keys`)).data,
  })
}

export function useBackups() {
  return useQuery({
    queryKey: ['security', 'backups'],
    queryFn: async () => (await api.get(`${base}/backups`)).data,
  })
}

export function useDataRetention() {
  return useQuery({
    queryKey: ['security', 'data-retention'],
    queryFn: async () => (await api.get(`${base}/data-retention`)).data,
  })
}

export function useSystemConfig() {
  return useQuery({
    queryKey: ['security', 'config'],
    queryFn: async () => (await api.get(`${base}/config`)).data,
  })
}

export function useMfaStatus() {
  return useQuery({
    queryKey: ['security', 'mfa'],
    queryFn: async () => (await api.get(`${base}/mfa/status`)).data,
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; rateLimit?: number }) =>
      (await api.post(`${base}/api-keys`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security', 'api-keys'] }),
  })
}

export function useRevokeApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`${base}/api-keys/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security', 'api-keys'] }),
  })
}

export function useMfaSetup() {
  return useMutation({
    mutationFn: async () => (await api.post(`${base}/mfa/setup-authenticator`)).data,
  })
}

export function useMfaVerify() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (token: string) => (await api.post(`${base}/mfa/verify-authenticator`, { token })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security', 'mfa'] }),
  })
}

export function useRevealField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ caseId, field }: { caseId: string; field: string }) => {
      await api.post('/api/cases/reveal-field', { caseId, field })
      await api.post(`${base}/pii/reveal`, { caseId, field })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases-list'] }),
  })
}

export function useSchedulerJobs() {
  return useQuery({
    queryKey: ['security', 'scheduler'],
    queryFn: async () => (await api.get(`${base}/scheduler/jobs`)).data,
  })
}

export function useToggleSchedulerJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) =>
      (await api.patch(`${base}/scheduler/jobs/${id}`, { enabled })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security', 'scheduler'] }),
  })
}

export function useTrustedDevices() {
  return useQuery({
    queryKey: ['security', 'trusted-devices'],
    queryFn: async () => (await api.get(`${base}/trusted-devices`)).data,
  })
}

export function useRemoveTrustedDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`${base}/trusted-devices/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security', 'trusted-devices'] }),
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get(`${base}/notifications`)).data,
  })
}

export function useSendEmailOtp() {
  return useMutation({
    mutationFn: async () => (await api.post(`${base}/mfa/send-email-otp`)).data,
  })
}

export function useVerifyEmailOtp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => (await api.post(`${base}/mfa/verify-email-otp`, { code })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security', 'mfa'] }),
  })
}
