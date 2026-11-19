import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// To the browser, /api is same-origin with the page (this dev server), so CORS
// doesn't apply. But the proxy forwards the browser's Origin header, and the
// API checks it against its CLIENT_ORIGIN list — so opening the site by LAN IP
// (http://192.168.x.x:5173) got POSTs such as sign-in rejected. Dropping the
// header makes the proxied call look like the server-to-server call it is.
const proxyTo = (target) => ({
  target,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
  },
});

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
        "/api": proxyTo(apiTarget),
        "/uploads": proxyTo(apiTarget),
      },
    },
  };
});
