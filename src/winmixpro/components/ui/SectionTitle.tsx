import React from 'react';
import { cn } from '@/lib/utils';
interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Premium section title component
 * Gradient text with optional subtitle and icon
 */
export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  icon,
  className,
  align = 'left'
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  return <div className={cn('mb-6', alignClasses[align])}>
      <div className="flex items-center gap-3 mb-2" style={{
      justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
    }}>
        {icon && <span className="flex-shrink-0 text-emerald-400">{icon}</span>}
        <h2 className={cn('text-2xl md:text-3xl lg:text-4xl font-bold', 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-violet-400 bg-clip-text text-transparent')}>
          {title}
        </h2>
      </div>
      {subtitle && <p className="text-white/60 text-sm md:text-base mt-2 max-w-2xl">
          {subtitle}
        </p>}
    </div>;
};
export default SectionTitle;