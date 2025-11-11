import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  root: path.resolve(__dirname, 'src/frontend'), // ให้ root เป็น folder frontend
  build: {
    outDir: path.resolve(__dirname, 'dist/frontend'), // output folder
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/frontend/index.html'), // entry point ของคุณ
    },
  },
})