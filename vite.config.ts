import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        panel: resolve('./src/panel.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'iife',
        name: 'BugTrace',
        inlineDynamicImports: true
      }
    },
    target: 'es2020',
    sourcemap: false,
    minify: false,
    cssCodeSplit: false
  },
  resolve: {
    alias: {
      '@': resolve('./src')
    }
  },
  define: {
    global: 'globalThis',
  }
})
