import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Tiny Racers',
        short_name: 'Tiny Racers',
        description: 'A simple offline racing game for young children.',
        theme_color: '#38bdf8',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
      },
    }),
  ],
})
