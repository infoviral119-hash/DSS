import { lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { BdrcLayout } from './components/BdrcLayout'

const BackupDashboardPage = lazy(() => import('./pages/BackupDashboardPage').then((m) => ({ default: m.BackupDashboardPage })))
const BackupJobsPage = lazy(() => import('./pages/BackupJobsPage').then((m) => ({ default: m.BackupJobsPage })))
const BackupRepositoryPage = lazy(() => import('./pages/BackupRepositoryPage').then((m) => ({ default: m.BackupRepositoryPage })))
const RecoveryPointsPage = lazy(() => import('./pages/RecoveryPointsPage').then((m) => ({ default: m.RecoveryPointsPage })))
const RestoreCenterPage = lazy(() => import('./pages/RestoreCenterPage').then((m) => ({ default: m.RestoreCenterPage })))
const BackupHistoryPage = lazy(() => import('./pages/BackupHistoryPage').then((m) => ({ default: m.BackupHistoryPage })))
const RestoreHistoryPage = lazy(() => import('./pages/RestoreHistoryPage').then((m) => ({ default: m.RestoreHistoryPage })))

export function backupRecoveryRoutes() {
  return (
    <>
      <Route path="backup" element={<Navigate to="/admin/backup-recovery" replace />} />
      <Route path="backup-recovery" element={<BdrcLayout />}>
        <Route index element={<BackupDashboardPage />} />
        <Route path="jobs" element={<BackupJobsPage />} />
        <Route path="repository" element={<BackupRepositoryPage />} />
        <Route path="recovery-points" element={<RecoveryPointsPage />} />
        <Route path="restore" element={<RestoreCenterPage />} />
        <Route path="history" element={<BackupHistoryPage />} />
        <Route path="restore-history" element={<RestoreHistoryPage />} />
      </Route>
    </>
  )
}
