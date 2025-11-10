import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src/frontend'), // ให้ root เป็น folder frontend
  build: {
    outDir: path.resolve(__dirname, 'dist/frontend'), // output folder
    rollupOptions: {
      input: path.resolve(__dirname, 'src/frontend/main.tsx'), // entry point ของคุณ
    },
  },
})