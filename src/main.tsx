import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FeatureFlagsProvider } from "./providers/FeatureFlagsProvider";
import { initPerformanceMonitoring } from "@/lib/performance-monitor";
import { initSentry } from "@/lib/sentry";
import { initCloudflareBeacon } from "@/lib/cloudflare";

initSentry();
initCloudflareBeacon();
initPerformanceMonitoring();

createRoot(document.getElementById("root")!).render(
  <FeatureFlagsProvider>
    <App />
  </FeatureFlagsProvider>
);
