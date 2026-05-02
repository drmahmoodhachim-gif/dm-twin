import { Navigate } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { useAuth } from '../context/AuthContext'
import type { AppRole } from '../types'

const DEFAULT_ROUTE_BY_ROLE: Record<AppRole, string> = {
  researcher: '/research',
  clinician: '/clinic',
  patient: '/me',
  admin: '/research',
}

export function ProtectedRoute({ roles, children }: PropsWithChildren<{ roles: AppRole[] }>) {
  const { session, role, loading } = useAuth()

  if (loading) {
    return <div className="card">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  if (!roles.includes(role)) {
    return <Navigate to={DEFAULT_ROUTE_BY_ROLE[role]} replace />
  }

  return <>{children}</>
}
