export interface BackupKpis {
  backupStatus: string
  lastBackup: string
  nextBackup: string
  recoveryPoints: number
  repository: string
  storageUsedGb: string
  storageRemainingGb: string
  backupSuccess: number
  failedJobs: number
  runningJobs: number
  encryption: string
  compression: string
  healthScore: number
  healthLabel: string
}

export interface BackupDashboard {
  kpis: BackupKpis
  backupTrend: { date: string; success: number; failed: number; size: number }[]
  storageTrend: { date: string; usedGb: number }[]
  successRate: number
  repositoryUsage: { name: string; usedGb: number; capacityGb: number; status: string }[]
  typeDistribution: { type: string; count: number }[]
  recentRecoveryPoints: { id: string; name: string; createdAt: string; sizeMb: number; status: string }[]
}

export interface BackupJob {
  id: string
  name: string
  backupType: string
  targets: string[]
  repositoryId?: string
  repositoryName?: string
  compression: string
  encryptionEnabled: boolean
  enabled: boolean
  lastRunAt?: string
  lastStatus?: string
  status?: string
  schedule?: string
  duration?: string
}

export interface RecoveryPoint {
  id: string
  backupName: string
  backupTime: string
  repository: string
  checksum: string
  encryption: string
  backupSize: number
  dbVersion: string
  appVersion: string
  targets: string[]
  status: string
}

export interface BackupRepository {
  id: string
  name: string
  repoType: string
  capacityGb: number
  usedBytes: number
  usagePercent: number
  encryptionEnabled: boolean
  compressionLevel: string
  status: string
  latencyMs: number
  isDefault: boolean
}
