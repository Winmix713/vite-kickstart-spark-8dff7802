import React from 'react';
import { cn } from '@/lib/utils';
interface LayoutGridProps {
  children: React.ReactNode;
  variant?: 'full' | '3-6-3' | 'sidebar';
  className?: string;
}

/**
 * WinmixPro responsive grid layout
 * - Mobile (< md): 1 column
 * - Tablet (md): 12 columns
 * - Desktop (lg): Full 12-column layout with 3-6-3 support
 */
export const LayoutGrid: React.FC<LayoutGridProps> = ({
  children,
  variant = 'full',
  className
}) => {
  const gridVariants = {
    full: 'grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8',
    '3-6-3': 'grid-cols-1 md:grid-cols-12 gap-6',
    sidebar: 'grid-cols-1 lg:grid-cols-12 gap-6'
  };
  return <div className={cn('grid', gridVariants[variant], className)}>
      {children}
    </div>;
};
export default LayoutGrid;