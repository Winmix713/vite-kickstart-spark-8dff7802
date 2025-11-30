import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // A .tsx kiterjesztés elhagyható, tisztább kód
import './index.css';
import { initPerformanceMonitoring } from '@/lib/performance-monitor';
import { initSentry } from '@/lib/sentry';
import { initCloudflareBeacon } from '@/lib/cloudflare';

// Initialize monitoring and error tracking
initSentry();
initCloudflareBeacon();
initPerformanceMonitoring();

// Render app (providers are already inside App.tsx)
const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}