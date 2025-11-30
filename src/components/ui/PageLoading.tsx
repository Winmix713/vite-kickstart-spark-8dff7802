import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
interface PageLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSkeleton?: boolean;
}
const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Loading...',
  size = 'md',
  className,
  showSkeleton = true
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  return <div className={cn("flex flex-col items-center justify-center min-h-[200px] gap-4", className)}>
      {/* Loading spinner */}
      <div className="relative">
        <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size])} />
      </div>
      
      {/* Loading message */}
      {message && <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>}
      
      {/* Skeleton content */}
      {showSkeleton && <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>}
    </div>;
};
export default PageLoading;