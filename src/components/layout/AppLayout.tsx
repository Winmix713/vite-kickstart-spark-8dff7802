import React, { Suspense, ReactNode, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/navigation/Sidebar';
import PageLoading from '@/components/ui/PageLoading';
import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * Props for the AppLayout component
 */
interface AppLayoutProps {
  /** Child components to render */
  children?: ReactNode;
  
  /** When true, uses React Router's Outlet for nested routes */
  useOutlet?: boolean;
  
  /** Additional CSS classes for the main content area */
  className?: string;
  
  /** Whether to display the sidebar navigation */
  showSidebar?: boolean;
  
  /** Wrap content in an error boundary for graceful error handling */
  withErrorBoundary?: boolean;
  
  /** Custom loading component shown during Suspense */
  loadingFallback?: ReactNode;
  
  /** Custom error component shown when errors occur */
  errorFallback?: ReactNode;
  
  /** Additional wrapper classes for the root container */
  containerClassName?: string;
  
  /** Sidebar width class (affects main content margin) */
  sidebarWidth?: string;
  
  /** Disable transitions for better performance on slower devices */
  disableTransitions?: boolean;
  
  /** Callback fired when layout mounts */
  onLayoutMount?: () => void;
}

/**
 * AppLayout Component
 * 
 * A robust, flexible layout component that provides:
 * - Responsive sidebar navigation
 * - Error boundary protection
 * - Suspense-based code splitting support
 * - Customizable loading states
 * - React Router integration
 * 
 * @example
 * ```tsx
 * <AppLayout showSidebar={true} useOutlet={true}>
 *   <YourContent />
 * </AppLayout>
 * ```
 */
const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  useOutlet = true,
  className,
  showSidebar = true,
  withErrorBoundary = true,
  loadingFallback,
  errorFallback,
  containerClassName,
  sidebarWidth = 'lg:ml-16',
  disableTransitions = false,
  onLayoutMount
}) => {
  // Fire mount callback once
  React.useEffect(() => {
    onLayoutMount?.();
  }, [onLayoutMount]);

  // Memoize content selection to prevent unnecessary re-renders
  const content = useMemo(
    () => (useOutlet ? <Outlet /> : children),
    [useOutlet, children]
  );

  // Memoize main content classes
  const mainClasses = useMemo(
    () =>
      cn(
        'flex-1 min-h-screen',
        !disableTransitions && 'transition-all duration-300 ease-in-out',
        showSidebar && sidebarWidth,
        className
      ),
    [showSidebar, sidebarWidth, className, disableTransitions]
  );

  // Memoize container classes
  const containerClasses = useMemo(
    () => cn('min-h-screen bg-background flex', containerClassName),
    [containerClassName]
  );

  // Render loading fallback
  const loadingComponent = useMemo(
    () => loadingFallback || <PageLoading message="Tartalom betöltése..." />,
    [loadingFallback]
  );

  // Main layout structure
  const layoutContent = (
    <div className={containerClasses}>
      {/* Sidebar Navigation */}
      {showSidebar && (
        <aside className="flex-shrink-0" aria-label="Oldalsó navigáció">
          <Sidebar />
        </aside>
      )}

      {/* Main Content Area */}
      <main 
        className={mainClasses}
        role="main"
        aria-label="Fő tartalom"
      >
        <Suspense fallback={loadingComponent}>
          {content}
        </Suspense>
      </main>
    </div>
  );

  // Conditionally wrap with ErrorBoundary
  if (withErrorBoundary) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        {layoutContent}
      </ErrorBoundary>
    );
  }

  return layoutContent;
};

// Display name for debugging
AppLayout.displayName = 'AppLayout';

export default AppLayout;

/**
 * Type export for external use
 */
export type { AppLayoutProps };
