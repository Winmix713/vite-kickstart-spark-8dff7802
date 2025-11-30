import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from './components/layout';
interface WinmixProAppProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

/**
 * WinmixProApp wrapper component
 * Provides premium design system layout for all WinmixPro pages
 * Wraps content in AdminLayout with header, sidebar, and responsive mobile drawer
 */
export const WinmixProApp: React.FC<WinmixProAppProps> = ({
  children,
  onLogout
}) => {
  const {
    profile
  } = useAuth();
  return <AdminLayout userEmail={profile?.email} onLogout={onLogout}>
      {children}
    </AdminLayout>;
};
export default WinmixProApp;