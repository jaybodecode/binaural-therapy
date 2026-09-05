import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// The app is served at the repo ROOT via the custom domain
// (aura.sharefront.net -> jaybodecode.github.io), so `base` defaults to
// '/'. If ever hosted as a GH Pages repo subpath instead
// (https://user.github.io/binaural-therapy/), deploy with
// VITE_BASE_PATH=/binaural-therapy/ to rewrite all emitted URLs.
const BASE = process.env.VITE_BASE_PATH || '/'

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
        globPatterns: ['**/*.{js,css,svg,png,ico,webp,woff,woff2,mp3,opus}', 'index.html'],
        // Exclude spike-audio.html from precache so we can iterate on it
        // without forcing a service-worker reinstall on every edit.
        navigateFallbackDenylist: [/^\/api/, /^\/spike-audio\.html$/],
        globIgnores: ['**/spike-audio.html'],
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
        start_url: BASE,
        scope: BASE,
        icons: [
          {
            src: `${BASE}pwa-icons/manifest-icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: `${BASE}pwa-icons/manifest-icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: `${BASE}pwa-icons/manifest-icon-512.png`,
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
