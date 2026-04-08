import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. 이거 추가

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. 이거 추가
  ],
})