import React from 'react';
import { cn } from '@/lib/utils';
import GlassCard from './GlassCard';
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
}

/**
 * Premium stat card component
 * Displays key metrics with optional trend indicator
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  className
}) => {
  return <GlassCard className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-sm mb-1">{title}</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl md:text-4xl font-bold text-white">{value}</p>
            {change && <span className={cn('text-sm font-medium mb-1', change.direction === 'up' ? 'text-emerald-400' : 'text-red-400')}>
                {change.direction === 'up' ? '+' : '-'}
                {Math.abs(change.value)}%
              </span>}
          </div>
        </div>
        {icon && <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-violet-500/20 flex items-center justify-center text-emerald-400">
            {icon}
          </div>}
      </div>
    </GlassCard>;
};
export default StatCard;