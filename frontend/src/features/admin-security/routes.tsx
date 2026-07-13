import { lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout'
import { AdminRoute } from './components/AdminRoute'
import { backupRecoveryRoutes } from '@/features/backup-recovery/routes'

const SecurityDashboardPage = lazy(() => import('./pages/SecurityDashboardPage').then((m) => ({ default: m.SecurityDashboardPage })))
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })))
const RolesPage = lazy(() => import('./pages/RolesPage').then((m) => ({ default: m.RolesPage })))
const PermissionsPage = lazy(() => import('./pages/RolesPage').then((m) => ({ default: m.PermissionsPage })))
const SessionsPage = lazy(() => import('./pages/SessionsPage').then((m) => ({ default: m.SessionsPage })))
const LoginHistoryPage = lazy(() => import('./pages/SessionsPage').then((m) => ({ default: m.LoginHistoryPage })))
const AuditTrailPage = lazy(() => import('./pages/AuditPage').then((m) => ({ default: m.AuditTrailPage })))
const SecurityCenterPage = lazy(() => import('./pages/AuditPage').then((m) => ({ default: m.SecurityCenterPage })))
const AuditReportPage = lazy(() => import('./pages/AuditPage').then((m) => ({ default: m.AuditReportPage })))
const OrganizationsPage = lazy(() => import('./pages/IdentityPages').then((m) => ({ default: m.OrganizationsPage })))
const DepartmentsPage = lazy(() => import('./pages/IdentityPages').then((m) => ({ default: m.DepartmentsPage })))
const UserGroupsPage = lazy(() => import('./pages/IdentityPages').then((m) => ({ default: m.UserGroupsPage })))
const PasswordPolicyPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.PasswordPolicyPage })))
const MfaPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.MfaPage })))
const TrustedDevicesPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.TrustedDevicesPage })))
const SystemHealthPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.SystemHealthPage })))
const ApiManagementPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.ApiManagementPage })))
const ConfigPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.ConfigPage })))
const DataRetentionPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.DataRetentionPage })))
const ConsentPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.ConsentPage })))
const PrivacyPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.PrivacyPage })))
const SchedulerPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.SchedulerPage })))
const NotificationsPage = lazy(() => import('./pages/SystemPages').then((m) => ({ default: m.NotificationsPage })))
const HelpCmsPage = lazy(() => import('@/features/help-center/admin/HelpCmsPage').then((m) => ({ default: m.HelpCmsPage })))

export function AdminFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
      Memuat modul keamanan...
    </div>
  )
}

export function adminSecurityRoutes() {
  return (
    <Route
      path="admin"
      element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }
    >
      <Route index element={<SecurityDashboardPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="roles" element={<RolesPage />} />
      <Route path="permissions" element={<PermissionsPage />} />
      <Route path="organizations" element={<OrganizationsPage />} />
      <Route path="departments" element={<DepartmentsPage />} />
      <Route path="user-groups" element={<UserGroupsPage />} />
      <Route path="sessions" element={<SessionsPage />} />
      <Route path="login-history" element={<LoginHistoryPage />} />
      <Route path="audit" element={<AuditTrailPage />} />
      <Route path="security-center" element={<SecurityCenterPage />} />
      <Route path="mfa" element={<MfaPage />} />
      <Route path="password-policy" element={<PasswordPolicyPage />} />
      <Route path="trusted-devices" element={<TrustedDevicesPage />} />
      <Route path="master-data" element={<Navigate to="/master-data" replace />} />
      <Route path="api" element={<ApiManagementPage />} />
      <Route path="scheduler" element={<SchedulerPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      {backupRecoveryRoutes()}
      <Route path="system-health" element={<SystemHealthPage />} />
      <Route path="config" element={<ConfigPage />} />
      <Route path="help-cms" element={<HelpCmsPage />} />
      <Route path="data-retention" element={<DataRetentionPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="consent" element={<ConsentPage />} />
      <Route path="audit-report" element={<AuditReportPage />} />
    </Route>
  )
}
