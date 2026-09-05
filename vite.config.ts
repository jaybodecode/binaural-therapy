import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// When deployed under a subpath (e.g. GitHub Pages at
// https://user.github.io/repo-name/) we must set `base` to that subpath so
// the emitted JS/CSS/manifest references resolve correctly. For the local
// dev server this also works because dev URLs don't go through GitHub's
// subpath rewriting. When a custom CNAME is added, change this to '/'.
const BASE = process.env.VITE_BASE_PATH || '/binaural-therapy/'

export default defineConfig({
  base: BASE,
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      base: BASE,
      registerType: 'prompt',
      injectRegister: 'auto',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/loops/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'loops',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/attribution/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'attribution',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      manifest: {
        name: 'Binaural Therapy',
        short_name: 'Binaural',
        description:
          'State-transitioning binaural beats and colored noise for sleep, relaxation, and focus.',
        theme_color: '#0b0d10',
        background_color: '#0b0d10',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/binaural-therapy/pwa-icons/manifest-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/binaural-therapy/pwa-icons/manifest-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/binaural-therapy/pwa-icons/manifest-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
})
