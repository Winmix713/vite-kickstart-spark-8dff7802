import React from 'react';
import { cn } from '@/lib/utils';
interface MetricPillProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'emerald' | 'violet' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Metric pill component for displaying key stats
 * Premium glass aesthetic with color variants
 */
export const MetricPill: React.FC<MetricPillProps> = ({
  label,
  value,
  icon,
  variant = 'emerald',
  size = 'md',
  className
}) => {
  const variantClasses = {
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    violet: 'text-violet-400 border-violet-500/20 bg-violet-500/10',
    neutral: 'text-white/70 border-white/10 bg-white/5'
  };
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-3 text-base gap-2.5'
  };
  return <div className={cn('inline-flex items-center rounded-full border', 'font-medium transition-all duration-200', 'hover:border-white/20 hover:bg-white/10', variantClasses[variant], sizeClasses[size], className)}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex flex-col gap-0.5">
        <span className="text-white/60 text-xs">{label}</span>
        <span className="font-bold">{value}</span>
      </span>
    </div>;
};
export default MetricPill;