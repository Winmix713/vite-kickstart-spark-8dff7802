import React, { Suspense, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/navigation/Sidebar';
import PageLoading from '@/components/ui/PageLoading';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AppLayoutProps {
  children?: ReactNode;
  /** When true, uses Outlet for nested routes, otherwise renders children */
  useOutlet?: boolean;
  /** Additional CSS classes for the main content area */
  className?: string;
  /** Whether to show the sidebar (default: true) */
  showSidebar?: boolean;
  /** Whether to show error boundary (default: true) */
  withErrorBoundary?: boolean;
  /** Custom loading fallback */
  loadingFallback?: ReactNode;
  /** Custom error fallback */
  errorFallback?: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  useOutlet = true,
  className,
  showSidebar = true,
  withErrorBoundary = true,
  loadingFallback,
  errorFallback
}) => {
  const content = useOutlet ? <Outlet /> : children;

  const wrappedContent = (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      {showSidebar && <Sidebar />}

      {/* Main Content */}
      <main 
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out',
          showSidebar && 'lg:ml-16', // Adjust based on sidebar width
          className
        )}
      >
        <Suspense fallback={loadingFallback || <PageLoading message="Loading content..." />}>
          {content}
        </Suspense>
      </main>
    </div>
  );

  if (withErrorBoundary) {
    return <ErrorBoundary fallback={errorFallback}>{wrappedContent}</ErrorBoundary>;
  }

  return wrappedContent;
};

export default AppLayout;