import React from 'react';
import { cn } from '@/lib/utils';
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glow?: 'emerald' | 'violet' | 'none';
  onClick?: () => void;
}

/**
 * Premium glass-morphism card component
 * Supports interactive states and glow effects
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  interactive = false,
  glow = 'none',
  onClick
}) => {
  const glowClasses = {
    emerald: 'glow-emerald',
    violet: 'glow-violet',
    none: ''
  };
  return <div className={cn('glass-card', interactive && 'cursor-pointer hover:bg-white/10 hover:border-white/20', glow !== 'none' && glowClasses[glow], 'transition-all duration-200', className)} onClick={onClick}>
      {children}
    </div>;
};
export default GlassCard;