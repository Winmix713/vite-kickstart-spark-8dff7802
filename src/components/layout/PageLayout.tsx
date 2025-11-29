import React, { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  /** When true, wraps children in a centered container with standard paddings */
  container?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PageLayout - Content wrapper component
 * Note: This component does NOT include Sidebar/TopBar. 
 * Those are managed by AppLayout at the routing level.
 */
const PageLayout: React.FC<PageLayoutProps> = ({ children, container = true, className = "" }) => {
  return (
    <main className={`min-h-screen ${className}`}>
      {container ? (
        <div className="container mx-auto px-4 py-8">{children}</div>
      ) : (
        children
      )}
    </main>
  );
};

export default PageLayout;
