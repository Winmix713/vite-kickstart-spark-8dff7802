import { useContext } from 'react';
import { AuthContext, AuthContextType, UserRole } from '@/providers/AuthProvider';
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Convenience hooks for role-based access
export const useRequireAuth = () => {
  const {
    user,
    loading
  } = useAuth();
  if (loading) {
    return {
      loading: true,
      authenticated: false
    };
  }
  if (!user) {
    return {
      loading: false,
      authenticated: false
    };
  }
  return {
    loading: false,
    authenticated: true,
    user
  };
};
export const useRequireRole = (requiredRoles: UserRole[]) => {
  const {
    hasAnyRole,
    loading,
    profile
  } = useAuth();
  if (loading) {
    return {
      loading: true,
      authorized: false
    };
  }
  if (!profile) {
    return {
      loading: false,
      authorized: false,
      error: 'No user profile found'
    };
  }
  const authorized = hasAnyRole(requiredRoles);
  return {
    loading: false,
    authorized,
    error: authorized ? null : `Requires one of these roles: ${requiredRoles.join(', ')}`
  };
};
export const useRequireAdmin = () => {
  return useRequireRole(['admin']);
};
export const useRequireAnalystOrAdmin = () => {
  return useRequireRole(['admin', 'analyst']);
};