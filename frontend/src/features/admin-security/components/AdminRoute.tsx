import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const ADMIN_ROLES = ['admin', 'auditor', 'super_admin', 'system_admin']

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Memuat...
      </div>
    )
  }

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
