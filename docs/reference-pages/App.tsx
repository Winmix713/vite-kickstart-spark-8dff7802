import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import AppRoutes from "@/components/AppRoutes";
import ErrorBoundary from "@/components/ErrorBoundary";
import logger from "@/lib/logger";
import { captureExceptionSafe } from "@/lib/sentry";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary
            onError={(error, info) => {
              logger.error("Unhandled UI error", error, { componentStack: info.componentStack }, "ErrorBoundary");
              captureExceptionSafe(error, { componentStack: info.componentStack });
            }}
          >
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
