import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
interface FormShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show card wrapper (default: true) */
  withCard?: boolean;
  /** Footer content */
  footer?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** onSubmit handler for form submission */
  onSubmit?: (e: React.FormEvent) => void;
}
const FormShell: React.FC<FormShellProps> = ({
  children,
  title,
  description,
  actions,
  className,
  size = 'md',
  withCard = true,
  footer,
  loading = false,
  error,
  onSubmit
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };
  const content = <form onSubmit={onSubmit} className="space-y-6">
      {/* Header */}
      {(title || description || actions) && <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            {title && <h2 className="text-xl font-semibold tracking-tight">
                {title}
              </h2>}
            {description && <p className="text-sm text-muted-foreground">
                {description}
              </p>}
          </div>
          {actions && <div className="flex items-center gap-2">
              {actions}
            </div>}
        </div>}

      {/* Error display */}
      {error && <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>}

      {/* Form content */}
      <div className={cn("space-y-4", loading && "opacity-50 pointer-events-none")}>
        {children}
      </div>

      {/* Footer */}
      {footer && <div className="pt-4 border-t border-border">
          {footer}
        </div>}
    </form>;
  if (!withCard) {
    return <div className={cn("w-full mx-auto", sizeClasses[size], className)}>
        {content}
      </div>;
  }
  return <Card className={cn("w-full mx-auto", sizeClasses[size], className)}>
      <CardContent className="p-6">
        {content}
      </CardContent>
    </Card>;
};
export default FormShell;