import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { cn } from '@/lib/utils';
interface ToastPortalProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
  /** Maximum number of toasts to show */
  maxToasts?: number;
  /** Whether to show rich colors */
  richColors?: boolean;
  /** Whether to expand toasts on hover */
  expand?: boolean;
}
const ToastPortal: React.FC<ToastPortalProps> = ({
  position = 'top-right',
  className,
  maxToasts = 3,
  richColors = true,
  expand = false
}) => {
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-center': 'top-0 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2'
  };
  return <div className={cn("fixed z-50 p-4 pointer-events-none", positionClasses[position], className)}>
      <SonnerToaster position={position} maxToasts={maxToasts} richColors={richColors} expand={expand} toastOptions={{
      className: 'pointer-events-auto',
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'calc(var(--radius) - 2px)'
      } as React.CSSProperties
    }} theme="system" closeButton duration={4000} />
    </div>;
};
export default ToastPortal;