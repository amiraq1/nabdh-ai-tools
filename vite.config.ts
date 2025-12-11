import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
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
