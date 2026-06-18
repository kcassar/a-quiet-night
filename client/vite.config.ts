import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev we proxy /api requests to the Express server on port 3000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
