import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import LoadingScreen from '@components/LoadingScreen'

interface RoleGateProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'analyst' | 'user')[]
}

export function RoleGate({ children, allowedRoles = ['admin', 'analyst', 'user'] }: RoleGateProps) {
  const { profile, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default RoleGate
