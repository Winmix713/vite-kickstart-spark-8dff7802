import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Determine if we're using local Supabase
const isLocalDev = process.env.VITE_SUPABASE_URL?.includes("localhost");
const supabaseUrl = process.env.VITE_SUPABASE_URL || "http://localhost:54321";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Proxy configuration for local Supabase development
    // Routes /functions/v1/* to the local Supabase edge functions runtime
    // For hosted environments, this proxy is disabled and requests go directly to the hosted Supabase URL
    proxy: isLocalDev
      ? {
          "/functions/v1": {
            target: supabaseUrl,
            changeOrigin: true,
            rewrite: (path) => path, // Keep the path as-is
          },
        }
      : {},
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@winmixpro", replacement: path.resolve(__dirname, "./src/winmixpro") },
      { find: "react-flow-renderer", replacement: path.resolve(__dirname, "./src/vendor/react-flow-renderer.tsx") },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks with more granular splitting
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
              return 'utils-vendor';
            }
            // All other node_modules go into vendor chunk
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    minify: 'esbuild',
  },
}));
