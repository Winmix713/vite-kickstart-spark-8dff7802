import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        statements: 40,
        branches: 30,
        functions: 35,
        lines: 40,
      },
    },
    env: {
      VITE_SUPABASE_URL: "https://api.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://api.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      {
        find: "react-flow-renderer",
        replacement: path.resolve(__dirname, "./src/vendor/react-flow-renderer.tsx"),
      },
    ],
  },
});
