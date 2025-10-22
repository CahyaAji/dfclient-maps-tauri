import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://192.168.17.17:8087",
        changeOrigin: true,
      },
      "/df": {
        target: "ws://192.168.17.17:8087",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: [
      "@tauri-apps/api",
      "@tauri-apps/plugin-http",
      "@tauri-apps/plugin-dialog",
      "@tauri-apps/plugin-fs",
      "@tauri-apps/plugin-process",
    ],
  },
  build: {
    target: "esnext",
  },
});
