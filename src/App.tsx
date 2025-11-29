import { Toaster } from "@/components/ui/toaster";
import ToastPortal from "@/components/ui/ToastPortal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { FeatureFlagsProvider } from "@/providers/FeatureFlagsProvider";
import AppRoutes from "@/components/AppRoutes";
import ErrorBoundary from "@/components/ErrorBoundary";
import logger from "@/lib/logger";
import { captureExceptionSafe } from "@/lib/sentry";

// Configure TanStack Query with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds that data remains fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Time in milliseconds that inactive queries will remain in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      // Number of times to retry failed requests
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Delay between retries (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Enable refetch on window focus in development
      refetchOnWindowFocus: import.meta.env.DEV,
      // Disable refetch on reconnect by default
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Error handling for mutations
      onError: (error) => {
        logger.error("Mutation error:", error);
        if (import.meta.env.PROD) {
          captureExceptionSafe(error);
        }
      },
    },
  },
});

const App = () => (
  <ErrorBoundary
    onError={(error, info) => {
      logger.error("Unhandled UI error", error, { componentStack: info.componentStack }, "ErrorBoundary");
      captureExceptionSafe(error, { componentStack: info.componentStack });
    }}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <FeatureFlagsProvider>
            <AuthProvider>
              <AppRoutes />
              {/* Toast notifications */}
              <ToastPortal />
              {/* Shadcn toast component */}
              <Toaster />
            </AuthProvider>
          </FeatureFlagsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
