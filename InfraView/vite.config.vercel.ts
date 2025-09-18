import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./client/src"),
      "@shared": path.resolve("./shared"),
      "@assets": path.resolve("./attached_assets"),
    },
  },
  root: "./client",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  optimizeDeps: {
    exclude: [],
  },
});