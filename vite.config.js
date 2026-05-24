import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true,
  },
  build: {
    rolldownOptions: {
      output: {
        // Split heavy / rarely-used libraries into their own chunks so
        // pages that don't need them don't pay the download cost.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/](three|@react-three[\\/](fiber|drei))[\\/]/.test(id))
            return "three";
          if (/[\\/]recharts[\\/]/.test(id) || /[\\/]d3-/.test(id))
            return "charts";
          if (/[\\/]react-router(-dom)?[\\/]/.test(id)) return "router";
          if (/[\\/]framer-motion[\\/]/.test(id)) return "motion";
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id))
            return "react-vendor";
        },
      },
    },
    // Bump warning above the largest expected chunk (three.js) so the
    // build doesn't print noise on every successful build.
    chunkSizeWarningLimit: 800,
  },
});
