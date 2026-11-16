import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  // read client/.env* (all keys, not only VITE_*) — API_TARGET is dev-server only
  // and must not be exposed to the browser bundle, so it has no VITE_ prefix
  const env = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "");
  // where the API server runs; set API_TARGET in client/.env to share another
  // machine's API (its database AND its uploaded images), e.g. http://192.168.1.50:4000
  const apiTarget = (env.API_TARGET || "http://localhost:4000").replace(/\/+$/, "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, // listen on 0.0.0.0 so other devices on the LAN can connect
      // dev only: forward to the API server so relative /api and /uploads work like in production
      proxy: {
        "/api": apiTarget,
        "/uploads": apiTarget,
      },
    },
  };
});
