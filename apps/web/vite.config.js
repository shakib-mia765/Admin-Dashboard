import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const DEFAULTS = Object.freeze({
  host: "127.0.0.1",
  port: 5173,
  previewPort: 4173,
  apiUrl: "http://localhost:3000",
  chunkWarningLimit: 750
});

const toPort = (value, fallback) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65_535 ? port : fallback;
};

const toUrl = (value, fallback) => {
  try {
    return new URL(value || fallback).origin;
  } catch {
    throw new Error(`Invalid VITE_API_URL: ${value}`);
  }
};

const manualChunks = (id) => {
  if (!id.includes("node_modules")) return;
  if (/node_modules\/(react|react-dom|react-router)/.test(id)) return "react";
  if (/node_modules\/(@tanstack|axios)/.test(id)) return "data";
  if (/node_modules\/(recharts|d3-|chart\.js)/.test(id)) return "charts";
  if (/node_modules\/(zod|date-fns|dayjs|lodash-es)/.test(id)) return "utilities";
  return "vendor";
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const production = mode === "production";
  const apiUrl = toUrl(env.VITE_API_URL, DEFAULTS.apiUrl);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      },
      dedupe: ["react", "react-dom"]
    },
    server: {
      host: env.VITE_HOST || DEFAULTS.host,
      port: toPort(env.VITE_PORT, DEFAULTS.port),
      strictPort: true,
      open: false,
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
          secure: production,
          ws: true
        }
      }
    },
    preview: {
      host: DEFAULTS.host,
      port: toPort(env.VITE_PREVIEW_PORT, DEFAULTS.previewPort),
      strictPort: true
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: env.VITE_SOURCEMAP === "true",
      manifest: true,
      emptyOutDir: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: DEFAULTS.chunkWarningLimit,
      rolldownOptions: {
        output: {
          manualChunks,
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]"
        }
      }
    },
    esbuild: {
      legalComments: "none",
      drop: production ? ["debugger"] : []
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
      exclude: []
    }
  };
});
