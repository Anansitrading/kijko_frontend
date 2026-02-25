import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        // Sandra API routes (must come before catch-all /api/v1)
        "/api/v1/ide": {
          target: "http://localhost:8200",
          changeOrigin: true,
          ws: true,
        },
        "/api/v1/sessions": {
          target: "http://localhost:8200",
          changeOrigin: true,
        },
        "/api/v1/chronos": {
          target: "http://localhost:8200",
          changeOrigin: true,
        },
        "/api/v1/scrubber": {
          target: "http://localhost:8200",
          changeOrigin: true,
        },
        "/api/v1/stream": {
          target: "http://localhost:8200",
          changeOrigin: true,
        },
        "/api/v1/kijko": {
          target: "http://localhost:8200",
          changeOrigin: true,
        },
        "/api/v1/checkpoints": {
          target: "http://localhost:8200",
          changeOrigin: true,
        },
        "/api/v1/presets": {
          target: "http://localhost:8200",
          changeOrigin: true,
        },
        "/api/v1/keymaker": {
          target: "http://localhost:8200",
          changeOrigin: true,
        },
        // Kijko backend (catch-all for remaining /api/v1 routes)
        "/api/v1": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/health": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/api/hypervisa": {
          target: "http://localhost:8042",
          changeOrigin: true,
        },
      },
    },
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
