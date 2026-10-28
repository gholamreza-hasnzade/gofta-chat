import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  server: { host: '0.0.0.0', port: 3000, strictPort: true, allowedHosts: true },
  build: {
    lib: {
      entry: resolve(process.cwd(), 'src/embed.ts'),
      name: 'GoftaChatBundle',
      formats: ['iife'],
      fileName: () => 'gofta-chat-widget.js',
    },
    cssCodeSplit: false,
    sourcemap: false,
  },
})
