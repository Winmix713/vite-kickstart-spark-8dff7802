import React from 'react';
import { cn } from '@/lib/utils';
interface GridCellProps {
  children: React.ReactNode;
  span?: 'left' | 'center' | 'right' | 'full' | 'half';
  className?: string;
}

/**
 * Grid cell component for responsive 3-6-3 layouts
 * Automatically handles mobile, tablet, and desktop breakpoints
 */
export const GridCell: React.FC<GridCellProps> = ({
  children,
  span = 'full',
  className
}) => {
  const spanClasses = {
    left: 'col-span-1 md:col-span-3',
    center: 'col-span-1 md:col-span-6',
    right: 'col-span-1 md:col-span-3',
    full: 'col-span-1 md:col-span-12',
    half: 'col-span-1 md:col-span-6'
  };
  return <div className={cn(spanClasses[span], className)}>
      {children}
    </div>;
};
export default GridCell;