import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// 1. Fallbacks Inteligentes: Assume valores padrão se as variáveis não existirem
const port = process.env.PORT ? parseInt(process.env.PORT) : 5173;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Foram removidos os plugins @replit/vite-plugin-runtime-error-modal, 
    // cartographer e dev-banner, pois causam problemas fora do ambiente deles.
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
server: {
    port,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: true,
    // ADICIONE ESTE BLOCO DE PROXY AQUI:
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});