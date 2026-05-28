import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["localhost", "127.0.0.1", "haste-dropbox-cardigan.ngrok-free.dev"],
    proxy: {
      "/api": {
        target: "http://localhost:3636",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:3636",
        rewrite: (path) => `/api/v1${path}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
