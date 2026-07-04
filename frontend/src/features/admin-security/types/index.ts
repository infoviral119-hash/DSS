export interface SecurityDashboard {
  totalUsers: number
  onlineUsers: number
  offlineUsers: number
  lockedAccounts: number
  failedLogin: number
  mfaEnabled: number
  expiredPassword: number
  activeSessions: number
  apiCalls: number
  securityScore: number
  backupStatus: string
  systemHealth: string
}

export interface SecurityUser {
  id: string
  email: string
  fullName: string
  username: string
  employeeId?: string
  role: string
  status: string
  mfaEnabled: boolean
  avatarUrl?: string
  scopeRegion?: string
  dataScope?: string
  createdAt?: string
  updatedAt?: string
}

export interface SecurityRole {
  slug: string
  name: string
  description: string
  isSystem: boolean
}

export interface PermissionRow {
  code: string
  module: string
  action: string
  granted?: boolean
}

export interface LoginEvent {
  id: string
  userId?: string
  email?: string
  eventType: string
  success: boolean
  ipAddress?: string
  browser?: string
  device?: string
  os?: string
  location?: string
  createdAt: string
}

export interface SessionRow {
  id: string
  userId: string
  device?: string
  browser?: string
  os?: string
  ipAddress?: string
  location?: string
  loginAt: string
  lastActiveAt: string
  status: string
}

export interface AuditRow {
  id: string
  userId?: string
  action: string
  entityType: string
  entityId?: string
  oldValue?: unknown
  newValue?: unknown
  ip?: string
  browser?: string
  device?: string
  createdAt: string
}
