import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // pdf.js ships an ES-module worker; emit bundled workers (?worker imports) as ES modules
  // so they resolve correctly in the production build.
  worker: {
    format: 'es',
  },
  build: {
    // Split heavy libraries into their own cacheable chunks instead of one
    // ~4.4 MB bundle. Combined with React.lazy routes, the landing/login path
    // no longer downloads grapesjs / swagger-ui / xlsx / pdfjs.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom', 'react-router-dom'],
          'grapesjs':       ['grapesjs'],
          'swagger':        ['swagger-ui-react'],
          'xlsx':           ['xlsx'],
          'pdfjs':          ['pdfjs-dist'],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Forward springdoc OpenAPI spec and Swagger UI assets to the backend
      '/v3': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/swagger-ui': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
