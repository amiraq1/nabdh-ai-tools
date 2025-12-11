import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    minify: 'esbuild', // Faster minification
    target: 'esnext', // Modern browsers
    cssCodeSplit: true, // Split CSS into separate files
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
          // Heavy libraries - loaded on demand
          'xlsx': ['xlsx'],
          'pdfmake': ['pdfmake'],
          'recharts': ['recharts'],
          'zod': ['zod'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn if chunk exceeds 500KB
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
