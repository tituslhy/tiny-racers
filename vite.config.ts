import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon-180.png'],
      manifest: {
        name: 'Tiny Racers',
        short_name: 'Tiny Racers',
        description: 'A simple offline racing game for young children.',
        theme_color: '#38bdf8',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        id: '/',
        lang: 'en',
        categories: ['games', 'kids'],
        icons: [
          {
            src: '/icons/tiny-racers-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/tiny-racers-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/tiny-racers-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
