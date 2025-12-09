import { defineConfig, type UserConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { fileURLToPath } from "url";
import { visualizer } from "rollup-plugin-visualizer";
import { componentTagger } from "lovable-tagger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const STYLED_COMPONENTS_INVALID_PROPS: readonly string[] = [
  'isCompact', 'isLoading', 'isActive', 'isOpen', 'isDisabled', 
  'color1', 'color2', 'barHeight', 'variant', 'size', 'fullWidth', 'isDuo'
];

const ALIASES = {
  "@": path.resolve(__dirname, "./src"),
  "@components": path.resolve(__dirname, "./src/components"),
  "@ui": path.resolve(__dirname, "./src/ui"),
  "@pages": path.resolve(__dirname, "./src/pages"),
  "@assets": path.resolve(__dirname, "./src/assets"),
  "@styles": path.resolve(__dirname, "./src/styles"),
  "@db": path.resolve(__dirname, "./src/db"),
  "@hooks": path.resolve(__dirname, "./src/hooks"),
  "@layout": path.resolve(__dirname, "./src/layout"),
  "@fonts": path.resolve(__dirname, "./src/fonts"),
  "@utils": path.resolve(__dirname, "./src/utils"),
  "@widgets": path.resolve(__dirname, "./src/widgets"),
  "@contexts": path.resolve(__dirname, "./src/contexts"),
  "@constants": path.resolve(__dirname, "./src/constants"),
  "@features": path.resolve(__dirname, "./src/features"),
  "@providers": path.resolve(__dirname, "./src/providers"),
  "@services": path.resolve(__dirname, "./src/services"),
  "@cms": path.resolve(__dirname, "./src/cms"),
};

export default defineConfig(({ mode }): UserConfig => {
  const isDevelopment = mode === 'development';
  const isProduction = mode === 'production';

  return {
    plugins: [
      react({
        babel: {
          plugins: [
            [
              "babel-plugin-styled-components",
              {
                displayName: isDevelopment,
                fileName: isDevelopment,
                ssr: true,
                pure: isProduction,
                shouldForwardProp: (prop: string) => !STYLED_COMPONENTS_INVALID_PROPS.includes(prop),
              },
            ],
          ],
        },
      }),
      svgr({
        svgrOptions: {
          icon: true,
          exportType: "default",
        },
      }),
      isProduction && visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
      isDevelopment && componentTagger(),
    ].filter(Boolean) as Plugin[],

    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },

    resolve: {
      alias: ALIASES,
    },

    css: {
      devSourcemap: isDevelopment,
      modules: {
        generateScopedName: isDevelopment ? "[name]__[local]__[hash:base64:5]" : "[hash:base64:5]",
      },
      preprocessorOptions: {
        scss: {
          // additionalData: `@import "./src/styles/variables.scss";`,
        },
      },
    },

    build: {
      target: "es2020",
      outDir: "dist",
      sourcemap: isDevelopment,
      minify: isProduction ? "esbuild" : false,
      cssCodeSplit: true,
      assetsInlineLimit: 4096, // 4KB
      modulePreload: {
        polyfill: true,
      },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            emotion: ["@emotion/react", "@emotion/styled"],
            mui: ["@mui/material", "@mui/styled-engine-sc"],
          },
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name?.split('.').pop() || '';
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'INVALID_ANNOTATION') {
            return;
          }
          warn(warning);
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      reportCompressedSize: isProduction,
      chunkSizeWarningLimit: 600,
    },
    
    optimizeDeps: {
        force: true,
        include: [
          'styled-components',
          '@mui/material',
          '@mui/styled-engine-sc',
          '@emotion/react',
          '@emotion/styled',
          '@emotion/cache',
          '@emotion/utils',
          'react-is',
          'hoist-non-react-statics',
          'rtl-detect'
        ],
    },

    server: {
      host: "::",
      port: 8080,
      strictPort: true,
      open: false,
      cors: true,
      hmr: {
        overlay: isDevelopment,
      },
      fs: {
        strict: true,
      },
      watch: {
        ignored: ['**/node_modules/**', '**/dist/**'],
      }
    },

    preview: {
      host: "::",
      port: 4173,
      strictPort: true,
      open: false,
    },

    json: {
        stringify: true,
    },

    logLevel: 'info',

    clearScreen: false,

    esbuild: {
        legalComments: 'none',
    }
  };
});
