import React from 'react'
import { useAuth, UserRole } from '@contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface RoleGateProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const { role, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return <div className="p-6 text-center">Betöltés...</div>
  }

  if (!role || !allowedRoles.includes(role)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Nincs hozzáférés</h2>
        <p className="text-gray-400 mb-4">Nem rendelkezik a szükséges jogosultságokkal a lap megtekintéséhez.</p>
        <button
          onClick={() => navigate('/')}
          className="btn btn--primary"
        >
          Vissza az főoldalra
        </button>
      </div>
    )
  }

  return <>{children}</>
}

export default RoleGate
