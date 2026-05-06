import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/pwa-192.svg', 'icons/pwa-512.svg'],
      manifest: {
        name: 'DeadBug',
        short_name: 'DeadBug',
        description: '개발자 커뮤니티 플랫폼 — 질문, 코드 리뷰, 실시간 채팅',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
