import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Preload the latin Inter Tight woff2 (imported via @fontsource-variable/inter-tight in
 * main.jsx) so the browser fetches it with the HTML instead of after the CSS is parsed.
 * Only the latin subset — latin-ext etc. stay on-demand via unicode-range.
 */
function preloadLatinFont() {
  let base = '/'
  return {
    name: 'braify-preload-latin-font',
    apply: 'build',
    configResolved(config) { base = config.base },
    transformIndexHtml(html, ctx) {
      const asset = Object.values(ctx.bundle || {}).find(
        f => f.type === 'asset' && /inter-tight-latin-wght-normal.*\.woff2$/.test(f.fileName)
      )
      if (!asset) return html
      return [{
        tag: 'link',
        attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `${base}${asset.fileName}` },
        injectTo: 'head',
      }]
    },
  }
}

export default defineConfig({
  plugins: [react(), preloadLatinFont()],
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
