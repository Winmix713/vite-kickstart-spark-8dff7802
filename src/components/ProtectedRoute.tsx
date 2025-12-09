import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import LoadingScreen from '@components/LoadingScreen'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
